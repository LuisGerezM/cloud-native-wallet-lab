import { LogPayload, Logger } from '../interfaces/logger.interface';

/** Estados de log que entiende Datadog. */
type DatadogStatus = 'debug' | 'info' | 'warn' | 'error';

/** Configuración del logger de servidor para Datadog. */
export interface DatadogServerLoggerConfig {
  /** API key de Datadog (NUNCA hardcodear: leerla de `config/envs`). */
  apiKey: string;
  /** Nombre del servicio en Datadog (ej. 'dr-central-control-peso'). */
  service: string;
  /** Datadog site. Default: 'datadoghq.com' (UE: 'datadoghq.eu'). */
  site?: string;
  /** Entorno (ej. 'production', 'staging'). Se envía como tag `env`. */
  env?: string;
  /** Host de origen (opcional). */
  hostname?: string;
  /** `ddsource`. Default: 'nodejs'. */
  source?: string;
  /**
   * Si `true`, ante un fallo del envío a Datadog lo reporta por `console.error`.
   * Default: true. (El envío nunca lanza: no debe romper el flujo de la app.)
   */
  warnOnFailure?: boolean;
}

/**
 * Implementación de `Logger` para el **server de Node/NestJS** (Controllers, Services,
 * workers) usando el **HTTP Logs Intake API** de Datadog.
 *
 * No requiere SDK: usa `fetch` (global en Node 18+). El
 * envío es *fire-and-forget* para no bloquear la respuesta; si falla, se
 * degrada a `console` sin romper la app.
 *
 * @example
 * // src/config/errors/error-handler.provider.ts (Nest provider)
 * import { ErrorHandler } from '@/config/errors';
 * import { DatadogServerLogger } from '@/config/errors/loggers/datadog-server-logger';
 * import { envs } from '@/config/envs';
 *
 * export const errorHandler = new ErrorHandler(
 *   new DatadogServerLogger({
 *     apiKey: envs.DATADOG_API_KEY,
 *     service: 'dr-central-control-peso',
 *     env: envs.NODE_ENV,
 *   }),
 * );
 */
export class DatadogServerLogger implements Logger {
  private readonly endpoint: string;

  constructor(private readonly config: DatadogServerLoggerConfig) {
    const site = config.site ?? 'datadoghq.com';
    this.endpoint = `https://http-intake.logs.${site}/api/v2/logs`;
  }

  error(payload: LogPayload): void {
    this.send('error', payload);
  }

  warn(payload: LogPayload): void {
    this.send('warn', payload);
  }

  info(payload: LogPayload): void {
    this.send('info', payload);
  }

  /** Construye el cuerpo del log con la convención de atributos de Datadog. */
  private buildEntry(status: DatadogStatus, payload: LogPayload): Record<string, unknown> {
    const tags = [`env:${this.config.env ?? 'unknown'}`, `code:${payload.code}`];

    return {
      ddsource: this.config.source ?? 'nodejs',
      ddtags: tags.join(','),
      service: this.config.service,
      hostname: this.config.hostname,
      status,
      // Atributos estándar de Datadog para errores:
      message: payload.message,
      'error.kind': payload.code,
      'error.stack': payload.stack,
      // Atributos propios del dominio (quedan indexables/filtrables en Datadog):
      severity: payload.severity,
      statusCode: payload.statusCode,
      location: payload.location,
      timestamp: payload.timestamp,
      context: payload.context,
    };
  }

  private send(status: DatadogStatus, payload: LogPayload): void {
    const body = JSON.stringify(this.buildEntry(status, payload));

    // Fire-and-forget: no se hace `await` para no bloquear la respuesta.
    void fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': this.config.apiKey,
      },
      body,
      // Evita mantener viva la request en entornos serverless.
      keepalive: true,
    }).catch((err: unknown) => {
      if (this.config.warnOnFailure ?? true) {
        console.error('[DatadogServerLogger] fallo al enviar log a Datadog:', err);

        console.error('[DatadogServerLogger] payload original:', payload);
      }
    });
  }
}
