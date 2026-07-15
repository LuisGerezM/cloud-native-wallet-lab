# ADR-007: Install .CLAUDE templates flat with relative imports, no path alias

- **Status:** accepted
- **Date:** 2026-07-15

## Context

The project ships reusable templates under `.CLAUDE/NODE_NESTJS/`
(`error-template/`, `http-template/`). Their example code uses a `@/` path
alias (e.g. `@/config/errors`). Using that alias at runtime under
`module: NodeNext` + CommonJS would require a resolver such as
`tsconfig-paths` (or a bundler rewrite) so Node can map `@/` to real paths;
otherwise the compiled `require()` calls fail.

## Decision

Install the templates "flat" into the app tree
(`apps/backend/src/config/errors/`, `apps/backend/src/shared/http/`) and use
plain relative imports (`../../config/errors`) instead of the `@/` alias.
Drop each template's `README.md` and `examples/`. The only alias references
that remain are inside code comments.

## Consequences

- No `tsconfig-paths` and no bundler alias rewrite needed at runtime; imports
  resolve natively under NodeNext + CommonJS.
- The template code lives as first-class project source the user owns and edits.
- Consistent with the native-first principle; one less moving part in the
  Lambda bundle.
- Trade-off: relative imports are more verbose and shift on file moves. If the
  tree grows deep enough that this hurts, revisit adding a single, tooling-wide
  alias (tsconfig + runtime resolver) as a deliberate decision.
