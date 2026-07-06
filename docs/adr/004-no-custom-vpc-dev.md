# ADR-004: No custom VPC in dev - serverless-managed networking

- **Status:** accepted
- **Date:** 2026-07-06

## Context

The wallet backend runs on a fully managed, serverless stack: AWS Lambda

- API Gateway for compute/HTTP, Amazon Cognito for auth, and DynamoDB for
  persistence. None of these services require the application to own a VPC:
  they are reached over AWS-managed endpoints, not from inside private subnets.

A custom VPC (subnets across AZs, route tables, an internet gateway, and
especially a NAT Gateway for private egress) only becomes necessary when a
resource must live inside private subnets - e.g. RDS/Postgres, Fargate/ECS,
ElastiCache, or a Lambda that needs network access to such private resources.

Cost and focus also matter: this is a learning + portfolio project with a
limited AWS credit (~USD 120, valid until 2026-08-12). A bare VPC is free,
but a NAT Gateway alone runs ~USD 32/month, and the owner's focus is
fullstack development, not network/DevOps operations.

## Decision

Do not provision a custom VPC in the dev environment. Keep all
infrastructure on managed/serverless services that work without one
(Lambda, API Gateway, Cognito, DynamoDB).

VPC theory is kept as a study reference
(`RECURSOS/desarrollo_paso_a_paso/2.1-networking-vpc-conceptos*.md`) but is
intentionally not implemented.

## Consequences

- Zero networking cost: no NAT Gateway, no VPC endpoints, no idle Elastic IPs.
- Less operational surface and fewer concepts to maintain, matching a
  fullstack focus.
- Lambdas run outside a VPC: no ENI cold-start penalty and no NAT dependency
  for internet egress.
- Trade-off: a future private-only datastore or container (migrating
  DynamoDB to RDS, adding Fargate/ElastiCache) will force revisiting this and
  introducing a VPC (subnets, routing, and likely NAT or VPC endpoints) then.
- Trigger to revisit: introducing RDS/Fargate/ElastiCache, or any resource
  that must not be publicly reachable.
