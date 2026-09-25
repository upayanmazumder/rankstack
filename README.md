# Rankstack

A contest platform with a live leaderboard: MongoDB as the system of record, Redis for the parts
that need to be fast and short-lived (leaderboard, sessions, rate limiting), and a FastAPI backend
in front of both. It started as a database systems lab project and grew into something closer to a
normal small backend.

Team: Upayan Mazumder, Aditya Rawat, Shloak Sinha

## Stack

- Python 3.14, FastAPI, PyMongo (sync driver)
- MongoDB 7, running as a single-node replica set (`rs0`). Multi-document transactions need a
  replica set; a standalone `mongod` won't do it.
- Redis 7 for the leaderboard (`ZSET`), sessions (`TTL`), and submission rate limiting (`TTL`)
- Next.js frontend in `app/`, pnpm
- Mongo and Redis run in Docker via `docker-compose.yml`; the API and scripts run on the host in a
  Python venv

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
    pipelines.py          Aggregation pipelines + their GET endpoints
app/                    Frontend (Next.js, pnpm)
scripts/
  init_db.py              Idempotently create collections/validators/indexes
  seed.py                 Wipe + reseed sample data
  demo.py                 Walks through CRUD, indexing, transactions, aggregations, Redis
api/Dockerfile          Backend image, published to ghcr.io/upayanmazumder/rankstack/api
docker-compose.yml      Mongo (replica set) + Redis
Makefile                up/down/seed/demo/api/reset targets
```

## Setup

Needs Docker, Docker Compose, and Python 3.14 (`python3.14 -m venv` has to work).

```bash
make up        # start MongoDB (replica set) + Redis
make install   # create a venv, install dependencies
make init-db   # create collections, $jsonSchema validators, indexes
make seed      # wipe and reseed all 5 collections
```

Or all at once from a clean slate: `make reset` (down + up + init-db + seed).

Copy `.env.example` to `.env` if you want to change any connection settings. The defaults already
match `docker-compose.yml`.

## Running the demo

```bash
make demo
```

Runs against the seeded database and prints real output as it goes: a CRUD round trip on a user,
an indexed query with `.explain()` showing it hit `IXSCAN` on the `by_contest` /
`by_contest_and_submitter` indexes instead of scanning the collection, a transaction (a submission
insert that atomically bumps `problems.attemptCount`, then a status update that atomically bumps
the submitter's `totalScore`), all five aggregation pipelines, and the Redis leaderboard, a session
with its TTL, and the rate-limit counter. It cleans up whatever it writes, so it's fine to run more
than once.

## Running the API

```bash
make api
```

Serves on `http://localhost:8000`. Swagger docs are at `http://localhost:8000/docs`, usable
directly or exported into Postman.

### Endpoints

| Collection | Routes |
|---|---|
| `users` | `POST /users`, `GET /users`, `GET /users/{id}`, `PATCH /users/{id}`, `DELETE /users/{id}` |
| `teams` | `POST /teams`, `GET /teams`, `GET /teams/{id}`, `PATCH /teams/{id}`, `POST /teams/{id}/members`, `DELETE /teams/{id}/members/{userId}`, `DELETE /teams/{id}` |
| `contests` | `POST /contests`, `GET /contests`, `GET /contests/{id}`, `PATCH /contests/{id}`, `PATCH /contests/{id}/status`, `POST /contests/{id}/participants`, `GET /contests/{id}/leaderboard`, `DELETE /contests/{id}` |
| `problems` | `POST /problems` (`type` is `mcq`, `coding`, or `subjective`), `GET /problems?contestId=`, `GET /problems/{id}`, `PATCH /problems/{id}`, `DELETE /problems/{id}` |
| `submissions` | `POST /submissions`, `GET /submissions?contestId=&userId=&status=`, `GET /submissions/{id}`, `PATCH /submissions/{id}/status`, `DELETE /submissions/{id}` |
| sessions | `POST /sessions` (login), `GET /sessions/{id}`, `DELETE /sessions/{id}` (logout), Redis-backed |
| aggregations | `GET /aggregations/leaderboard/{contestId}`, `/avg-score-by-difficulty`, `/submission-status-by-contest`, `/problems-solved-per-user`, `/team-performance` |

All seeded users share the password `Passw0rd!` (see `scripts/seed.py`).

## Database features worth knowing about

Aggregation pipelines live in `api/aggregations/pipelines.py`: contest leaderboard, average score
per problem by difficulty, submission count by status per contest, distinct problems solved per
user, and team performance, which uses `$lookup` from `teams` to `submissions` on `memberIds`.

Indexes, all defined in `api/db.py`: a unique index on `users.email`, an index on
`problems.contestId`, a compound index on `submissions (contestId, submittedBy.refId)`, an index on
`submissions.problemId`, an index on `teams.memberIds`, and an index on `contests.status`.

Transactions live in `api/services.py` and are used by both the API and the seed script. Creating a
submission inserts it and bumps `problems.attemptCount` in the same transaction, so the two writes
can't drift apart. Updating a submission's status applies the score delta to the submitter's
`totalScore` at the same time. Adding or removing a team member updates `teams.memberIds` and the
`users.teamIds` back-reference together.

Every collection has a `$jsonSchema` validator in `api/db.py`, including a `oneOf` schema on
`problems` that requires different fields depending on whether `type` is mcq, coding, or
subjective.

## Sample data

`scripts/seed.py` generates about 88 records: 15 users, 5 teams, 5 contests (2 ended, 1 live, 2
upcoming), 15 problems (5 mcq, 5 coding, 5 subjective), and 40-50-odd submissions, only for
live/ended contests since an upcoming one wouldn't have any yet. Every `contestId`, `problemId`,
`submittedBy`, and `memberIds` reference points at a document that actually exists.

## Deployment

The frontend is on Vercel at `rankstack.upayan.dev` (`NEXT_PUBLIC_API_URL` points at the API
below). `.github/workflows/api-image.yml` builds `api/Dockerfile` on every push to `main` and
publishes `ghcr.io/upayanmazumder/rankstack/api:edge` (floating) and `:sha-<short>` (immutable).
The `upayanmazumder/vps` repo's Argo CD `de-rankstack` app (`k8s/apps/de/rankstack/`) tracks `:edge`
by digest and deploys to `api-rankstack.upayan.dev`, with MongoDB (replica set) and Redis running
in-cluster alongside it.

## Notes on scope

Passwords are hashed with PBKDF2-HMAC-SHA256 at 200k iterations, which is fine here but not what
you'd use behind a real auth provider. There's no frontend UI for most of this yet beyond the
`/motion` demo page; the API is meant to be exercised through Swagger, curl, or Postman for now.
