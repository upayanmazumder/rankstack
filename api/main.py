"""FastAPI application entrypoint.

Run with: uvicorn api.main:app --reload
"""

import logging
from concurrent.futures import ThreadPoolExecutor
from concurrent.futures import TimeoutError as FutureTimeoutError

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from pymongo.errors import (
    ConnectionFailure,
    DuplicateKeyError,
    PyMongoError,
    WriteError,
)
from redis.exceptions import ConnectionError as RedisConnectionError
from redis.exceptions import RedisError
from redis.exceptions import TimeoutError as RedisTimeoutError

from api.aggregations.pipelines import router as aggregations_router
from api.config import settings
from api.db import get_db, get_redis_client, init_db
from api.routes.contests import router as contests_router
from api.routes.problems import router as problems_router
from api.routes.sessions import router as sessions_router
from api.routes.submissions import router as submissions_router
from api.routes.teams import router as teams_router
from api.routes.users import router as users_router

logger = logging.getLogger(__name__)

# Runs each `/health/ready` dependency ping under its own hard wall-clock
# deadline (`settings.readiness_timeout_seconds`), independent of the
# client's own socket timeouts: those bound normal request handling and are
# deliberately looser than the probe's `timeoutSeconds`. A ping that blows
# its deadline leaves its worker thread running until the client's own
# timeout eventually unblocks it -- acceptable since probes are infrequent
# and the underlying client timeouts remain finite.
_readiness_executor = ThreadPoolExecutor(
    max_workers=2, thread_name_prefix="readiness-ping"
)


def _ping_within_deadline(ping) -> bool:
    try:
        _readiness_executor.submit(ping).result(
            timeout=settings.readiness_timeout_seconds
        )
        return True
    except FutureTimeoutError:
        return False


app = FastAPI(
    title="Rankstack — Contest Platform API",
    description="MongoDB + Redis backed contest platform with a live leaderboard.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB write error code for $jsonSchema validation failures.
_MONGO_DOCUMENT_VALIDATION_CODE = 121


@app.exception_handler(RedisError)
def handle_redis_error(request: Request, exc: RedisError) -> JSONResponse:
    """Redis is unreachable or timed out. Other RedisError subtypes (e.g.
    command/auth errors) are not transient dependency failures and are
    re-raised for the default handler instead of being reported as 503."""
    if not isinstance(exc, (RedisConnectionError, RedisTimeoutError)):
        raise exc
    logger.error(
        "Redis connection/timeout error on %s %s", request.method, request.url.path
    )
    return JSONResponse(
        status_code=503,
        content={"detail": "A dependent service is temporarily unavailable."},
        headers={"Retry-After": "5"},
    )


@app.exception_handler(ConnectionFailure)
def handle_mongo_connection_failure(
    request: Request, exc: ConnectionFailure
) -> JSONResponse:
    """MongoDB is unreachable or took too long to select a server. Covers
    AutoReconnect and ServerSelectionTimeoutError, both subclasses of
    ConnectionFailure."""
    logger.error(
        "MongoDB connection failure on %s %s", request.method, request.url.path
    )
    return JSONResponse(
        status_code=503,
        content={"detail": "A dependent service is temporarily unavailable."},
        headers={"Retry-After": "5"},
    )


@app.exception_handler(DuplicateKeyError)
def handle_duplicate_key(request: Request, exc: DuplicateKeyError) -> JSONResponse:
    return JSONResponse(
        status_code=409, content={"detail": "The resource already exists."}
    )


@app.exception_handler(WriteError)
def handle_write_error(request: Request, exc: WriteError) -> JSONResponse:
    """Only $jsonSchema document validation failures (Mongo error code 121)
    are reported as a client error. Other write errors are server errors."""
    if exc.code != _MONGO_DOCUMENT_VALIDATION_CODE:
        raise exc
    return JSONResponse(
        status_code=422, content={"detail": "The request failed document validation."}
    )


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get(
    "/health",
    tags=["meta"],
    summary="Check API health",
    description="Return a basic liveness status for the API process. Returns 200 when the process is responding.",
    responses={200: {"content": {"application/json": {"example": {"status": "ok"}}}}},
)
def health():
    """Report that the API process is responding."""
    return {"status": "ok"}


@app.get(
    "/health/ready",
    tags=["meta"],
    summary="Check API readiness",
    description="Ping MongoDB and Redis with a short timeout. Use for the readiness probe only, not liveness: a dependency outage should take the pod out of rotation without restarting it. Returns 200 when both are reachable; 503 otherwise.",
    responses={
        200: {"content": {"application/json": {"example": {"status": "ok"}}}},
        503: {
            "content": {
                "application/json": {"example": {"detail": "mongo is unreachable"}}
            }
        },
    },
)
def health_ready():
    """Report whether MongoDB and Redis are both reachable within a short,
    bounded deadline right now."""
    try:
        if not _ping_within_deadline(lambda: get_db().command("ping")):
            raise PyMongoError("ping exceeded readiness deadline")
    except PyMongoError:
        return JSONResponse(status_code=503, content={"detail": "mongo is unreachable"})
    try:
        if not _ping_within_deadline(lambda: get_redis_client().ping()):
            raise RedisError("ping exceeded readiness deadline")
    except RedisError:
        return JSONResponse(status_code=503, content={"detail": "redis is unreachable"})
    return {"status": "ok"}


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")


app.include_router(users_router)
app.include_router(teams_router)
app.include_router(contests_router)
app.include_router(problems_router)
app.include_router(submissions_router)
app.include_router(sessions_router)
app.include_router(aggregations_router)
