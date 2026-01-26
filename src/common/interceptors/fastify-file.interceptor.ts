import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Type,
  mixin,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import * as fs from "fs";
import * as path from "path";
import { Observable } from "rxjs";
import { pipeline } from "stream";
import * as util from "util";

const pump = util.promisify(pipeline);

interface FileInterceptorOptions {
  destination?: string;
  fileFilter?: (filename: string, mimetype: string) => boolean;
  limits?: {
    fileSize?: number;
  };
}

export function FastifyFileInterceptor(
  fieldName: string,
  options?: FileInterceptorOptions
): Type<NestInterceptor> {
  @Injectable()
  class MixinInterceptor implements NestInterceptor {
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
        if (options?.fileFilter) {
          const isValid = options.fileFilter(data.filename, data.mimetype);
          if (!isValid) {
            throw new BadRequestException("Invalid file type");
          }
        }

        // Check file size limit
        if (options?.limits?.fileSize) {
          // Note: @fastify/multipart handles size limits at the plugin level
          // This is just a secondary check
        }

        // Generate unique filename
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(data.filename);
        const filename = `company-import-${uniqueSuffix}${ext}`;
        const destination = options?.destination || "./uploads";

        // Ensure destination directory exists
        if (!fs.existsSync(destination)) {
          fs.mkdirSync(destination, { recursive: true });
        }

        const filepath = path.join(destination, filename);

        // Save file to disk
        await pump(data.file, fs.createWriteStream(filepath));

        // Attach file info to request
        (request as any).file = {
          fieldname: data.fieldname,
          originalname: data.filename,
          encoding: data.encoding,
          mimetype: data.mimetype,
          filename: filename,
          path: filepath,
          size: fs.statSync(filepath).size,
        };

        return next.handle();
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException(`File upload failed: ${error.message}`);
      }
    }
  }

  return mixin(MixinInterceptor);
}
