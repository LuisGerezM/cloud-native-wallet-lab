import { z } from 'zod';

// Node 22 nativo: carga el .env local a process.env, sin dependencias.
// process.loadEnvFile() lanza si el archivo no existe; en Lambda/CI no hay .env
// (las variables las inyecta el entorno), por eso el try/catch.
try {
  process.loadEnvFile();
} catch {
  // sin archivo .env: las variables ya vienen del entorno
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((value) => value.split(',').map((origin) => origin.trim())),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // fail-fast: si el entorno es invalido, la app no debe arrancar
  console.error('Invalid environment variables:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  throw new Error('Environment validation failed');
}

export const envs = Object.freeze(parsed.data);
export type Envs = typeof envs;
