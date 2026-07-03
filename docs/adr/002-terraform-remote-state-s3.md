# ADR-002: Terraform remote state on S3 with native lockfile

- **Status:** accepted
- **Date:** 2026-07-03

## Context

Terraform needs a place to store its state. The default is a local
`terraform.tfstate` file, which does not work for a project meant to run
from CI and (eventually) more than one machine:

- Local state is not shared: CI and laptop would each have their own.
- Local state has no locking: two applies at once can corrupt it.
- Local state has no history: a bad apply is hard to recover from.

We already have an AWS account and want to stay inside it (no extra SaaS
like Terraform Cloud). We also want the state protected: it can contain
secrets in plaintext.

Terraform >= 1.10 supports native S3 state locking via `use_lockfile`,
which removes the long-standing need for a separate DynamoDB lock table.

## Decision

Store Terraform state remotely in a dedicated S3 bucket
(`wallet-lab-tfstate-370292660810`), one state key per environment
(`envs/dev/terraform.tfstate`), created by a `bootstrap` config.

Harden the bucket in bootstrap:

- **Versioning enabled** -> every state write is a recoverable version.
- **SSE (AES256) enabled** -> state encrypted at rest.
- **Public access block** -> bucket can never be exposed publicly.

Use **S3 native locking** (`use_lockfile = true`) in the backend config
instead of a DynamoDB lock table.

## Consequences

- State is shared and consistent between CI and local runs.
- Accidental/bad applies are recoverable via bucket versioning.
- State is encrypted at rest and cannot be made public.
- One less resource to run and pay for: the DynamoDB lock table is no
  longer needed and will be removed from bootstrap (orphan resource).
- Requires Terraform >= 1.10; older versions cannot open this backend.
- Bootstrap has a chicken-and-egg step: it creates the bucket that later
  configs use as backend, so bootstrap itself starts with local state.
