import { ConfigService } from "@nestjs/config";

export interface StorageConfig {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  useSSL: boolean;
  port?: number;
}

export const getStorageConfig = (
  configService: ConfigService
): StorageConfig => {
  const endpoint = configService.get<string>("MINIO_ENDPOINT");
  const accessKeyId = configService.get<string>("MINIO_ACCESS_KEY_ID");
  const secretAccessKey = configService.get<string>("MINIO_SECRET_ACCESS_KEY");
  const bucketName = configService.get<string>("MINIO_BUCKET_NAME");
  const useSSL = configService.get<string>("MINIO_USE_SSL") === "true";
  const port = configService.get<number>("MINIO_PORT");

  if (!endpoint) {
    throw new Error("MINIO_ENDPOINT is required");
  }
  if (!accessKeyId) {
    throw new Error("MINIO_ACCESS_KEY_ID is required");
  }
  if (!secretAccessKey) {
    throw new Error("MINIO_SECRET_ACCESS_KEY is required");
  }
  if (!bucketName) {
    throw new Error("MINIO_BUCKET_NAME is required");
  }

  return {
    endpoint,
    accessKeyId,
    secretAccessKey,
    bucketName,
    useSSL,
    port,
  };
};
