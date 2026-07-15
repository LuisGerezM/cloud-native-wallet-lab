import { Err, Ok, Result } from './interfaces/result.interface';

/**
 * Helpers para construir resultados con el patrón Result de forma legible y
 * type-safe. Evitan repetir la forma `{ ok, data, message }` a mano.
 */

/** Crea un resultado exitoso. */
export const ok = <T>(data: T): Ok<T> => ({
  ok: true,
  data,
  message: null,
});

/** Crea un resultado fallido (mensaje ya seguro para el cliente). */
export const fail = (message: string): Err => ({
  ok: false,
  data: null,
  message,
});

/** Type guard: estrecha un Result a su variante exitosa. */
export const isOk = <T>(result: Result<T>): result is Ok<T> => result.ok;

/** Type guard: estrecha un Result a su variante fallida. */
export const isErr = <T>(result: Result<T>): result is Err => !result.ok;
