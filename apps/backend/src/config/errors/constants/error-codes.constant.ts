import { SEVERITY, Severity } from './severity.constant';

/**
 * Catálogo central de códigos de error de la aplicación.
 *
 * Un "code" es un identificador estable e independiente del idioma. Sirve para:
 *  - Rastrear el tipo de error en los logs sin depender del `message`.
 *  - Mapear un error a un `statusCode` HTTP y un mensaje seguro para el cliente.
 *
 * Convención sugerida (libre): letra de familia + número.
 *   A = Auth · V = Validación · R = Recurso · E = Servicio externo · N = Red · Z = Desconocido
 */
export const ERROR_CODE = {
  UNKNOWN: 'Z000',
  VALIDATION: 'V001',
  UNAUTHORIZED: 'A001',
  FORBIDDEN: 'A002',
  NOT_FOUND: 'R404',
  CONFLICT: 'R409',
  RATE_LIMITED: 'R429',
  EXTERNAL_SERVICE: 'E500',
  NETWORK: 'N001',
  TIMEOUT: 'N504',
} as const;

export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];

/** Entrada del catálogo: define el comportamiento por defecto de cada code. */
export interface ErrorCatalogEntry {
  /** Status HTTP por defecto para este tipo de error. */
  statusCode: number;
  /** Severidad por defecto (puede sobreescribirse al construir el AppError). */
  severity: Severity;
  /** Mensaje SEGURO para mostrar al cliente (sin detalles internos). */
  clientMessage: string;
}

/**
 * Mapa code → comportamiento por defecto.
 *
 * Punto único de verdad: si querés cambiar el status o el mensaje seguro de un
 * tipo de error en toda la app, lo tocás acá y en ningún otro lado.
 */
export const ERROR_CATALOG: Record<ErrorCode, ErrorCatalogEntry> = {
  [ERROR_CODE.UNKNOWN]: {
    statusCode: 500,
    severity: SEVERITY.HIGH,
    clientMessage: 'Ocurrió un error inesperado. Intentá más tarde o contactá a un administrador.',
  },
  [ERROR_CODE.VALIDATION]: {
    statusCode: 422,
    severity: SEVERITY.LOW,
    clientMessage: 'Los datos enviados no son válidos. Revisá la información e intentá de nuevo.',
  },
  [ERROR_CODE.UNAUTHORIZED]: {
    statusCode: 401,
    severity: SEVERITY.MEDIUM,
    clientMessage: 'Tu sesión no es válida o expiró. Iniciá sesión nuevamente.',
  },
  [ERROR_CODE.FORBIDDEN]: {
    statusCode: 403,
    severity: SEVERITY.MEDIUM,
    clientMessage: 'No tenés permisos para realizar esta acción.',
  },
  [ERROR_CODE.NOT_FOUND]: {
    statusCode: 404,
    severity: SEVERITY.LOW,
    clientMessage: 'No encontramos el recurso solicitado.',
  },
  [ERROR_CODE.CONFLICT]: {
    statusCode: 409,
    severity: SEVERITY.MEDIUM,
    clientMessage: 'La operación no se pudo completar por un conflicto con el estado actual.',
  },
  [ERROR_CODE.RATE_LIMITED]: {
    statusCode: 429,
    severity: SEVERITY.MEDIUM,
    clientMessage:
      'Hiciste demasiadas solicitudes en poco tiempo. Esperá un momento e intentá de nuevo.',
  },
  [ERROR_CODE.EXTERNAL_SERVICE]: {
    statusCode: 502,
    severity: SEVERITY.HIGH,
    clientMessage: 'Un servicio externo no respondió correctamente. Intentá más tarde.',
  },
  [ERROR_CODE.NETWORK]: {
    statusCode: 503,
    severity: SEVERITY.HIGH,
    clientMessage: 'Hubo un problema de conexión. Verificá tu red e intentá de nuevo.',
  },
  [ERROR_CODE.TIMEOUT]: {
    statusCode: 504,
    severity: SEVERITY.HIGH,
    clientMessage: 'La operación tardó demasiado en responder. Intentá nuevamente.',
  },
};

/** Mensaje genérico de último recurso (cuando ni el code ni el error aportan uno seguro). */
export const FALLBACK_CLIENT_MESSAGE = ERROR_CATALOG[ERROR_CODE.UNKNOWN].clientMessage;
