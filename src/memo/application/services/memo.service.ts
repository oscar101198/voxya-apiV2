import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { plainToClass } from "class-transformer";
import { StorageService } from "src/infrastructure/storage/storage.service";
import { UserOrmRepository } from "src/user/infrastructure/typeorm/repositories";
import { MemoOrmRepository } from "src/memo/infrastructure/typeorm/repositories";
import { MemoEntity } from "src/memo/infrastructure/typeorm/entities";

interface FileUpload {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class MemoService {
  private readonly logger = new Logger(MemoService.name);
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly ALLOWED_MIME_TYPES = [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
    "audio/mp4",
    "audio/m4a",
    "audio/ogg",
    "audio/oga",
    "audio/webm",
    "audio/aac",
    "audio/flac",
  ];

  constructor(
    @Inject(MemoOrmRepository)
    private readonly memoRepository: MemoOrmRepository,
    @Inject(UserOrmRepository)
    private readonly userRepository: UserOrmRepository,
    private readonly storageService: StorageService
  ) {}

  /**
   * Validate audio file
   */
  private validateAudioFile(file: FileUpload): void {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.ALLOWED_MIME_TYPES.join(", ")}`
      );
    }
  }

  /**
   * Create a new memo
   */
  async createMemo(
    file: FileUpload,
    userId: string,
  ): Promise<MemoEntity> {
    // 1. Validate that the user exists and belongs to the tenant
    const user = await this.userRepository.findById(userId, null);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // 2. Validate the audio file
    this.validateAudioFile(file);

    // 3. Generate a unique key for MinIO
    const audioKey = this.storageService.generateKey(userId, file.originalname);

    let uploadedUrl: string;
    try {
      // 4. Upload file to MinIO
      uploadedUrl = await this.storageService.uploadFile(
        file.buffer,
        audioKey,
        file.mimetype
      );
    } catch (error) {
      this.logger.error(`Failed to upload file to MinIO: ${error.message}`, error.stack);
      throw new BadRequestException("Failed to upload file to storage");
    }

    try {
      // 5. Create memo entity in database
      const memo = await this.memoRepository.save({
        userId,
        audioUrl: uploadedUrl,
        audioKey,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return plainToClass(MemoEntity, memo, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      // 6. Rollback: delete file from MinIO if database creation fails
      this.logger.error(
        `Failed to create memo in database: ${error.message}`,
        error.stack
      );
      try {
        await this.storageService.deleteFile(audioKey);
        this.logger.log(`Cleaned up file from MinIO: ${audioKey}`);
      } catch (deleteError) {
        this.logger.error(
          `Failed to cleanup file from MinIO: ${deleteError.message}`,
          deleteError.stack
        );
      }
      throw new BadRequestException("Failed to create memo");
    }
  }

  /**
   * Delete a memo (soft delete + delete file from MinIO)
   */
  async deleteMemo(id: string, tenantId: string): Promise<boolean> {
    // 1. Retrieve memo by ID with tenant validation
    const memo = await this.memoRepository.findById(id, tenantId);
    if (!memo) {
      throw new NotFoundException("Memo not found or does not belong to tenant");
    }

    // 2. Delete file from MinIO (log error but continue if it fails)
    try {
      await this.storageService.deleteFile(memo.audioKey);
      this.logger.log(`File deleted from MinIO: ${memo.audioKey}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete file from MinIO: ${error.message}`,
        error.stack
      );
      // Continue with soft delete even if MinIO deletion fails
    }

    // 3. Soft delete in database
    const deleted = await this.memoRepository.delete(id, tenantId);
    if (!deleted) {
      throw new NotFoundException("Failed to delete memo");
    }

    return true;
  }
}
