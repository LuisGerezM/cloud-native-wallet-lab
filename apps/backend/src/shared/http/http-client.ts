import { AppError, ERROR_CODE } from '../../config/errors';
import {
  ABORT_ERROR_NAME,
  DEFAULT_TIMEOUT_MS,
  HTTP_HEADER,
  MIME_TYPE,
} from './constants/http.constant';
import { HttpClientOptions, HttpMethod, RequestOptions } from './interfaces/http-client.interface';

/**
 * Cliente HTTP base sobre `fetch` nativo (Node 18+/Bun/Deno/navegador).
 *
 * TRANSPORTE PURO: resuelve `baseUrl`, headers, timeout (`AbortController`) y la
 * (de)serialización JSON, y **normaliza CUALQUIER fallo** (red, timeout,
 * `status >= 400`) a un `AppError` (§6) con el `code` correcto del catálogo.
 *
 * NO contiene lógica de negocio ni conoce features: los **gateways**
 * (`infrastructure/` de cada feature) lo envuelven detrás de su **puerto de
 * dominio** (§5). Se crea una instancia por servicio externo.
 *
 *   const http = new HttpClient({ baseUrl: envs.X_API_URL, defaultHeaders: {...} });
 *   const data = await http.get<Respuesta>('/recurso', { query: { page: 1 } });
 *
 * El detalle interno (`url`, `status`, `payload`) viaja en el `context` del
 * `AppError` —se loguea— pero NUNCA llega al cliente: el `AppExceptionFilter`
 * solo expone el mensaje seguro del catálogo.
 */
export class HttpClient {
  constructor(private readonly opts: HttpClientOptions) {}

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, body, options);
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, body, options);
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, body, options);
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const url = this.buildUrl(path, options?.query);
    const controller = new AbortController();
    const timeoutMs = options?.timeoutMs ?? this.opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          [HTTP_HEADER.CONTENT_TYPE]: MIME_TYPE.JSON,
          ...this.opts.defaultHeaders,
          ...options?.headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: options?.signal ?? controller.signal,
      });
    } catch (error) {
      // `AbortError` = timeout interno; el resto = red/DNS. No se filtra detalle.
      const isTimeout = error instanceof Error && error.name === ABORT_ERROR_NAME;
      throw new AppError(`${isTimeout ? 'Timeout' : 'Fallo de red'} en ${method} ${path}`, {
        code: isTimeout ? ERROR_CODE.TIMEOUT : ERROR_CODE.NETWORK,
        cause: error,
        context: { url, method },
      });
    } finally {
      clearTimeout(timer);
    }

    const payload = await this.parse(response);

    if (!response.ok) {
      throw new AppError(`HTTP ${response.status} en ${method} ${path}`, {
        code: ERROR_CODE.EXTERNAL_SERVICE,
        statusCode: response.status,
        context: { url, method, status: response.status, payload },
      });
    }

    return payload as T;
  }

  /** Resuelve la URL final combinando `baseUrl` + `path` + query params. */
  private buildUrl(path: string, query?: RequestOptions['query']): string {
    const url = new URL(path, this.opts.baseUrl);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  /** Parsea el body según `content-type`; cuerpo vacío → `null`. */
  private async parse(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) return null;
    const contentType = response.headers.get(HTTP_HEADER.CONTENT_TYPE) ?? '';
    return contentType.includes(MIME_TYPE.JSON) ? JSON.parse(text) : text;
  }
}
