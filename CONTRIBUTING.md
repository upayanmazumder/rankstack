# Contributing to Rankstack

Thank you for contributing to Rankstack.
This document describes local environment setup, coding conventions, testing procedures, and the pull request process.

## Prerequisites

Install these required tools before you start local development:
- **Docker and Docker Compose:** Required to run MongoDB replica set and Redis containers.
- **Python 3.14 (or Python 3.12+):** Required for the FastAPI backend and database scripts.
- **Node.js 22 LTS:** Required for the Next.js frontend application.
- **pnpm (version 9 or later):** The exclusive package manager for the frontend. Do not use `npm` or `yarn`.
- **Git:** Required for version control.

## Local Environment Setup

Follow these steps to configure your local development environment:

### 1. Clone the Repository

```bash
git clone https://github.com/upayanmazumder/rankstack.git
cd rankstack
```

### 2. Configure Environment Variables

The default settings connect to local Docker services.
Copy the example environment file if you need custom database ports:

```bash
cp .env.example .env
```

### 3. Initialize Databases and Services

Run the full initialization cycle from the repository root:

```bash
# Start MongoDB (replica set rs0) and Redis containers
make up

# Create Python virtual environment and install backend dependencies
make install

# Create collections, validators, and database indexes
make init-db

# Seed deterministic sample records across all collections
make seed

# Install frontend dependencies in app/
make web-install
```

Alternatively, run `make reset` to execute this entire sequence automatically.

### 4. Start Development Servers

Run the backend and frontend in separate terminals:

```bash
# Terminal 1: Start FastAPI dev server with auto-reload at http://localhost:8000
make api

# Terminal 2: Start Next.js dev server with Turbopack at http://localhost:3000
make web
```

Interactive Swagger documentation is available at `http://localhost:8000/docs`.

## Code Conventions and Standards

### Python and Backend Guidelines

- **Synchronous Route Handlers:** PyMongo is a synchronous database driver. Define API route handlers as synchronous functions (`def get_user(...)`, not `async def`). FastAPI executes synchronous handlers in an internal thread pool.
- **Identifier Conversion:** Parse all route path identifiers using `api.models.common.oid(value)`. This helper validates hexadecimal format and raises `HTTPException(400)` on malformed values.
- **Document Serialization:** Always wrap returned MongoDB documents with `api.models.common.serialize_doc(doc)`. This converts MongoDB `_id` values to string `id` properties.
- **UTC Timestamps:** Generate timezone-aware timestamps using `api.models.common.utcnow()`.
- **Atomic Operations:** Any mutation that changes multiple collections or counter fields must execute inside a database transaction in `api/services.py`.
- **Error Responses:** Raise standard `fastapi.HTTPException` with clear status codes (`400`, `401`, `403`, `404`, `409`, `429`).
- **Code Formatting:** The project uses Ruff. Format and lint Python files by running `make lint`.

### TypeScript and Frontend Guidelines

- **Single Concern per File:** Each component file must handle rendering only. Move state logic into hooks and data transformations into `src/lib/`.
- **Type Safety:** Use `interface` for object definitions and component props. Use `type` for unions and primitives. Avoid `any`. Use `unknown` and narrow types.
- **Environment Variables:** Never access `process.env` directly in application code. Import validated values from `@/env`.
- **Component Architecture:** Default to Server Components. Add `'use client'` only when components require React hooks or browser events.
- **Server State:** Create query keys using `createQueryKeys(entity)` from `@/lib/query`. Place query hooks in `src/hooks/api/`.
- **Client State:** Define one Zustand store per file in `src/stores/`. Wrap stores with `createSelectors`.
- **Forms:** Build forms using `useZodForm(schema, options)` from `@/hooks/use-zod-form`. Display feedback with `sonner` toasts.
- **Styling:** Use Tailwind CSS v4 utility classes. Use `cn()` to merge class names.
- **Code Formatting:** The project uses Prettier and ESLint. Validate code style by running `pnpm lint` in `app/`.

## Conventional Commits

We enforce the Conventional Commits specification.
Format all commit messages with a valid prefix:

```
<type>(<scope>): <description>
```

### Approved Types

- `feat`: A new user-facing feature.
- `fix`: A bug fix.
- `docs`: Documentation updates only.
- `refactor`: Code change that neither fixes a bug nor adds a feature.
- `test`: Adding or updating tests.
- `ci`: Changes to CI/CD workflows and automation scripts.
- `chore`: Changes to build processes or auxiliary tools.

### Commit Rules

- Use the imperative mood in the subject line (for example, `feat(auth): add session revocation endpoint`).
- Do not capitalize the first letter of the subject line.
- Do not place a period at the end of the subject line.
- Keep the subject line under 72 characters.

## Testing and Quality Assurance

Execute all test suites locally before submitting changes.

### Run Backend Tests

```bash
# Verify Python code style and formatting
make lint

# Execute Pytest integration tests against local database containers
make test

# Execute platform verification demo script
make demo
```

### Run Frontend Tests

```bash
cd app

# Check for lint violations
pnpm lint

# Verify TypeScript compiler types without emitting files
pnpm type-check

# Run Vitest unit and integration test suite
pnpm test

# Verify production bundle build
pnpm build
```

## Pull Request Submission Checklist

Complete this checklist before opening a pull request:

1. Create a feature branch from the latest `main` branch (`git checkout -b feat/my-feature`).
2. Validate that each new file handles a single responsibility.
3. Extract component logic into custom hooks.
4. Validate that no `any` types exist in TypeScript code.
5. Add unit or integration tests for modified behavior.
6. Validate that `make lint` and `make test` pass for backend changes.
7. Validate that `pnpm lint`, `pnpm type-check`, `pnpm test`, and `pnpm build` pass in `app/`.
8. Validate that all commits follow the Conventional Commits format.
9. Fill out the pull request template in `.github/pull_request_template.md`.
