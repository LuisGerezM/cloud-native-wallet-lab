import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import 'reflect-metadata';

import { AppModule } from './app.module';
import { envs } from './config/envs/envs';
import { AppExceptionFilter, ResultInterceptor } from './config/errors';

// Unica fuente de verdad del arranque: construye y configura la app.
// No hace listen() ni init(): eso lo decide cada runtime (local vs Lambda).
export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet());

  app.enableCors({
    origin: envs.CORS_ORIGINS,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new ResultInterceptor());
  app.useGlobalFilters(new AppExceptionFilter());

  return app;
}
