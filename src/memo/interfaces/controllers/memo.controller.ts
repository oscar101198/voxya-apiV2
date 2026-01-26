import {
  BadRequestException,
  Controller,
  Delete,
  Post,
  Query,
  Req,
  UseInterceptors,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { FastifyRequest } from "fastify";
import {
  BearerAuth,
  GetAuthenticatedUser,
  Payload,
} from "src/default/default.decorators";
import { DefaultCodeEnum } from "src/default/default.enums";
import { AuthenticatedUser } from "src/user/interfaces";
import { MemoService } from "../../application";
import { CreateMemoOutput, GetMemoQuery } from "../dto";
import { MemoFileInterceptor } from "../interceptors/memo-file.interceptor";

interface FileUpload {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller("memo")
@ApiTags("memo")
export class MemoController {
  constructor(private readonly memoService: MemoService) {}

  @Post()
  @BearerAuth()
  @UseInterceptors(
    new MemoFileInterceptor({
      fileFilter: (filename: string, mimetype: string) => {
        return mimetype.startsWith("audio/");
      },
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
    })
  )
  @Payload({ code: DefaultCodeEnum.SUCCESS_OK, type: CreateMemoOutput })
  async createMemo(
    @Req() request: FastifyRequest,
    @GetAuthenticatedUser() user: AuthenticatedUser
  ): Promise<CreateMemoOutput> {
    const file = (request as any).file as FileUpload;

    if (!file) {
      throw new BadRequestException("File not found in request");
    }

    const memo = await this.memoService.createMemo(
      file,
      user.id,
      user.tenantId
    );

    return {
      id: memo.id,
      audioUrl: memo.audioUrl,
      fileName: memo.fileName,
      fileSize: memo.fileSize,
      createdAt: memo.createdAt,
    };
  }

  @Delete()
  @BearerAuth()
  @Payload({ code: DefaultCodeEnum.SUCCESS_OK })
  async deleteMemo(
    @Query() query: GetMemoQuery,
    @GetAuthenticatedUser() user: AuthenticatedUser
  ): Promise<{ message: string }> {
    await this.memoService.deleteMemo(query.id, user.tenantId);
    return { message: "Memo supprimé avec succès" };
  }
}
