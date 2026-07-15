/**
 * Patrón Result (Error Object) — contrato de retorno homogéneo de toda la app.
 *
 * Es una UNIÓN DISCRIMINADA por el campo `ok`, lo que habilita type-narrowing:
 *
 *   const res = await unService.hacerAlgo();
 *   if (res.ok) {
 *     res.data;     // ← T (TypeScript garantiza que NO es null)
 *   } else {
 *     res.message;  // ← string (siempre hay mensaje seguro en el error)
 *   }
 *
 * Agnóstico de framework: este contrato viaja igual en un Service de NestJS, en
 * un caso de uso puro o en un worker. La capa de entrada (Controller) decide
 * cómo proyectarlo a HTTP (ver `nest/app-exception.filter.ts`).
 */

/** Resultado exitoso. */
export interface Ok<T> {
  ok: true;
  data: T;
  message: null;
}

/** Resultado fallido (forma segura para el cliente, sin detalles internos). */
export interface Err {
  ok: false;
  data: null;
  message: string;
}

/** Resultado de cualquier operación: éxito o error. */
export type Result<T> = Ok<T> | Err;

/**
 * Forma del cuerpo HTTP exitoso, para mantener la MISMA envoltura `{ ok, data,
 * message }` también en las respuestas 2xx (ver `ResultInterceptor`). Es el
 * espejo de `Err`, así el cliente siempre recibe la misma forma.
 */
export interface HttpOkBody<T> {
  ok: true;
  data: T;
  message: null;
}
