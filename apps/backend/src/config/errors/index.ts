/**
 * Punto de entrada público del gestor de errores.
 * Importá SIEMPRE desde acá (no desde archivos internos):
 *
 *   import { errorHandler, ok, fail, AppError, ERROR_CODE } from '@/config/errors';
 *   import { AppExceptionFilter } from '@/config/errors';
 */

// ── Núcleo agnóstico ─────────────────────────────────────────────────────────
export { ErrorHandler, errorHandler } from './error-handler';
export type { HandleErrorParams, HttpErrorResponse } from './error-handler';
export { AppError } from './app-error';
export type { AppErrorOptions } from './app-error';

// Patrón Result + helpers
export { ok, fail, isOk, isErr } from './result.helpers';
export type { Result, Ok, Err, HttpOkBody } from './interfaces/result.interface';

// Catálogo y severidad
export {
  ERROR_CODE,
  ERROR_CATALOG,
  FALLBACK_CLIENT_MESSAGE,
} from './constants/error-codes.constant';
export type { ErrorCode, ErrorCatalogEntry } from './constants/error-codes.constant';
export { SEVERITY } from './constants/severity.constant';
export type { Severity } from './constants/severity.constant';

// ── Logging (inyectá implementaciones propias vía DI) ────────────────────────
export { ConsoleLogger } from './loggers/console-logger';
export { NestLoggerAdapter } from './loggers/nest-logger';
export type { NestLoggerService } from './loggers/nest-logger';
export { DatadogServerLogger } from './loggers/datadog-server-logger';
export type { DatadogServerLoggerConfig } from './loggers/datadog-server-logger';
export type { Logger, LogPayload } from './interfaces/logger.interface';

// ── Integración NestJS (requiere @nestjs/common en el proyecto destino) ──────
export { AppExceptionFilter } from './nest/app-exception.filter';
export { ResultInterceptor } from './nest/result.interceptor';
export { httpStatusToErrorCode } from './nest/http-status-code.map';
