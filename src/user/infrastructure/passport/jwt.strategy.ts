import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UserOrmRepository } from "../typeorm/repositories";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userRepository: UserOrmRepository
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get("JWT_PRIVATE_KEY") as string,
      algorithms: ["HS256"],
    });
  }

  async validate(payload: { userID: string }) {
    const user = await this.userRepository.findByIdForAuth(payload.userID);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    if (!user.isActive) {
      throw new UnauthorizedException("User is not active");
    }
    return {
      ...user,
    };
  }
}
