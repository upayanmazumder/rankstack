"""FastAPI application entrypoint.

Run with: uvicorn api.main:app --reload
"""

from fastapi import FastAPI

from api.aggregations.pipelines import router as aggregations_router
from api.routes.contests import router as contests_router
from api.routes.problems import router as problems_router
from api.routes.sessions import router as sessions_router
from api.routes.submissions import router as submissions_router
from api.routes.teams import router as teams_router
from api.routes.users import router as users_router
from api.db import init_db

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
