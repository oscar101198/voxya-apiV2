import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  HttpCode,
  Type,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiHeaders, ApiResponse } from "@nestjs/swagger";
import { AuthenticatedUser } from "src/user/interfaces";
import {
  DefaultCodeEnum,
  DefaultCodeMessageEnum,
  LocaleEnum,
} from "./default.enums";

interface IPayload {
  code: DefaultCodeEnum;
  message?: string | undefined;
  type?: Type<unknown> | string | undefined;
}
export const Payload = (...payloads: IPayload[]) => {
  const decorators: (MethodDecorator | ClassDecorator | PropertyDecorator)[] = [
    ApiHeaders([
      {
        name: "Content-Language",
        required: false,
        description: `Values "${Object.values(LocaleEnum)
          .map((locale) => locale)
          .join(", ")}" are accepted.`,
        example: LocaleEnum.fr,
      },
    ]),
    ApiResponse({
      status: DefaultCodeEnum.BAD_REQUEST,
      description: DefaultCodeMessageEnum.BAD_REQUEST,
    }),
    ...payloads.map((payload) =>
      ApiResponse({
        status: payload.code,
        description: payload.message,
        type: payload.type,
      })
    ),
  ];

  const successPayload = payloads.find(
    (payload) => payload.code === DefaultCodeEnum.SUCCESS_OK
  );

  if (successPayload) decorators.push(HttpCode(successPayload.code));

  return applyDecorators(...decorators);
};

export const BearerAuth = () => {
  return applyDecorators(
    UseGuards(AuthGuard("jwt")),
    ApiBearerAuth(),
    ApiResponse({
      status: DefaultCodeEnum.UNAUTHORIZED,
      description: DefaultCodeMessageEnum.UNAUTHORIZED,
    }),
    ApiResponse({
      status: DefaultCodeEnum.FORBIDDEN,
      description: DefaultCodeMessageEnum.FORBIDDEN,
    }),
    ApiHeaders([
      {
        name: "Authorization",
        required: true,
        description: `Bearer token`,
        example: "Bearer {{ TOKEN }}",
      },
    ])
  );
};

export const GetAuthenticatedUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthenticatedUser;
  }
);
