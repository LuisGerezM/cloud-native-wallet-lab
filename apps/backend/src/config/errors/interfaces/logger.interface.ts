import { ErrorCode } from '../constants/error-codes.constant';
import { Severity } from '../constants/severity.constant';

/**
 * Estructura del evento que se envía al log. Es lo que se persiste/observa
 * INTERNAMENTE: incluye `location`, `stack` y `context`. NADA de esto se
 * retorna al cliente.
 */
export interface LogPayload {
  /** Identificador estable del tipo de error. */
  code: ErrorCode;
  /** Status HTTP asociado. */
  statusCode: number;
  /** Severidad del error. */
  severity: Severity;
  /** Mensaje técnico/interno (puede contener detalles; NO va al cliente). */
  message: string;
  /** Punto del código donde se capturó (ej. 'UsuarioService.findById'). */
  location: string;
  /** Momento del evento en ISO-8601. */
  timestamp: string;
  /** Datos de contexto opcionales para depurar (ids, params, etc.). */
  context?: Record<string, unknown>;
  /** Stack trace si está disponible. */
  stack?: string;
  /** Error original normalizado (para inspección). */
  cause?: unknown;
}

/**
 * Contrato del sink de logging. Es la pieza que hace al manejador
 * AGNÓSTICO DE FRAMEWORK: el core no sabe a dónde van los logs.
 *
 *  - `ConsoleLogger`        → `console` (default, dev).
 *  - `NestLogger`           → el `LoggerService` de NestJS (Pino, Winston, etc.).
 *  - `DatadogServerLogger`  → HTTP Logs Intake API de Datadog (prod, sin SDK).
 *  - El tuyo                → implementá esta interfaz y pasalo por DI.
 *
 * Inyectá tu implementación en el `ErrorHandler` (Dependency Injection).
 */
export interface Logger {
  error(payload: LogPayload): void;
  warn(payload: LogPayload): void;
  info?(payload: LogPayload): void;
}
