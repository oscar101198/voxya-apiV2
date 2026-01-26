export enum DefaultRouteEnum {
  config = "/config",
  health = "/_health",
  home = "/",
  testApiError = "/test/api-error",
  testUpload = "/test/upload",
  testUnthrownError = "/test/unthrown-error",
}

export enum LocaleEnum {
  fr = "fr",
  en = "en",
}

export enum EnvTypeEnum {
  prod = "prod",
  preprod = "preprod",
  dev = "dev",
  test = "test",
  local = "local",
}

export enum DefaultCodeEnum {
  SUCCESS_OK = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  TOO_MANY_REQUESTS = 429,
  FILE_TOO_LARGE = 422,
  FILE_UNSUPPORTED_FORMAT = 423,
  CONFLICT_1 = 409,
  CONFLICT_2 = 410,
  CONFLICT_3 = 411,
  CONFLICT_4 = 413,
  CONFLICT_5 = 414,
  CONFLICT_6 = 415,
  CONFLICT_7 = 416,
  CONFLICT_8 = 417,
  CONFLICT_9 = 418,
  ERROR = 500,
}

export enum DefaultCodeMessageEnum {
  SUCCESS_OK = "SUCCESS",
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  FILE_UNSUPPORTED_FORMAT = "FILE_UNSUPPORTED_FORMAT",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  ROUTE_NOT_FOUND = "ROUTE_NOT_FOUND",
  TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",
  CONFLICT = "CONFLICT",
  ERROR = "ERROR",
}

export enum HealthStatusEnum {
  ok = "ok",
  error = "error",
}

export enum HealthItemStatusEnum {
  up = "up",
  down = "down",
}

export enum SortOrderEnum {
  asc = "asc",
  desc = "desc",
}

export enum QueryModeEnum {
  "default" = "default",
  insensitive = "insensitive",
}
