import 'reflect-metadata';
import type { Handler } from 'aws-lambda';
import serverlessExpress from '@codegenie/serverless-express';

import { createApp } from './create-app';

// Handler cacheado a nivel de modulo: se construye UNA vez (cold start)
// y se reutiliza en las invocaciones warm (Lambda congela el proceso
// entre requests, asi que esta variable sobrevive).
let cachedHandler: Handler | undefined;

async function bootstrapHandler(): Promise<Handler> {
  const app = await createApp();

  // init() corre todo el arranque de Nest (DI, middleware, filtros...)
  // SIN abrir un puerto. En Lambda no hay socket que escuchar.
  await app.init();

  // El adaptador necesita la instancia Express cruda que hay debajo de Nest.
  const expressInstance = app.getHttpAdapter().getInstance();

  return serverlessExpress({ app: expressInstance });
}

// Lo que AWS invoca en cada request. La primera invocacion arma el handler
// (paga el cold start); las siguientes reusan el cacheado.
export const handler: Handler = async (event, context, callback) => {
  cachedHandler ??= await bootstrapHandler();
  return cachedHandler(event, context, callback);
};
