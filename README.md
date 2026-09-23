# Rankstack — Contest Platform with Live Leaderboard

BCSE302P Database Systems Lab — Review 2 (Database Implementation & Core Functionalities)

MongoDB (system of record) + Redis (live leaderboard, sessions, rate limiting), served through a
FastAPI + PyMongo backend.

Team: Upayan Mazumder (24BDS0367), Aditya Rawat (24BCE2992), Shloak Sinha (24BDS0378)

## Stack

- **Python 3.11** + **FastAPI** + **PyMongo** (sync driver)
- **MongoDB 7**, running as a **single-node replica set** (`rs0`) — required for multi-document
  transactions; a standalone `mongod` does not support them
- **Redis 7** for the live leaderboard (`ZSET`), sessions (`TTL`), and submission rate limiting (`TTL`)
- Both databases run in Docker via `docker-compose.yml`; the API/scripts run directly on the host
  in a Python venv

## Project layout

```
api/                    Backend (FastAPI + PyMongo)
  main.py                 FastAPI app + router wiring
  config.py               Settings (env-driven)
  db.py                   Mongo/Redis clients, $jsonSchema validators, indexes
  security.py             Password hashing (PBKDF2), session tokens
  redis_ops.py            Leaderboard / session / rate-limit Redis operations
  services.py             Multi-document transactions (shared by API + seed script)
  models/                 Pydantic request/response schemas per collection
  routes/                 Routers: users, teams, contests, problems, submissions, sessions
  aggregations/
    pipelines.py          The 5 aggregation pipelines + their GET endpoints
app/                    Frontend (Next.js, pnpm)
scripts/
  init_db.py              Idempotently create collections/validators/indexes
  seed.py                 Wipe + reseed ~88 referentially-consistent sample records
  demo.py                 Intermediate demonstration script (see below)
api/Dockerfile          Backend image, published to ghcr.io/upayanmazumder/rankstack/api
docker-compose.yml      Mongo (replica set) + Redis
Makefile                up/down/seed/demo/api/reset targets
```

## Deployment

- **Frontend**: Vercel, `rankstack.upayan.dev` (`NEXT_PUBLIC_API_URL` points at the API below).
- **Backend**: `.github/workflows/api-image.yml` builds `api/Dockerfile` on every push to `main`
  and publishes `ghcr.io/upayanmazumder/rankstack/api:edge` (floating) and `:sha-<short>`
  (immutable). The `upayanmazumder/vps` repo's Argo CD `de-rankstack` Application
  (`k8s/apps/de/rankstack/`) tracks `:edge` by digest and deploys to `api-rankstack.upayan.dev`,
  with MongoDB (replica set) and Redis running in-cluster alongside it.

## Setup

Prerequisites: Docker + Docker Compose, Python 3.11 (`python3.11 -m venv` must work — the
`pydantic-core`/`pyo3` wheel does not yet support 3.14; use 3.11 or 3.12).

```bash
# 1. Start MongoDB (replica set) + Redis
make up

# 2. Create a venv and install dependencies
make install

# 3. Create collections, $jsonSchema validators, and indexes
make init-db

# 4. Load sample data (wipes and reseeds all 5 collections, ~88 records)
make seed
```

Or all at once from a clean slate: `make reset` (down + up + init-db + seed).

Copy `.env.example` to `.env` if you want to override any connection settings; the defaults work
out of the box with `docker-compose.yml`.

## Running the demo

```bash
make demo
```

Prints, in order, with real output from the live database:
1. A CRUD round-trip (create → read → update → delete a user)
2. An indexed query with `.explain()` showing the query planner picked `IXSCAN` over the
   `by_contest` / `by_contest_and_submitter` indexes instead of a collection scan
3. A multi-document transaction (submission insert + atomic `problems.attemptCount` bump, then a
   submission status update + atomic `users.totalScore` bump), showing before/after counters
4. All 5 aggregation pipelines with their live results
5. The Redis fast paths: leaderboard sorted set, a session with its TTL, and the rate-limit counter

The script cleans up its own test writes, so it's safe to re-run.

## Running the API

```bash
make api
```

Serves on `http://localhost:8000`; interactive Swagger docs at `http://localhost:8000/docs`
(usable directly, or export the OpenAPI spec into Postman).

### Endpoints

| Collection | Routes |
|---|---|
| `users` | `POST /users`, `GET /users`, `GET /users/{id}`, `PATCH /users/{id}`, `DELETE /users/{id}` |
| `teams` | `POST /teams`, `GET /teams`, `GET /teams/{id}`, `PATCH /teams/{id}`, `POST /teams/{id}/members`, `DELETE /teams/{id}/members/{userId}`, `DELETE /teams/{id}` |
| `contests` | `POST /contests`, `GET /contests`, `GET /contests/{id}`, `PATCH /contests/{id}`, `PATCH /contests/{id}/status`, `POST /contests/{id}/participants`, `GET /contests/{id}/leaderboard`, `DELETE /contests/{id}` |
| `problems` | `POST /problems` (polymorphic: `type` = `mcq`\|`coding`\|`subjective`), `GET /problems?contestId=`, `GET /problems/{id}`, `PATCH /problems/{id}`, `DELETE /problems/{id}` |
| `submissions` | `POST /submissions`, `GET /submissions?contestId=&userId=&status=`, `GET /submissions/{id}`, `PATCH /submissions/{id}/status`, `DELETE /submissions/{id}` |
| sessions | `POST /sessions` (login), `GET /sessions/{id}`, `DELETE /sessions/{id}` (logout) — Redis-backed |
| aggregations | `GET /aggregations/leaderboard/{contestId}`, `/avg-score-by-difficulty`, `/submission-status-by-contest`, `/problems-solved-per-user`, `/team-performance` |

All seeded users share the password `Passw0rd!` (see `scripts/seed.py`).

## Advanced NoSQL features (Review 2 rubric)

- **Aggregation pipelines** (5, in `api/aggregations/pipelines.py`): contest leaderboard,
  avg score per problem by difficulty, submission count by status per contest, distinct problems
  solved per user, and team performance via `$lookup` from `teams` to `submissions` on `memberIds`.
- **Indexes**: `users.email` (unique), `problems.contestId`, `submissions.{contestId, submittedBy.refId}`
  (compound), `submissions.problemId`, `teams.memberIds`, `contests.status` — all defined in `api/db.py`.
- **Transactions** (3, in `api/services.py`, all exercised by both the API and the seed script):
  1. `create_submission` — insert a submission + atomically increment `problems.attemptCount`
  2. `update_submission_status` — update a submission's status/score + atomically apply the score
     delta to the submitter's cached `totalScore` on `users`/`teams`
  3. `add_team_member` / `remove_team_member` — update `teams.memberIds` + the `users.teamIds`
     back-reference atomically
- **`$jsonSchema` validation** on every collection (`api/db.py`), including a `oneOf` schema on
  `problems` that enforces different required fields per polymorphic `type` (mcq/coding/subjective)
  — a direct NoSQL-level expression of the Review 1 polymorphic design.

## Sample data

`scripts/seed.py` generates ~88 referentially-consistent records (comfortably over the 50-record
minimum): 15 users, 5 teams, 5 contests (2 ended, 1 live, 2 upcoming), 15 problems (5 mcq / 5
coding / 5 subjective), and 40-50+ submissions — only for live/ended contests, since an upcoming
contest realistically has none yet. Every `contestId`/`problemId`/`submittedBy`/`memberIds`
reference resolves to a real document; run the integrity check inline in `scripts/demo.py` or
query any collection directly to verify.

## Notes on scope

- Passwords are hashed with PBKDF2-HMAC-SHA256 (200k iterations) — adequate for a coursework
  demo; a production system would use a dedicated auth provider.
- Redis was implemented now (not deferred to Review 3) per the Review 1 design.
- No UI in this review — that's Review 3. The API is demoable via Swagger UI, curl, or Postman.
