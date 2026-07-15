import { ERROR_CODE, ErrorCode } from '../constants/error-codes.constant';

/**
 * Traduce un `statusCode` HTTP al `ErrorCode` del catálogo. Lo usa el
 * `AppExceptionFilter` para normalizar las `HttpException` nativas de NestJS
 * (incluyendo las que lanza el `ValidationPipe`) hacia nuestro `AppError`.
 *
 * Si el status no está mapeado, devuelve `UNKNOWN` (500 por defecto).
 */
const STATUS_TO_CODE: Record<number, ErrorCode> = {
  400: ERROR_CODE.VALIDATION,
  401: ERROR_CODE.UNAUTHORIZED,
  403: ERROR_CODE.FORBIDDEN,
  404: ERROR_CODE.NOT_FOUND,
  409: ERROR_CODE.CONFLICT,
  422: ERROR_CODE.VALIDATION,
  429: ERROR_CODE.RATE_LIMITED,
  502: ERROR_CODE.EXTERNAL_SERVICE,
  503: ERROR_CODE.NETWORK,
  504: ERROR_CODE.TIMEOUT,
};

export const httpStatusToErrorCode = (status: number): ErrorCode =>
  STATUS_TO_CODE[status] ?? ERROR_CODE.UNKNOWN;
