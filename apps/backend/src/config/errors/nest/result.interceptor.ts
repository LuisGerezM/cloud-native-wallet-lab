import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { HttpOkBody } from '../interfaces/result.interface';

/**
 * Interceptor OPCIONAL que envuelve las respuestas exitosas de los controllers
 * en la misma forma que usamos para los errores: `{ ok, data, message }`.
 *
 * Con esto, el cliente recibe SIEMPRE la misma envoltura:
 *   éxito → { ok: true,  data: <payload>, message: null }
 *   error → { ok: false, data: null,      message: '...' }  (vía AppExceptionFilter)
 *
 * Es idempotente: si el controller ya devolvió algo con forma de `Result`
 * (tiene `ok` booleano), se deja pasar tal cual y no se re-envuelve.
 *
 * Registro (en `main.ts` o como `APP_INTERCEPTOR`):
 *   app.useGlobalInterceptors(new ResultInterceptor());
 *
 * Si NO querés tocar la forma de tus respuestas 2xx, simplemente no lo registres:
 * el manejo de errores funciona igual sin este interceptor.
 */
@Injectable()
export class ResultInterceptor<T> implements NestInterceptor<T, HttpOkBody<T> | T> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<HttpOkBody<T> | T> {
    return next.handle().pipe(
      map((data) => {
        // Ya viene con forma de Result (ok: boolean) → no re-envolver.
        if (data && typeof data === 'object' && 'ok' in (data as Record<string, unknown>)) {
          return data;
        }
        return { ok: true, data, message: null } as HttpOkBody<T>;
      }),
    );
  }
}
