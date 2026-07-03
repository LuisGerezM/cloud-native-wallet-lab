# ADR-003: GitHub Actions authenticates to AWS via OIDC

- **Status:** accepted
- **Date:** 2026-07-03

## Context

The Terraform CI (`.github/workflows/terraform.yml`) runs from GitHub
Actions and needs AWS credentials to read state and plan changes.

The classic approach is to create an IAM user, generate an access key,
and store it in GitHub Secrets. That credential is long-lived: it stays
valid until someone rotates it, and a leak (logs, a compromised action,
a fork) exposes the account until then. It also has to be rotated and
managed by hand.

AWS supports OIDC federation with GitHub's identity provider
(`token.actions.githubusercontent.com`). With it, each workflow run gets
a short-lived, automatically-issued token and exchanges it for temporary
AWS credentials via STS. No long-lived secret is stored anywhere.

## Decision

Use GitHub OIDC. Define an IAM role (`wallet-lab-github-actions-dev`)
whose trust policy allows `sts:AssumeRoleWithWebIdentity` only when:

- the audience (`aud`) is `sts.amazonaws.com`, and
- the subject (`sub`) matches `repo:LuisGerezM/cloud-native-wallet-lab:*`.

Grant the role least privilege for what CI actually does:

- managed `ReadOnlyAccess` (so `terraform plan` can read resources), and
- an inline policy scoped to the state bucket: `ListBucket` on the
  bucket and object read/write on `envs/dev/*`.

Expose the role ARN as a Terraform output so the workflow can reference it.

## Consequences

- No long-lived AWS credentials stored in GitHub Secrets; nothing to rotate.
- A leaked token is useless: it is short-lived and bound to this repo.
- CI can plan and read state, but cannot apply arbitrary changes yet
  (ReadOnly + narrow state access). Broadening this is a future decision.
- CI can plan and read state, but cannot apply arbitrary changes yet
  (ReadOnly + narrow state access). Broadening this is a future decision.
- The `sub` condition uses `:*`, so ANY branch/ref/PR in this repo can
  assume the role. Tightening it (e.g. to `ref:refs/heads/main` or a
  GitHub Environment) is a follow-up hardening step.
- The OIDC provider is referenced as a `data` source: it must already
  exist in the account, or be created once (commented resource in the file).
