# ADR-005: Bundle the Lambda artifact with esbuild instead of pnpm deploy

- **Status:** accepted
- **Date:** 2026-07-15

## Context

The backend ships to AWS Lambda as a zip. The first approach built the
artifact with `pnpm deploy --prod --legacy`, which produces a node_modules
whose entries are symlinks into a `.pnpm` virtual store. When that tree is
zipped (Terraform archive_file) and unzipped into the Lambda runtime, the
symlink chain is not preserved, so Node cannot resolve dependencies:
`Runtime.ImportModuleError: Cannot find module 'tslib'`, then the next module,
and the next -- every dependency was a broken symlink. It was never a
missing-dependency problem; it was a node_modules-shape problem.

## Decision

Drop `pnpm deploy` and bundle the app into a single self-contained file with
esbuild. `build:lambda` runs `nest build` first (tsc emits the app JS WITH
emitDecoratorMetadata, which NestJS DI requires) and then esbuild bundles the
compiled `dist/lambda.js` into `.deploy/backend/lambda.js`
(`--bundle --platform=node --target=node22 --format=cjs`). Optional NestJS
peers (microservices, websockets, cache-manager) are marked `--external`
since Nest optional-requires them in try/catch. The zip contains one file and
no node_modules. The Lambda handler becomes `lambda.handler`.

## Consequences

- No symlinks in the artifact -> no missing-module errors at runtime.
- Smaller, deterministic zip (~4.5 MB single file) and faster cold start.
- Local dev keeps pnpm's fast isolated linker; only the deploy step bundles.
- Adds one devDependency (esbuild), allowed to run its native build via
  `onlyBuiltDependencies` in pnpm-workspace.yaml (pnpm 11 blocks build scripts
  by default).
- Two-step build (tsc then esbuild) is deliberate: bundling already-compiled
  JS preserves decorator metadata; bundling from TS would need a plugin
  (e.g. esbuild-plugin-tsc) because esbuild does not emit emitDecoratorMetadata.
- The bundle can be validated locally before deploying: `require()` the file
  and invoke the handler with a fake API Gateway v2 event; a 200 + the Result
  contract confirms DI resolved and no module is missing.
- Trade-off: bundling can hide dynamic requires. If a runtime module turns out
  missing, add it to `--external` and make it available, or let esbuild bundle
  it (drop it from external).
