"""FastAPI application entrypoint.

Run with: uvicorn app.main:app --reload
"""

from fastapi import FastAPI

from app.aggregations.pipelines import router as aggregations_router
from app.api.contests import router as contests_router
from app.api.problems import router as problems_router
from app.api.sessions import router as sessions_router
from app.api.submissions import router as submissions_router
from app.api.teams import router as teams_router
from app.api.users import router as users_router
from app.db import init_db

app = FastAPI(
    title="Rankstack — Contest Platform API",
    description="MongoDB + Redis backed contest platform with a live leaderboard.",
    version="0.2.0",
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}


app.include_router(users_router)
app.include_router(teams_router)
app.include_router(contests_router)
app.include_router(problems_router)
app.include_router(submissions_router)
app.include_router(sessions_router)
app.include_router(aggregations_router)
