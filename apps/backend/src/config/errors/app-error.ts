import {
  ERROR_CATALOG,
  ERROR_CODE,
  ErrorCode,
  FALLBACK_CLIENT_MESSAGE,
} from './constants/error-codes.constant';
import { SEVERITY, Severity } from './constants/severity.constant';
import { LogPayload } from './interfaces/logger.interface';

/** Opciones para construir un AppError de forma explícita. */
export interface AppErrorOptions {
  /** Código del catálogo. Default: UNKNOWN. */
  code?: ErrorCode;
  /** Status HTTP. Default: el del catálogo según `code`. */
  statusCode?: number;
  /** Severidad. Default: la del catálogo según `code`. */
  severity?: Severity;
  /** Mensaje SEGURO para el cliente. Si no se da, se infiere. */
  clientMessage?: string;
  /** Datos de contexto para depurar (NO se envían al cliente). */
  context?: Record<string, unknown>;
  /** Error original que provocó este AppError (encadenamiento). */
  cause?: unknown;
  /**
   * `true` = error esperado/de negocio (controlado).
   * `false` = bug/error de programación. Default: true.
   */
  isOperational?: boolean;
}

/** Forma laxa de un error "esperado" que puede venir del backend o de una lib. */
interface ExpectedErrorShape {
  message?: string;
  statusCode?: number | string;
  code?: string;
  severity?: Severity;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toNumericStatus = (value: number | string | undefined, fallback: number): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

/**
 * Error de dominio enriquecido. Unifica CUALQUIER error (Error nativo, objeto
 * del backend, string, valor desconocido) en una estructura consistente con
 * `code`, `statusCode`, `severity`, mensaje interno y mensaje seguro.
 *
 * Agnóstico de framework.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly severity: Severity;
  /** Mensaje seguro para mostrar al usuario final. */
  readonly clientMessage: string;
  readonly context?: Record<string, unknown>;
  readonly isOperational: boolean;
  /**
   * Error original que provocó este AppError (encadenamiento).
   * Se usa un nombre propio en vez de `cause` para no chocar con `Error.cause`
   * según la versión de `lib` del tsconfig (compatibilidad máxima).
   */
  readonly originalError?: unknown;
  readonly timestamp: string;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = 'AppError';

    const code = options.code ?? ERROR_CODE.UNKNOWN;
    const catalog = ERROR_CATALOG[code];

    this.code = code;
    this.statusCode = options.statusCode ?? catalog.statusCode;
    this.severity = options.severity ?? catalog.severity;
    this.clientMessage = options.clientMessage ?? message ?? catalog.clientMessage;
    this.context = options.context;
    this.isOperational = options.isOperational ?? true;
    this.originalError = options.cause;
    this.timestamp = new Date().toISOString();

    // Mantiene la traza limpia apuntando al sitio de creación real.
    // `captureStackTrace` solo existe en V8 (Node); en el navegador no, por eso
    // se accede de forma defensiva sin acoplar la plantilla a la lib de Node.
    const captureStackTrace = (
      Error as unknown as {
        captureStackTrace?: (target: object, ctor: unknown) => void;
      }
    ).captureStackTrace;
    if (typeof captureStackTrace === 'function') {
      captureStackTrace(this, AppError);
    }
  }

  /**
   * Normaliza cualquier valor `unknown` capturado en un `catch` a un AppError.
   * Este es el corazón de "manejar TODAS las peticiones" con una sola forma.
   */
  static from(error: unknown): AppError {
    // 1) Ya es un AppError → se reutiliza tal cual.
    if (error instanceof AppError) return error;

    // 2) Error nativo de JS → bug de programación (no operacional).
    if (error instanceof Error) {
      return new AppError(error.message, {
        code: ERROR_CODE.UNKNOWN,
        severity: SEVERITY.HIGH,
        cause: error,
        isOperational: false,
      });
    }

    // 3) String suelto.
    if (typeof error === 'string') {
      return new AppError(error, { code: ERROR_CODE.UNKNOWN, cause: error });
    }

    // 4) Objeto "esperado" (típicamente la respuesta de error del backend).
    if (isObject(error)) {
      const shaped = error as ExpectedErrorShape;
      const code =
        (shaped.code as ErrorCode) in ERROR_CATALOG
          ? (shaped.code as ErrorCode)
          : ERROR_CODE.UNKNOWN;
      const message = shaped.message ?? FALLBACK_CLIENT_MESSAGE;

      return new AppError(message, {
        code,
        statusCode: toNumericStatus(shaped.statusCode, ERROR_CATALOG[code].statusCode),
        severity: shaped.severity ?? ERROR_CATALOG[code].severity,
        clientMessage: message,
        context: { original: error },
        cause: error,
      });
    }

    // 5) Cualquier otra cosa (null, undefined, number, boolean…).
    return new AppError(FALLBACK_CLIENT_MESSAGE, {
      code: ERROR_CODE.UNKNOWN,
      severity: SEVERITY.HIGH,
      cause: error,
      isOperational: false,
    });
  }

  /** Construye el payload estructurado para el logger (uso INTERNO). */
  toLog(location: string): LogPayload {
    return {
      code: this.code,
      statusCode: this.statusCode,
      severity: this.severity,
      message: this.message,
      location,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack,
      cause: this.originalError,
    };
  }
}
