import { AppError } from './app-error';
import { FALLBACK_CLIENT_MESSAGE } from './constants/error-codes.constant';
import { SEVERITY } from './constants/severity.constant';
import { Logger } from './interfaces/logger.interface';
import { Err } from './interfaces/result.interface';
import { ConsoleLogger } from './loggers/console-logger';

/** Parámetros para manejar un error capturado. */
export interface HandleErrorParams {
  /** El error tal cual cae en el `catch` (unknown). */
  error: unknown;
  /** Punto del código donde se capturó (clave para rastrear el recorrido). */
  location: string;
  /**
   * Forzar el log aunque la severidad sea baja. Default: true.
   * (La severidad HIGH SIEMPRE loguea, independientemente de este flag.)
   */
  log?: boolean;
  /**
   * Mensaje seguro de respaldo si el error no aporta uno. Permite dar contexto
   * de negocio al usuario (ej. "No se pudieron buscar los agentes de riesgo").
   */
  fallbackMessage?: string;
}

/** Forma plana de una respuesta HTTP de error (sin acoplar al adaptador HTTP). */
export interface HttpErrorResponse {
  status: number;
  body: Err;
}

/**
 * Manejador de errores unificado de la app.
 *
 * Responsabilidades:
 *  1. NORMALIZAR cualquier error a un `AppError` (vía `AppError.from`).
 *  2. LOGUEAR internamente (con `location`, stack y context) según severidad.
 *  3. RETORNAR una forma segura para el cliente (patrón Result), SIN filtrar
 *     detalles internos (location, stack, context nunca salen al cliente).
 *
 * Es agnóstico de framework: el destino del log se inyecta vía `Logger`, así
 * que la misma clase sirve en NestJS (server), en un worker o en un caso de uso
 * puro. En Nest se suele registrar como provider con un `NestLogger`/Datadog.
 *
 * @example
 * // Instancia por defecto (console):
 * import { errorHandler } from '@/config/errors';
 * // Instancia con logger propio (DI):
 * const handler = new ErrorHandler(new DatadogServerLogger({ ... }));
 */
export class ErrorHandler {
  constructor(private readonly logger: Logger = new ConsoleLogger()) {}

  /**
   * Normaliza + loguea y devuelve el `AppError`. Uso interno compartido por
   * `handle` y `toHttp`.
   */
  private process(params: HandleErrorParams): AppError {
    const { error, location, log = true } = params;
    const appError = AppError.from(error);

    const mustLog = log || appError.severity === SEVERITY.HIGH;
    if (mustLog) {
      const payload = appError.toLog(location);
      if (appError.severity === SEVERITY.HIGH) {
        this.logger.error(payload);
      } else {
        this.logger.warn(payload);
      }
    }

    return appError;
  }

  /** Resuelve el mensaje SEGURO a retornar al cliente. */
  private resolveClientMessage(appError: AppError, fallbackMessage?: string): string {
    return appError.clientMessage || fallbackMessage || FALLBACK_CLIENT_MESSAGE;
  }

  /**
   * Manejo estándar para Actions / Services. Devuelve la variante `Err` del
   * patrón Result, lista para retornar desde tu función.
   *
   * @example
   * } catch (error) {
   *   return errorHandler.handle({
   *     error,
   *     location: 'getDataAgenteRiesgoAction',
   *     fallbackMessage: 'No se pudieron buscar los agentes de riesgo.',
   *   });
   * }
   */
  handle(params: HandleErrorParams): Err {
    const appError = this.process(params);
    return {
      ok: false,
      data: null,
      message: this.resolveClientMessage(appError, params.fallbackMessage),
    };
  }

  /**
   * Manejo para la capa HTTP (Controllers / Exception Filters). Devuelve
   * `{ status, body }` plano (sin acoplar a Express/Fastify); quien llama decide
   * cómo escribir la respuesta. En Nest, lo normal es delegar esto al
   * `AppExceptionFilter` (ver `nest/app-exception.filter.ts`).
   *
   * @example
   * } catch (error) {
   *   const { status, body } = errorHandler.toHttp({ error, location: 'GET /actividades' });
   *   res.status(status).json(body);
   * }
   */
  toHttp(params: HandleErrorParams): HttpErrorResponse {
    const appError = this.process(params);
    return {
      status: appError.statusCode,
      body: {
        ok: false,
        data: null,
        message: this.resolveClientMessage(appError, params.fallbackMessage),
      },
    };
  }
}

/**
 * Instancia lista para usar con el logger por defecto (console).
 * Para inyectar otro logger, construí tu propia instancia de `ErrorHandler`.
 */
export const errorHandler = new ErrorHandler();
