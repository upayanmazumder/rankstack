# Repository Guidelines

## Project Overview

Rankstack is a contest platform featuring live leaderboards, real-time submission evaluation, and team management.
- **Backend:** Python 3.14, FastAPI, synchronous PyMongo, Redis 7, MongoDB 7 single-node replica set (`rs0`).
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, TanStack Query v5, Zustand v5, shadcn/base-ui, pnpm.
- **Infrastructure:** Docker Compose, Helm chart (`k8s/chart/`), and GitHub Actions workflows.

---

## Architecture & Data Flow

### Multi-Tier Layout
1. **API Server (`api/`):** FastAPI application serving REST endpoints under `/users`, `/teams`, `/contests`, `/problems`, `/submissions`, `/sessions`, and `/aggregations`.
2. **System of Record (MongoDB):** Stores users, teams, contests, problems, and submissions with `$jsonSchema` validation and replica-set multi-document transactions.
3. **Cache & Ephemeral Storage (Redis):** Fast-path storage for live contest leaderboards (`ZSET`), opaque user sessions (`STRING` + TTL), and submission rate limiters (`STRING` + TTL).
4. **Web Frontend (`app/`):** Next.js App Router client communicating with FastAPI over typed Axios requests and TanStack Query hooks.

### Core Data Flows
- **Submission & Scoring Cycle:**
  1. Client sends `POST /submissions`.
  2. Route checks user rate limit in Redis (`rate_limit:<userId>`).
  3. `api/services.py:create_submission` runs a MongoDB multi-document transaction: inserts submission and atomically increments `problems.attemptCount`.
  4. Scoring update (`PATCH /submissions/{id}/status`) triggers `api/services.py:update_submission_status`: atomically updates submission status and increments score delta on user or team document.
  5. Route updates Redis leaderboard via `ZINCRBY leaderboard:<contestId> <scoreDelta> <participantId>`.
  6. Frontend polls `GET /contests/{id}/leaderboard` every 5 seconds to render updated rankings.
- **Authentication Cycle:**
  1. User authenticates via `POST /sessions`.
  2. Route verifies PBKDF2 password hash against MongoDB user record.
  3. API generates 32-byte opaque token and stores session in Redis (`session:<token>`) with TTL.
  4. Subsequent requests pass `Authorization: Bearer <token>`.
  5. Dependency `get_current_user` validates session against Redis and attaches user identity.

---

## Key Directories

```
rankstack/
├── api/                    # FastAPI backend service
│   ├── aggregations/       # MongoDB analytical aggregation pipelines
│   ├── models/             # Pydantic schemas (request/response validation)
│   ├── routes/             # API route controllers
│   ├── config.py           # Pydantic Settings (env-driven configuration)
│   ├── db.py               # Mongo & Redis clients, $jsonSchema, indexes
│   ├── dependencies.py     # Auth & role verification dependencies
│   ├── redis_ops.py        # Redis operations (leaderboard, sessions, rate limits)
│   ├── security.py         # Password hashing & session token utilities
│   └── services.py         # Multi-document ACID transactions
├── app/                    # Next.js 16 App Router frontend
│   ├── src/
│   │   ├── api/            # Axios client, error normalizers, request helpers
│   │   ├── app/            # App Router pages, route groups, and layouts
│   │   ├── components/     # UI primitives, motion wrappers, domain cards, forms
│   │   ├── hooks/          # Shared hooks and TanStack Query API hooks
│   │   ├── lib/            # Utilities (query client, motion variants, cn helper)
│   │   ├── schemas/        # Zod validation schemas
│   │   ├── stores/         # Zustand state stores
│   │   ├── types/          # Domain TypeScript interfaces
│   │   └── utils/          # Pure formatting and ID helpers
├── docs/                   # Course reviews and architecture artifacts
├── k8s/chart/              # Production Helm chart (API, Mongo, Redis)
├── scripts/                # Database initialization, seeding, and demo scripts
└── .github/workflows/      # CI/CD pipelines
```

---

## Development Commands

### Environment & Database Orchestration
```bash
make up          # Start MongoDB (replica set rs0) and Redis via docker compose
make down        # Stop local containers
make init-db     # Create Mongo collections, $jsonSchema validators, and indexes
make seed        # Wipe and deterministically reseed sample database records
make demo        # Run comprehensive backend verification script
make reset       # Full clean cycle: down -> up -> init-db -> seed
make clean       # Remove .venv and wipe Docker database volumes
```

### Backend Commands (from root)
```bash
make install     # Create .venv using Python 3.14 and install requirements
make api         # Run FastAPI dev server at http://localhost:8000 with reload
make lint        # Run Ruff linting and formatting checks
make test        # Run pytest test suite against local databases
```

### Frontend Commands (from `app/`)
```bash
pnpm install     # Install frontend dependencies
pnpm dev         # Start Next.js development server (Turbopack) at :3000
pnpm build       # Run Next.js production build
pnpm lint        # Run ESLint check
pnpm lint:fix    # Run ESLint with auto-fix
pnpm type-check  # Run TypeScript compiler check (tsc --noEmit)
pnpm test        # Run Vitest test suite once
pnpm test:watch  # Run Vitest in interactive watch mode
pnpm format      # Format all files with Prettier
```

---

## Code Conventions & Common Patterns

### Python & FastAPI Patterns
- **Synchronous PyMongo Driver:** PyMongo is synchronous. Define route handlers as synchronous functions (`def get_item(...)`, **not** `async def`). FastAPI runs synchronous route handlers in a thread pool, preventing event-loop blocks.
- **ObjectId Conversion:** URL parameters are strings. Always parse IDs using `api.models.common.oid(value)`. It raises `HTTPException(400, "Invalid id: ...")` on malformed values.
- **Document Serialization:** Never return raw MongoDB documents. Wrap returned documents with `api.models.common.serialize_doc(doc)` to convert `_id` to string `id` and handle nested ObjectIds.
- **UTC Timestamps:** Always use `api.models.common.utcnow()` to generate timezone-aware UTC datetime values.
- **Atomic Operations:** Any mutation affecting multiple collections or counters (e.g. creating submissions, updating scores, altering team membership) must use transactions in `api/services.py` via `client.start_session()` and `session.start_transaction()`.
- **Error Handling:** Raise standard `fastapi.HTTPException` with clear status codes (`400`, `401`, `403`, `404`, `409`, `429`).

```python
# Standard backend route handler pattern
@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: str):
    db = get_db()
    user = db.users.find_one({"_id": oid(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_doc(user)
```

### Frontend & Next.js Patterns
- **Single Concern per File:** Maximize separation of concerns. Component files handle rendering only. Move state management to hooks and data transformations to `src/lib/`.
- **TypeScript Usage:** Use `interface` for object definitions and component props. Use `type` for unions and primitives. Avoid `any`; use `unknown` and narrow types.
- **Environment Access:** Never read `process.env` directly in application code. Import validated values from `@/env`. Use `SKIP_ENV_VALIDATION=true` in build scripts where live API access is unavailable.
- **Server vs. Client Components:** Default to Server Components. Add `'use client'` only when components need hooks, local interaction, or browser APIs.
- **TanStack Query Hooks:** Create structured query keys using `createQueryKeys(entity)` from `@/lib/query`. Colocate query hooks in `src/hooks/api/`.
- **Zustand State:** Define one store per file in `src/stores/`. Wrap stores with `createSelectors` to expose auto-generated `use.fieldName()` hooks.
- **Form Handling:** Standardize forms with `useZodForm(schema, options)` from `@/hooks/use-zod-form`. Wire submission handlers to toast notifications via `sonner`.
- **Styling & Theme:** Use Tailwind CSS v4 utility classes. Use `cn()` for class merging. Design tokens are defined as OKLCH CSS variables in `src/app/globals.css`.

---

## Important Files

### Backend Core
- `api/main.py` — Application factory, CORS middleware configuration, startup hooks, and route registration.
- `api/config.py` — Centralized `Settings` loaded from environment variables using Pydantic Settings.
- `api/db.py` — Mongo and Redis client singletons, `$jsonSchema` collection validators, and index definitions.
- `api/services.py` — Multi-document ACID transactions ensuring atomic updates across collections.
- `api/redis_ops.py` — Redis key definitions and operations for leaderboards, sessions, and rate limits.
- `api/models/common.py` — Reusable helpers: `oid()`, `serialize_doc()`, `utcnow()`.

### Frontend Core
- `app/src/env.ts` — Build-time environment variable schema and validation rules.
- `app/src/api/client.ts` — Configured Axios HTTP client instance.
- `app/src/api/errors.ts` — Unified `ApiError` class and response error normalizers.
- `app/src/lib/query.ts` — QueryClient setup and query key factory helpers.
- `app/src/app/layout.tsx` — Root application layout housing theme, query, and motion providers.

### Infra & Automation
- `docker-compose.yml` — Local MongoDB replica set (`rs0`) and Redis 7 service definitions.
- `Makefile` — Central developer workflow commands.
- `scripts/seed.py` — Database seeder generating referentially intact demo data across all collections.
- `scripts/demo.py` — Script verifying CRUD operations, compound indexes, transactions, aggregations, and Redis.
- `.github/workflows/ci.yml` — Primary CI pipeline running linting, type checks, unit tests, and backend integration smoke tests.

---

## Runtime/Tooling Preferences

- **Python Runtime:** Python 3.14 in a dedicated `.venv` virtual environment.
- **Node & Package Manager:** Node.js 22 LTS with `pnpm` exclusively. Do not use `npm` or `yarn`.
- **Database Requirement:** MongoDB 7 **must** run as a replica set (`rs0`). Multi-document transactions will fail on a standalone `mongod`.
- **Commit Formatting:** Conventional Commits (`feat(scope): description`, `fix: description`) enforced via Husky and Commitlint.
- **Code Styling:** Prettier with `prettier-plugin-tailwindcss` for automated frontend styling; Ruff for Python.

---

## Testing & QA

### Frontend Testing
- **Framework:** Vitest + React Testing Library + `@testing-library/jest-dom`.
- **Location:** Colocated inside `__tests__/` subdirectories next to the source code (e.g. `src/hooks/__tests__/`).
- **Scope:**
  - Unit tests for all utility libraries (`src/lib/`, `src/utils/`).
  - Validation tests for all Zod schemas (`src/schemas/`).
  - Store tests verifying Zustand actions and persistence (`src/stores/`).
  - Integration tests for interactive components and forms (`src/components/`).
  - Pure presentational wrappers (motion animations) are exempt from testing.
- **Execution:**
  ```bash
  cd app && pnpm test
  ```

### Backend Testing & QA
- **Unit & Integration Tests:** Pytest integration suite in `api/tests/` running against local MongoDB and Redis instances.
- **Verification Script:** `scripts/demo.py` verifies core platform capabilities:
  1. Connection integrity and document counts.
  2. CRUD lifecycle on user documents.
  3. Query performance asserting `IXSCAN` index utilization using `.explain()`.
  4. ACID transaction execution and atomic counter verification.
  5. Aggregation pipeline execution across all 5 analytical pipelines.
  6. Redis leaderboard ranking calculations, session lifecycles, and rate limiting counters.
- **Execution:**
  ```bash
  make demo
  ```
