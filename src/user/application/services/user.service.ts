import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { compareSync, hashSync } from "bcryptjs";
import { plainToClass } from "class-transformer";
import {
  createRefreshTokenValue,
  generateAccessToken,
  hashRefreshToken,
} from "src/_utils";
import { UserEntity } from "src/user/infrastructure/typeorm/entities";
import {
  RefreshTokenOrmRepository,
  UserOrmRepository,
} from "src/user/infrastructure/typeorm/repositories";
import {
  CreateUserInput,
  RegisterFcmTokenInput,
  UpdateUserInput,
} from "src/user/interfaces/dto";

@Injectable()
export class UserService {
  constructor(
    @Inject(UserOrmRepository)
    private readonly userRepository: UserOrmRepository,
    @Inject(RefreshTokenOrmRepository)
    private readonly refreshTokenRepository: RefreshTokenOrmRepository,
    private readonly configService: ConfigService
  ) {}

  public async auth({
    user,
    password,
  }: {
    user: UserEntity;
    password: string;
  }): Promise<{ accessToken: string; refreshToken: string } | { accessToken: null }> {
    if (!user || !compareSync(password, user.password)) {
      return { accessToken: null };
    }

    const accessToken = generateAccessToken({ userID: user.id });
    const { token: refreshToken, tokenHash } = createRefreshTokenValue();
    const refreshExpirationMs =
      Number(
        this.configService.get(
          "JWT_REFRESH_TOKEN_EXPIRATION_TIME_IN_MILLISECONDS"
        )
      ) || 604800000; // default 7 days
    const expiresAt = new Date(Date.now() + refreshExpirationMs);

    await this.refreshTokenRepository.save({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  // Find user by email without tenant filter (for login)
  public findByEmailForAuth(email: string): Promise<UserEntity | null> {
    return this.userRepository.findByEmailForAuth(email);
  }

  public findByEmail(
    email: string,
    tenantId: string
  ): Promise<UserEntity | null> {
    return this.userRepository.findByEmail(email, tenantId);
  }

  // Create user
  async createUser(
    input: CreateUserInput,
    tenantId: string
  ): Promise<UserEntity> {
    const hashedPassword = hashSync(input.password, 10);

    const user = await this.userRepository.save({
      ...input,
      password: hashedPassword,
      tenantId: tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const completeUser = await this.userRepository.findById(
      user.id,
      tenantId
    );
    if (!completeUser) {
      throw new Error("Failed to retrieve created user");
    }

    return plainToClass(UserEntity, completeUser, {
      excludeExtraneousValues: true,
    });
  }

  // Get user by ID
  async getUserById(
    id: string,
    tenantId: string
  ): Promise<UserEntity> {
    const user = await this.userRepository.findById(id, tenantId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    return plainToClass(UserEntity, user, {
      excludeExtraneousValues: true,
    });
  }

  // Get all users
  async getAllUsers(
    tenantId: string,
    limit?: number,
    offset?: number,
    search?: string,
    sort?: string,
    order?: "asc" | "desc"
  ): Promise<[UserEntity[], number]> {
    const [users, total] = await this.userRepository.findAll(
      tenantId,
      limit,
      offset,
      search,
      sort,
      order
    );

    const transformedUsers = users.map((user) =>
      plainToClass(UserEntity, user, {
        excludeExtraneousValues: true,
      })
    );

    return [transformedUsers, total];
  }

  async getUserCount(tenantId: string): Promise<number> {
    return this.userRepository.getUserCount(tenantId);
  }

  // Update user
  async updateUser(
    id: string,
    input: UpdateUserInput,
    tenantId: string
  ): Promise<UserEntity> {
    const existingUser = await this.userRepository.findById(
      id,
      tenantId
    );
    if (!existingUser) {
      throw new NotFoundException("User not found");
    }

    const updateData: Partial<UserEntity> = {
      ...input,
      updatedAt: new Date(),
    };

    // Hash password if provided
    if (input.password) {
      updateData.password = hashSync(input.password, 10);
    }

    const updatedUser = await this.userRepository.update(
      id,
      updateData,
      tenantId
    );
    if (!updatedUser) {
      throw new Error("Failed to update user");
    }

    if (input.password) {
      await this.revokeRefreshTokensByUserId(id);
    }

    return plainToClass(UserEntity, updatedUser, {
      excludeExtraneousValues: true,
    });
  }

  // Delete user
  async deleteUser(id: string, tenantId: string): Promise<boolean> {
    const existingUser = await this.userRepository.findById(
      id,
      tenantId
    );
    if (!existingUser) {
      throw new NotFoundException("User not found");
    }

    return await this.userRepository.delete(id, tenantId);
  }

  // Update last login
  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(
      userId,
      {
        lastLogin: new Date(),
        updatedAt: new Date(),
      },
      null // tenantId not needed for this update
    );
  }

  async refresh(
    refreshTokenValue: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = hashRefreshToken(refreshTokenValue);
    const record = await this.refreshTokenRepository.findByTokenHash(tokenHash);
    if (!record || record.expiresAt <= new Date()) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
    const user = await this.userRepository.findByIdForAuth(record.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException("User not found or inactive");
    }
    // Rotation: delete old refresh token and issue a new one
    await this.refreshTokenRepository.deleteByTokenHash(tokenHash);
    const accessToken = generateAccessToken({ userID: user.id });
    const { token: newRefreshToken, tokenHash: newTokenHash } =
      createRefreshTokenValue();
    const refreshExpirationMs =
      Number(
        this.configService.get(
          "JWT_REFRESH_TOKEN_EXPIRATION_TIME_IN_MILLISECONDS"
        )
      ) || 604800000; // default 7 days
    await this.refreshTokenRepository.save({
      userId: user.id,
      tokenHash: newTokenHash,
      expiresAt: new Date(Date.now() + refreshExpirationMs),
    });
    return { accessToken, refreshToken: newRefreshToken };
  }

  async revokeRefreshTokensByUserId(userId: string): Promise<void> {
    await this.refreshTokenRepository.deleteByUserId(userId);
  }

  async revokeRefreshToken(refreshTokenValue: string): Promise<void> {
    const tokenHash = hashRefreshToken(refreshTokenValue);
    await this.refreshTokenRepository.deleteByTokenHash(tokenHash);
  }

  // Register FCM token
    async registerFcmToken(
      userId: string,
      input: RegisterFcmTokenInput,
      tenantId: string
    ): Promise<UserEntity> {
      const existingUser = await this.userRepository.findById(
        userId,
        tenantId
      );
      if (!existingUser) {
        throw new NotFoundException("User not found");
      }
  
      const updatedUser = await this.userRepository.update(
        userId,
        {
          fcmToken: input.fcmToken,
          updatedAt: new Date(),
        },
        tenantId
      );
  
      if (!updatedUser) {
        throw new Error("Failed to register FCM token");
      }
  
      return plainToClass(UserEntity, updatedUser, {
        excludeExtraneousValues: true,
      });
    }
}
