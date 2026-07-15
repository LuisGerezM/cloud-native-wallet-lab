/**
 * Constantes de protocolo usadas por el `HttpClient`. Centralizadas para no
 * dejar magic strings/numbers sueltos en la lógica del cliente
 * (ver `skill.md` → "Higiene de Código").
 */

/** Nombres de header HTTP. */
export const HTTP_HEADER = {
  CONTENT_TYPE: 'content-type',
  AUTHORIZATION: 'authorization',
} as const;

/** Media types. */
export const MIME_TYPE = {
  JSON: 'application/json',
} as const;

/** Nombre del error que `AbortController` produce al abortar (timeout). */
export const ABORT_ERROR_NAME = 'AbortError';

/** Timeout por defecto de una request, en milisegundos. */
export const DEFAULT_TIMEOUT_MS = 10_000;
