/**
 * Punto de entrada público del cliente HTTP base.
 * Importá SIEMPRE desde acá (no desde archivos internos):
 *
 *   import { HttpClient } from '@/shared/http';
 *   import type { HttpClientOptions, RequestOptions } from '@/shared/http';
 */

export { HttpClient } from './http-client';
export type {
  HttpClientOptions,
  RequestOptions,
  HttpMethod,
} from './interfaces/http-client.interface';

// Constantes de protocolo reutilizables por los gateways (sin magic strings).
export { HTTP_HEADER, MIME_TYPE } from './constants/http.constant';
