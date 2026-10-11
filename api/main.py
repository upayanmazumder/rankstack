"""FastAPI application entrypoint.

Run with: uvicorn api.main:app --reload
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from pymongo.errors import ConnectionFailure, DuplicateKeyError, WriteError
from redis.exceptions import RedisError

from api.aggregations.pipelines import router as aggregations_router
from api.config import settings
from api.db import init_db
from api.routes.contests import router as contests_router
from api.routes.problems import router as problems_router
from api.routes.sessions import router as sessions_router
from api.routes.submissions import router as submissions_router
from api.routes.teams import router as teams_router
from api.routes.users import router as users_router

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


@app.exception_handler(RedisError)
def handle_redis_error(request: Request, exc: RedisError) -> JSONResponse:
    """Redis is unreachable, timed out, or refused a command. Covers
    ConnectionError and TimeoutError, both subclasses of RedisError."""
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
    """$jsonSchema validation failures and other single-document write
    errors that are not a duplicate key."""
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
