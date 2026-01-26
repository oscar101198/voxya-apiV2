import { ConfigService } from "@nestjs/config";
import { sign } from "jsonwebtoken";

const configService = new ConfigService();

export const generateAuthToken = ({ userID }: { userID: string }) => {
  const payload = {
    userID,
  };

  return sign(payload, configService.get("JWT_PRIVATE_KEY") as string, {
    algorithm: configService.get("ALGORITHM"),
    expiresIn: configService.get(
      "JWT_ACCESS_TOKEN_EXPIRATION_TIME_IN_MILLISECONDS"
    ),
  });
};
