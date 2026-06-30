# ADR-001: pnpm workspaces for monorepo

- **Status:** accepted
- **Date:** 2026-06-29

## Context

The project has a frontend (Next.js), a backend (NestJS), and infrastructure (Terraform).
They share no code today but will share types and config in future phases.

## Decision

Use pnpm workspaces with `apps/frontend` and `apps/backend` packages.
Root manages shared dev tooling (ESLint, Prettier, husky, commitlint).

## Consequences

- Single `pnpm install` installs all workspaces.
- Shared devDependencies at root reduce duplication.
- Each app can add its own deps without polluting others.
- Terraform lives in `infra/` outside the workspace (no Node deps needed there).
