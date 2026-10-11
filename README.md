# Rankstack

Rankstack is a contest platform with live leaderboards, real-time submission evaluation, and team management.
The platform uses MongoDB as the system of record.
Redis provides ephemeral storage for live leaderboards, user sessions, and rate limits.
A FastAPI backend serves the REST API.
A Next.js 16 frontend serves the user interface.

**Team:** Upayan Mazumder, Aditya Rawat, Shloak Sinha

## Technology Stack

- **Backend:** Python 3.14, FastAPI, PyMongo (synchronous driver), Pydantic v2
- **System of Record:** MongoDB 7 single-node replica set (`rs0`) for multi-document ACID transactions
- **Cache and Ephemeral Storage:** Redis 7 for leaderboards (`ZSET`), sessions (`STRING` with TTL), and rate limiting
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, TanStack Query v5, Zustand v5
- **Infrastructure:** Docker Compose, Helm chart, GitHub Actions workflows

## Project Layout

```
rankstack/
├── api/                    # FastAPI backend service
│   ├── aggregations/       # MongoDB analytical aggregation pipelines
│   ├── models/             # Pydantic schemas for request and response validation
│   ├── routes/             # REST route controllers (users, teams, contests, problems, submissions, sessions)
│   ├── config.py           # Environment-driven Pydantic settings
│   ├── db.py               # Mongo and Redis client singletons, $jsonSchema validators, indexes
│   ├── dependencies.py     # Session authentication and role verification dependencies
│   ├── redis_ops.py        # Redis operations for leaderboards, sessions, and rate limits
│   ├── security.py         # Password hashing (PBKDF2) and session token generation
│   └── services.py         # Multi-document ACID transactions
├── app/                    # Next.js 16 App Router frontend
│   ├── src/
│   │   ├── api/            # Axios client, error normalizers, and request helpers
│   │   ├── app/            # App Router pages, route groups, and layouts
│   │   ├── components/     # UI primitives and domain components
│   │   ├── hooks/          # Shared hooks and TanStack Query hooks
│   │   ├── lib/            # Utilities and query client setup
│   │   ├── schemas/        # Zod validation schemas
│   │   ├── stores/         # Zustand state stores
│   │   ├── types/          # Domain TypeScript interfaces
│   │   └── utils/          # Formatting and identifier helpers
│   ├── package.json        # Frontend package configuration and scripts
│   └── vitest.config.ts    # Vitest testing configuration
├── docs/                   # System architecture and review presentation documentation
├── k8s/chart/              # Production Helm chart (API, Mongo, Redis)
├── scripts/                # Database initialization, seeding, and demo scripts
│   ├── init_db.py          # Idempotent collection, validator, and index creation
│   ├── seed.py             # Deterministic database seeding script
│   └── demo.py             # Verification script for CRUD, indexes, transactions, and Redis
├── docker-compose.yml      # Local MongoDB replica set and Redis service definitions
└── Makefile                # Central project management commands
```

## Local Setup

### Prerequisites

Install the following tools before starting:
- Docker and Docker Compose
- Python 3.14 (or Python 3.12+)
- Node.js 22 LTS
- pnpm (version 9 or later)

### Quick Start

Run these commands from the repository root:

```bash
# 1. Start MongoDB replica set and Redis containers
make up

# 2. Install backend dependencies into .venv
make install

# 3. Create collections, $jsonSchema validators, and indexes
make init-db

# 4. Seed sample records across all five collections
make seed

# 5. Install frontend dependencies
make web-install
```

To reset the local databases to a clean state, run:

```bash
make reset
```

The command stops the containers, restarts them, creates the schemas, and seeds fresh data.

## Running the Services

### Start the Backend API

```bash
make api
```

The backend server listens on `http://localhost:8000`.
Swagger interactive documentation is available at `http://localhost:8000/docs`.
The OpenAPI JSON schema is available at `http://localhost:8000/openapi.json`.

### Start the Frontend

```bash
make web
```

Alternatively, run from the `app` directory:

```bash
cd app
pnpm dev
```

The Next.js client listens on `http://localhost:3000`.

## Testing and Verification

### Backend Verification

```bash
# Check Python code style and formatting
make lint

# Execute Pytest integration tests against local database containers
make test

# Run the complete platform verification script
make demo
```

The `make demo` script tests five core database capabilities:
1. Document creation and reading.
2. Query execution with `IXSCAN` index verification via `.explain()`.
3. Multi-document ACID transactions with atomic score updates.
4. Five analytical aggregation pipelines.
5. Redis leaderboard ranking calculations, session lifecycles, and rate limiting counters.

### Frontend Verification

Run these commands from the `app` directory:

```bash
cd app

# Run ESLint validation
pnpm lint

# Run TypeScript type check
pnpm type-check

# Run Vitest test suite
pnpm test

# Build production bundle
pnpm build
```

## REST API Endpoints

The API authenticates requests with a bearer session token.
Pass the token in the `Authorization: Bearer <token>` header.
Public routes do not require an authorization header.

| Category | Method | Path | Access Control | Description |
|---|---|---|---|---|
| **Sessions** | `POST` | `/sessions` | Public | Authenticate user and create Redis session token |
| | `GET` | `/sessions/{id}` | Public | Resolve session token to public user profile |
| | `DELETE` | `/sessions/{id}` | Public | Invalidate and delete Redis session token |
| **Users** | `POST` | `/users` | Public | Register new user account |
| | `GET` | `/users` | Public | List users with pagination |
| | `GET` | `/users/{id}` | Public | Get user details by user ID |
| | `PATCH` | `/users/{id}` | Current User or Admin | Update user profile data |
| | `DELETE` | `/users/{id}` | Current User or Admin | Delete user account and related records |
| **Teams** | `POST` | `/teams` | Current User | Create a team with creator as first member |
| | `GET` | `/teams` | Current User | List all teams with pagination |
| | `GET` | `/teams/{id}` | Public | Get team details by team ID |
| | `PATCH` | `/teams/{id}` | Team Member or Admin | Update team name or bio |
| | `POST` | `/teams/{id}/members` | Admin | Add member to team |
| | `DELETE` | `/teams/{id}/members/{userId}` | Team Member or Admin | Delete member from team |
| | `DELETE` | `/teams/{id}` | Team Member or Admin | Delete team |
| **Contests** | `POST` | `/contests` | Admin | Create contest |
| | `GET` | `/contests` | Public | List contests filtered by status or type |
| | `GET` | `/contests/{id}` | Public | Get contest details by contest ID |
| | `PATCH` | `/contests/{id}` | Admin | Update contest metadata or schedule |
| | `PATCH` | `/contests/{id}/status` | Admin | Transition contest status (`upcoming`, `live`, `ended`) |
| | `POST` | `/contests/{id}/participants` | Current User or Admin | Register participant for contest |
| | `GET` | `/contests/{id}/leaderboard` | Public | Get live contest leaderboard from Redis cache |
| | `DELETE` | `/contests/{id}` | Admin | Delete contest and dependent records |
| **Problems** | `POST` | `/problems` | Admin | Create problem (`mcq`, `coding`, `subjective`) |
| | `GET` | `/problems` | Public (Filtered) / Admin | List problems for contest |
| | `GET` | `/problems/{id}` | Public (Filtered) / Admin | Get problem details |
| | `PATCH` | `/problems/{id}` | Admin | Update problem statement or test data |
| | `DELETE` | `/problems/{id}` | Admin | Delete problem and related submissions |
| **Submissions** | `POST` | `/submissions` | Current User (Rate Limited) | Submit answer for evaluation |
| | `GET` | `/submissions` | Public | List submissions filtered by contest, user, or status |
| | `GET` | `/submissions/{id}` | Public | Get submission details by submission ID |
| | `PATCH` | `/submissions/{id}/status` | Admin | Update submission status and award score |
| | `DELETE` | `/submissions/{id}` | Submitter or Admin | Delete submission |
| **Aggregations** | `GET` | `/aggregations/leaderboard/{contestId}` | Public | Calculate contest leaderboard using MongoDB aggregation |
| | `GET` | `/aggregations/avg-score-by-difficulty` | Public | Calculate average problem score grouped by difficulty |
| | `GET` | `/aggregations/submission-status-by-contest` | Public | Count submissions grouped by status per contest |
| | `GET` | `/aggregations/problems-solved-per-user` | Public | Count distinct solved problems per user |
| | `GET` | `/aggregations/team-performance` | Public | Calculate team submission statistics with member lookup |

All seeded accounts use the password `Passw0rd!`.

## Database Architecture

### MongoDB Collections and Indexes

The database uses five collections with `$jsonSchema` validation defined in `api/db.py`:

1. **`users`**: User credentials, profiles, roles (`participant`, `admin`), and team memberships.
   - Unique index on `email`.
2. **`teams`**: Team metadata and member lists.
   - Index on `memberIds`.
3. **`contests`**: Contest schedules, formats, participant lists, and lifecycle statuses.
   - Index on `status`.
4. **`problems`**: Problem specifications with polymorphic `oneOf` schemas for `mcq`, `coding`, and `subjective` types.
   - Index on `contestId`.
5. **`submissions`**: Participant solutions, evaluation statuses, and scores.
   - Compound index on `(contestId, submittedBy.refId)`.
   - Compound index on `(submittedBy.refType, submittedBy.refId)`.
   - Index on `problemId`.

### Multi-Document ACID Transactions

The backend coordinates multi-document mutations inside database transactions in `api/services.py`:
- **Submission Creation:** Inserts a submission document and increments `problems.attemptCount` atomically.
- **Scoring Update:** Updates submission status, calculates score delta, and updates participant total score atomically.
- **Team Membership:** Updates `teams.memberIds` and updates `users.teamIds` in the same transaction.

### Redis Fast-Path

Redis provides high-performance ephemeral storage:
- **Live Leaderboard:** Stored in sorted sets (`ZSET`) keyed by `leaderboard:<contestId>`. Updates use `ZINCRBY`. Reads use `ZREVRANGE` with scores.
- **Session Store:** Opaque 32-byte tokens stored in string keys (`session:<token>`) with a 24-hour expiration time.
- **Submission Rate Limiting:** Enforces submission limits using atomic keys (`rate_limit:<userId>`) with short expiration windows.
