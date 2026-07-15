# ADR-006: Env config via zod + native process.loadEnvFile, not @nestjs/config

- **Status:** accepted
- **Date:** 2026-07-15

## Context

The backend needs typed, validated environment configuration (PORT,
CORS_ORIGINS, NODE_ENV, and later AWS/Cognito values). The NestJS default
answer is `@nestjs/config`, which wraps dotenv and exposes a `ConfigService`
through dependency injection. That adds a dependency and a DI indirection for
something the runtime and the type system can already do.

Node 22 loads a `.env` file natively via `process.loadEnvFile()`, and zod
gives us schema validation plus inferred static types in one place.

## Decision

Load `.env` with the native `process.loadEnvFile()` and validate
`process.env` against a zod schema in a single `config/envs/envs.ts` module
that exports a typed, frozen `envs` object. No `@nestjs/config`, no
`ConfigService`. Invalid or missing variables fail fast at startup with a
readable error listing each offending key.

## Consequences

- One fewer dependency and no DI indirection for configuration.
- Validation and TypeScript types live in the same schema (single source).
- Fail-fast on boot: misconfiguration is caught before the app serves traffic.
- Consistent with the project's native-first principle (see
  skill.md Principios Transversales #7).
- Trade-off: config is imported as a module rather than injected. If a future
  need requires per-request or dynamically swappable config, revisit and wrap
  it behind a provider then.
