# Development Notes

## Architecture (TypeScript-first)

- **product-api (NestJS)** exposes `/health`, `/search`, `/similar/:id`
- **product-api/docker-compose** runs Postgres with pgvector extension
- **utility/pg** implements a `PgVectorStore` for vector similarity over Postgres + pgvector
- **product-search-ui (Next.js)** provides a typed App Router UI to query and display results
- **etl/seed** contains a **TypeScript** seed script using OpenAI to embed data

Key decisions:

- Vector DB: **pgvector** to as a chance to work with SQL, vectors, and expand architecture knowledge
- Embeddings: **OpenAI text-embedding-3-small** (cost-effective, good latency)
- Strict typing across packages for clarity and maintainability

# ADR 01: Vector Store Choice

### Decision

Use **Postgres + pgvector**

### Context

We need nearest neighbor search for semantic vectors with minimal ops overhead and broad familiarity for hiring teams

### Consequences

- Pros: single DB for vectors + metadata, SQL familiarity, easy local dev with Docker
- Cons: purpose-built vector DBs may offer better ANN performance at very large scale

## ADR 02: Embedding Model

### Decision

Use **OpenAI text-embedding-3-small**

### Context

We need quality semantic matching with low latency and cost for a demo-scale app

### Consequences

- Pros: easy integration, reliable, inexpensive for small business
- Cons: vendor dependency; can swap via adapter if needed

## Dev Notes 2025-10-01

Created the repo and got the basic api and UI up. I've also created local postgres DB.
Going with vector search to learn something new in terms of search api architecture.
Started off with a mono repo to keep things tidy.
Might expand to a microservice architecture if this project grows.

Need to improve UI and eventually add analytics page.
