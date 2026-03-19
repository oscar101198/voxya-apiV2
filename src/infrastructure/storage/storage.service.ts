import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { getStorageConfig, StorageConfig } from "../config/storage.config";

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;
  private config: StorageConfig;
  private formattedEndpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.config = getStorageConfig(this.configService);
    this.formattedEndpoint = this.formatEndpoint(this.config.endpoint, this.config.useSSL);
    this.initializeS3Client();
  }

  private formatEndpoint(endpoint: string, useSSL: boolean): string {
    const cleanEndpoint = endpoint.replace(/^https?:\/\//, "");
    return useSSL ? `https://${cleanEndpoint}` : `http://${cleanEndpoint}`;
  }

  private initializeS3Client(): void {
    this.s3Client = new S3Client({
      endpoint: this.formattedEndpoint,
      region: "us-east-1", // MinIO doesn't care about region, but AWS SDK requires it
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
      forcePathStyle: true, // Required for MinIO
    });

    this.logger.log(`S3 client initialized with endpoint: ${this.formattedEndpoint}`);
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureBucketExists();
      this.logger.log("Storage bucket verified/created successfully");
    } catch (error) {
      this.logger.error(
        `Failed to ensure bucket exists: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Ensure the bucket exists, create it if it doesn't
   */
  async ensureBucketExists(): Promise<void> {
    try {
      // Check if bucket exists
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.config.bucketName })
      );
      this.logger.log(`Bucket ${this.config.bucketName} already exists`);
    } catch (error: any) {
      const status = error.$metadata?.httpStatusCode;

      // If bucket doesn't exist (404), create it
      if (error.name === "NotFound" || status === 404) {
        try {
          await this.s3Client.send(
            new CreateBucketCommand({ Bucket: this.config.bucketName })
          );
          this.logger.log(`Bucket ${this.config.bucketName} created successfully`);
        } catch (createError: any) {
          this.logger.error(
            `Failed to create bucket: ${createError.message}`,
            createError.stack
          );
          throw createError;
        }
        return;
      }

      // 403: MinIO can return 403 when bucket is missing; try create, then clear credential hint if still 403
      if (status === 403) {
        try {
          await this.s3Client.send(
            new CreateBucketCommand({ Bucket: this.config.bucketName })
          );
          this.logger.log(`Bucket ${this.config.bucketName} created successfully`);
          return;
        } catch (createError: any) {
          if (createError.$metadata?.httpStatusCode === 403) {
            this.logger.error(
              `MinIO access denied (403). Set MINIO_ACCESS_KEY_ID and MINIO_SECRET_ACCESS_KEY to match MinIO root (MINIO_ROOT_USER / MINIO_ROOT_PASSWORD). Bucket: ${this.config.bucketName}`
            );
          } else {
            this.logger.error(`Failed to create bucket: ${createError.message}`, createError.stack);
          }
          throw createError;
        }
      }

      this.logger.error(
        `Failed to check bucket existence: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Generate a unique key for a file
   * Format: memos/{userId}/{timestamp}-{filename}
   */
  generateKey(userId: string, fileName: string): string {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    return `memos/${userId}/${timestamp}-${sanitizedFileName}`;
  }

  /**
   * Upload a file to MinIO and return the public URL
   */
  async uploadFile(
    file: Buffer,
    key: string,
    mimeType: string
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
        Body: file,
        ContentType: mimeType,
      });

      await this.s3Client.send(command);

      // Generate public URL
      const url = `${this.formattedEndpoint}/${this.config.bucketName}/${key}`;
      this.logger.log(`File uploaded successfully: ${key}`);
      return url;
    } catch (error: any) {
      this.logger.error(
        `Failed to upload file ${key}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Delete a file from MinIO
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to delete file ${key}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
