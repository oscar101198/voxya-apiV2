import { ConfigService } from "@nestjs/config";
import { createHash, randomBytes } from "crypto";
import { sign } from "jsonwebtoken";

const configService = new ConfigService();

const getAccessTokenExpirationSeconds = (): number => {
  const ms = configService.get("JWT_ACCESS_TOKEN_EXPIRATION_TIME_IN_MILLISECONDS");
  return Math.floor(Number(ms) / 1000);
};

export const generateAccessToken = ({ userID }: { userID: string }) => {
  const payload = {
    userID,
  };

  return sign(payload, configService.get("JWT_PRIVATE_KEY") as string, {
    algorithm: configService.get("ALGORITHM") as "HS256",
    expiresIn: getAccessTokenExpirationSeconds(),
  });
};

/** @deprecated Use generateAccessToken for new code. Kept for backward compatibility in tests. */
export const generateAuthToken = generateAccessToken;

/**
 * Creates a new opaque refresh token: random value + its hash for DB storage.
 * Client receives only `token`; store `tokenHash` in DB.
 */
export const createRefreshTokenValue = (): { token: string; tokenHash: string } => {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashRefreshToken(token);
  return { token, tokenHash };
};

/**
 * Hash a refresh token value for DB lookup (must use same algorithm as createRefreshTokenValue).
 */
export const hashRefreshToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};
