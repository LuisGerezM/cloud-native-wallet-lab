import { LogPayload, Logger } from '../interfaces/logger.interface';

/**
 * Implementación por defecto del `Logger` usando `console`.
 *
 * Es deliberadamente simple y AGNÓSTICA: funciona en cualquier runtime de Node
 * (server de Nest, worker, script). En producción reemplazala inyectando tu
 * propio `Logger` (NestLogger, Datadog, Sentry, etc.) en el ErrorHandler.
 */
export class ConsoleLogger implements Logger {
  private format(payload: LogPayload): string {
    return `[${payload.severity}] ${payload.code} @ ${payload.location} (${payload.statusCode}) - ${payload.message}`;
  }

  error(payload: LogPayload): void {
    console.error(this.format(payload), {
      timestamp: payload.timestamp,
      context: payload.context,
      stack: payload.stack,
    });
  }

  warn(payload: LogPayload): void {
    console.warn(this.format(payload), {
      timestamp: payload.timestamp,
      context: payload.context,
    });
  }

  info(payload: LogPayload): void {
    console.info(this.format(payload));
  }
}
