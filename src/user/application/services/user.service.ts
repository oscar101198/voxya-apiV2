import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { compareSync, hashSync } from "bcryptjs";
import { plainToClass } from "class-transformer";
import { generateAuthToken } from "src/_utils";
import { UserEntity } from "src/user/infrastructure/typeorm/entities";
import { UserOrmRepository } from "src/user/infrastructure/typeorm/repositories";
import {
  CreateUserInput,
  RegisterFcmTokenInput,
  UpdateUserInput,
} from "src/user/interfaces/dto";

@Injectable()
export class UserService {
  constructor(
    @Inject(UserOrmRepository)
    private readonly userRepository: UserOrmRepository
  ) {}

  public auth({ user, password }: { user: UserEntity; password: string }) {
    if (Boolean(user) && compareSync(password, user.password))
      return {
        accessToken: generateAuthToken({
          userID: user.id,
        }),
      };

    return {
      accessToken: null,
    };
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
