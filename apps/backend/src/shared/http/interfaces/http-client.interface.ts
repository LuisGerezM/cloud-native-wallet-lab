/**
 * Contratos del cliente HTTP base. Tipos PUROS, sin dependencia de runtime ni
 * de framework: viajan igual en Node, Bun, Deno o el navegador.
 */

/** Métodos HTTP soportados por el `HttpClient`. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Configuración de una instancia de `HttpClient`. Se crea **una por servicio
 * externo** (un gateway = un cliente), no una global compartida.
 */
export interface HttpClientOptions {
  /** URL base del servicio. Las rutas de cada request se resuelven relativas a ella. */
  baseUrl: string;
  /**
   * Headers que se envían en TODAS las requests (p. ej. `authorization`).
   * Los secretos salen de `config/envs` (§7), nunca hardcodeados.
   */
  defaultHeaders?: Record<string, string>;
  /** Timeout por defecto en milisegundos. Default: `10_000`. */
  timeoutMs?: number;
}

/** Opciones por request; se combinan con las de la instancia. */
export interface RequestOptions {
  /** Headers extra solo para esta request (se mergean sobre los `defaultHeaders`). */
  headers?: Record<string, string>;
  /** Query params. Las claves con valor `undefined` se omiten. */
  query?: Record<string, string | number | boolean | undefined>;
  /** Signal externo para cancelar (se respeta junto al timeout interno). */
  signal?: AbortSignal;
  /** Override del timeout para esta request, en milisegundos. */
  timeoutMs?: number;
}
