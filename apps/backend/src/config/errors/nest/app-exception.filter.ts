import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';

import { AppError } from '../app-error';
import { ErrorHandler, errorHandler as defaultErrorHandler } from '../error-handler';
import { httpStatusToErrorCode } from './http-status-code.map';

/**
 * Forma mínima de un objeto "response-like" (Express `res` o Fastify `reply`),
 * declarada local para no acoplar la plantilla a un adaptador HTTP concreto.
 */
interface HttpResponseLike {
  status(code: number): unknown;
  json?(body: unknown): unknown;
  send?(body: unknown): unknown;
}

interface HttpRequestLike {
  method?: string;
  url?: string;
  originalUrl?: string;
}

/**
 * Exception Filter GLOBAL de NestJS.
 *
 * Es el puente entre el manejador agnóstico (`AppError` + `ErrorHandler`) y el
 * borde HTTP de Nest. Captura TODO lo que se lance en controllers, services,
 * pipes (incluido el `ValidationPipe`) y guards, y garantiza:
 *
 *  1. NORMALIZACIÓN  → cualquier excepción se convierte en `AppError`
 *     (las `HttpException` de Nest conservan su status y mensaje).
 *  2. LOGGING        → se loguea internamente con `location` (método + url),
 *     stack y severidad, vía el `ErrorHandler` inyectado.
 *  3. RESPUESTA      → siempre `{ ok: false, data: null, message }` con el
 *     status correcto. Nunca se filtran detalles internos al cliente.
 *
 * Así, en el resto de la app podés simplemente `throw new AppError(...)` (o
 * dejar que se propague cualquier error) y el contrato de salida es consistente.
 *
 * ── Registro (elegí uno) ────────────────────────────────────────────────────
 *
 * A) Global en `main.ts` (instancia manual):
 *    app.useGlobalFilters(new AppExceptionFilter());
 *
 * B) Como provider con DI (recomendado, permite inyectar tu ErrorHandler):
 *    // app.module.ts
 *    import { APP_FILTER } from '@nestjs/core';
 *    providers: [
 *      { provide: APP_FILTER, useClass: AppExceptionFilter },
 *    ]
 */
@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  /**
   * Por defecto usa el `errorHandler` singleton (ConsoleLogger). Si lo registrás
   * como provider y proveés un `ErrorHandler` propio (NestLogger/Datadog), Nest
   * lo inyecta acá automáticamente.
   */
  constructor(private readonly errorHandler: ErrorHandler = defaultErrorHandler) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<HttpResponseLike>();
    const request = ctx.getRequest<HttpRequestLike>();

    const location = `${request?.method ?? 'UNKNOWN'} ${
      request?.originalUrl ?? request?.url ?? ''
    }`.trim();

    // Normalizamos a AppError ANTES de pasar al handler. Las HttpException de
    // Nest se traducen preservando status y mensaje; el resto cae en AppError.from.
    const normalized = this.toAppError(exception);

    // El handler loguea (según severidad) y arma el body seguro.
    const { status, body } = this.errorHandler.toHttp({ error: normalized, location });

    response.status(status);
    if (typeof response.json === 'function') {
      response.json(body);
    } else if (typeof response.send === 'function') {
      response.send(body);
    }
  }

  /** Convierte la excepción capturada en un `AppError` consistente. */
  private toAppError(exception: unknown): AppError {
    if (exception instanceof AppError) return exception;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const code = httpStatusToErrorCode(status);
      const message = this.extractHttpMessage(exception);

      return new AppError(message, {
        code,
        statusCode: status,
        // Solo exponemos el mensaje de la HttpException al cliente cuando es un
        // error 4xx (input/permisos del propio cliente). En 5xx usamos el
        // mensaje seguro del catálogo para no filtrar detalles internos.
        clientMessage: status < 500 ? message : undefined,
        cause: exception,
        context: { httpExceptionResponse: exception.getResponse() },
      });
    }

    // Cualquier otra cosa (Error nativo, string, objeto del repo, etc.).
    return AppError.from(exception);
  }

  /** Extrae un mensaje legible de una HttpException (incluye errores del ValidationPipe). */
  private extractHttpMessage(exception: HttpException): string {
    const res = exception.getResponse();

    if (typeof res === 'string') return res;

    if (res && typeof res === 'object') {
      const message = (res as { message?: unknown }).message;
      if (Array.isArray(message)) return message.join(' ');
      if (typeof message === 'string') return message;
    }

    return exception.message;
  }
}
