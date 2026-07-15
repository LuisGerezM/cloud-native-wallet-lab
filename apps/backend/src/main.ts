import 'reflect-metadata';

import { envs } from './config/envs/envs';
import { createApp } from './create-app';

async function bootstrap(): Promise<void> {
  const app = await createApp();
  await app.listen(envs.PORT);
}

void bootstrap();
