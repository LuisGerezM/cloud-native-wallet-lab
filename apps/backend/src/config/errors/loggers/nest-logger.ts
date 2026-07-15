import { LogPayload, Logger } from '../interfaces/logger.interface';

/**
 * Superficie mínima del `LoggerService` de NestJS que usamos. Se declara local
 * para que la plantilla typecheckee SIN depender de `@nestjs/common`; en runtime
 * se inyecta el `Logger`/`LoggerService` real de Nest (o Pino/Winston).
 *
 * Coincide con la firma estándar de Nest:
 *   `logger.error(message, stack?, context?)` · `logger.warn(message, context?)`
 */
export interface NestLoggerService {
  error(message: unknown, ...optionalParams: unknown[]): void;
  warn(message: unknown, ...optionalParams: unknown[]): void;
  log?(message: unknown, ...optionalParams: unknown[]): void;
}

/**
 * Implementación de `Logger` para **NestJS**: delega en el `LoggerService` de
 * Nest, de modo que los errores del manejador unificado salen por el MISMO
 * pipeline de logs de la app (consola de Nest, `nestjs-pino`, Winston, etc.) y
 * respetan tu formato/transports.
 *
 * El logger de Nest se INYECTA (DI), así la plantilla no acopla `@nestjs/common`.
 *
 * @example
 * // src/config/errors/error-handler.provider.ts
 * import { Logger as NestLogger } from '@nestjs/common';
 * import { ErrorHandler, NestLoggerAdapter } from '@/config/errors';
 *
 * export const errorHandlerProvider = {
 *   provide: ErrorHandler,
 *   useFactory: () =>
 *     new ErrorHandler(new NestLoggerAdapter(new NestLogger('App'))),
 * };
 */
export class NestLoggerAdapter implements Logger {
  constructor(
    private readonly nestLogger: NestLoggerService,
    /** Prefijo/contexto opcional para agrupar logs en Nest. */
    private readonly context = 'ErrorHandler',
  ) {}

  error(payload: LogPayload): void {
    this.nestLogger.error(this.format(payload), payload.stack, this.context);
  }

  warn(payload: LogPayload): void {
    this.nestLogger.warn(this.format(payload), this.context);
  }

  info(payload: LogPayload): void {
    this.nestLogger.log?.(this.format(payload), this.context);
  }

  /** Mensaje compacto + metadatos serializables para los transports de Nest. */
  private format(payload: LogPayload): string {
    const meta = {
      code: payload.code,
      statusCode: payload.statusCode,
      severity: payload.severity,
      location: payload.location,
      timestamp: payload.timestamp,
      context: payload.context,
    };
    return `${payload.code} @ ${payload.location} (${payload.statusCode}) - ${payload.message} ${JSON.stringify(meta)}`;
  }
}
