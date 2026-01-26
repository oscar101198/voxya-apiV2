import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { Observable } from "rxjs";
import { Readable } from "stream";

interface FileUpload {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

interface FileInterceptorOptions {
  fileFilter?: (filename: string, mimetype: string) => boolean;
  limits?: {
    fileSize?: number;
  };
}

@Injectable()
export class MemoFileInterceptor implements NestInterceptor {
  constructor(private readonly options?: FileInterceptorOptions) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();

    try {
      const data = await request.file();

      if (!data) {
        throw new BadRequestException("No file uploaded");
      }

      // Apply file filter if provided
      if (this.options?.fileFilter) {
        const isValid = this.options.fileFilter(data.filename, data.mimetype);
        if (!isValid) {
          throw new BadRequestException("Invalid file type");
        }
      }

      // Read file stream into buffer
      const chunks: Buffer[] = [];
      const stream = data.file as Readable;

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      // Check file size limit
      if (this.options?.limits?.fileSize && buffer.length > this.options.limits.fileSize) {
        throw new BadRequestException(
          `File size exceeds maximum allowed size of ${this.options.limits.fileSize / 1024 / 1024}MB`
        );
      }

      // Attach file info to request
      (request as any).file = {
        buffer,
        originalname: data.filename,
        mimetype: data.mimetype,
        size: buffer.length,
      } as FileUpload;

      return next.handle();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
  }
}
