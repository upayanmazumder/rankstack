"""Mongo + Redis client singletons, collection/$jsonSchema setup, and indexes."""

from functools import lru_cache

import redis
from pymongo import ASCENDING, MongoClient
from pymongo.database import Database
from pymongo.errors import CollectionInvalid

from api.config import settings

# --- $jsonSchema validators -------------------------------------------------
# Enforced server-side by MongoDB on insert/update. The `problems` validator
# uses `oneOf` to require different fields per polymorphic `type`, which is
# the direct NoSQL-level expression of the polymorphic design from Review 1.

USERS_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["name", "email", "passwordHash", "role", "createdAt"],
        "properties": {
            "name": {"bsonType": "string"},
            "email": {"bsonType": "string"},
            "passwordHash": {"bsonType": "string"},
            "role": {"enum": ["participant", "admin"]},
            "totalScore": {"bsonType": ["int", "double"]},
            "teamIds": {"bsonType": "array", "items": {"bsonType": "objectId"}},
            "createdAt": {"bsonType": "date"},
        },
    }
}

TEAMS_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["name", "memberIds", "ownerId", "createdAt"],
        "properties": {
            "name": {"bsonType": "string"},
            "memberIds": {"bsonType": "array", "items": {"bsonType": "objectId"}},
            "ownerId": {"bsonType": "objectId"},
            "totalScore": {"bsonType": ["int", "double"]},
            "createdAt": {"bsonType": "date"},
        },
    }
}

CONTESTS_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "title",
            "startTime",
            "endTime",
            "status",
            "createdBy",
            "createdAt",
        ],
        "properties": {
            "title": {"bsonType": "string"},
            "description": {"bsonType": "string"},
            "startTime": {"bsonType": "date"},
            "endTime": {"bsonType": "date"},
            "status": {"enum": ["upcoming", "live", "ended"]},
            "createdBy": {"bsonType": "objectId"},
            "problemIds": {"bsonType": "array", "items": {"bsonType": "objectId"}},
            "participants": {
                "bsonType": "array",
                "items": {
                    "bsonType": "object",
                    "required": ["refType", "refId"],
                    "properties": {
                        "refType": {"enum": ["user", "team"]},
                        "refId": {"bsonType": "objectId"},
                    },
                },
            },
            "createdAt": {"bsonType": "date"},
        },
    }
}

PROBLEMS_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["contestId", "type", "title", "difficulty", "points", "createdAt"],
        "properties": {
            "contestId": {"bsonType": "objectId"},
            "type": {"enum": ["mcq", "coding", "subjective"]},
            "title": {"bsonType": "string"},
            "description": {"bsonType": "string"},
            "difficulty": {"enum": ["easy", "medium", "hard"]},
            "points": {"bsonType": ["int", "double"]},
            "attemptCount": {"bsonType": ["int", "double"]},
            "createdAt": {"bsonType": "date"},
        },
        "oneOf": [
            {
                "properties": {
                    "type": {"enum": ["mcq"]},
                    "options": {"bsonType": "array", "items": {"bsonType": "string"}},
                    "correctAnswer": {"bsonType": "string"},
                },
                "required": ["options", "correctAnswer"],
            },
            {
                "properties": {
                    "type": {"enum": ["coding"]},
                    "inputFormat": {"bsonType": "string"},
                    "constraints": {"bsonType": "string"},
                    "testCases": {"bsonType": "array"},
                },
                "required": ["testCases"],
            },
            {
                "properties": {
                    "type": {"enum": ["subjective"]},
                    "wordLimit": {"bsonType": ["int", "double"]},
                    "evaluationRubric": {"bsonType": "string"},
                },
                "required": ["evaluationRubric"],
            },
        ],
    }
}

SUBMITTED_BY_SCHEMA = {
    "bsonType": "object",
    "required": ["refType", "refId"],
    "properties": {
        "refType": {"enum": ["user", "team"]},
        "refId": {"bsonType": "objectId"},
    },
}

SUBMISSIONS_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "contestId",
            "problemId",
            "submittedBy",
            "answer",
            "status",
            "score",
            "submittedAt",
        ],
        "properties": {
            "contestId": {"bsonType": "objectId"},
            "problemId": {"bsonType": "objectId"},
            "submittedBy": SUBMITTED_BY_SCHEMA,
            "answer": {},
            "status": {"enum": ["pending", "correct", "incorrect", "partial"]},
            "score": {"bsonType": ["int", "double"]},
            "submittedAt": {"bsonType": "date"},
        },
    }
}

DIRTY_LEADERBOARDS_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["_id"],
        "properties": {
            "_id": {"bsonType": "objectId"},
            "dirty": {"bsonType": "bool"},
            "version": {"bsonType": ["int", "long"]},
            "reconciledVersion": {"bsonType": ["int", "long", "null"]},
        },
    }
}


COLLECTION_VALIDATORS = {
    "users": USERS_SCHEMA,
    "teams": TEAMS_SCHEMA,
    "contests": CONTESTS_SCHEMA,
    "problems": PROBLEMS_SCHEMA,
    "submissions": SUBMISSIONS_SCHEMA,
    "dirty_leaderboards": DIRTY_LEADERBOARDS_SCHEMA,
}


@lru_cache
def get_mongo_client() -> MongoClient:
    return MongoClient(
        settings.mongo_uri,
        serverSelectionTimeoutMS=settings.mongo_server_selection_timeout_ms,
        connectTimeoutMS=settings.mongo_connect_timeout_ms,
        socketTimeoutMS=settings.mongo_socket_timeout_ms,
    )


def get_db() -> Database:
    return get_mongo_client()[settings.mongo_db]


@lru_cache
def get_redis_client() -> redis.Redis:
    return redis.from_url(
        settings.redis_uri,
        decode_responses=True,
        socket_timeout=settings.redis_socket_timeout_seconds,
        socket_connect_timeout=settings.redis_socket_connect_timeout_seconds,
    )


def ensure_collections(db: Database) -> None:
    """Create collections with $jsonSchema validators (idempotent)."""
    existing = set(db.list_collection_names())
    for name, validator in COLLECTION_VALIDATORS.items():
        if name in existing:
            db.command("collMod", name, validator=validator, validationLevel="moderate")
        else:
            try:
                db.create_collection(
                    name, validator=validator, validationLevel="moderate"
                )
            except CollectionInvalid:
                pass


def ensure_indexes(db: Database) -> None:
    """Create the indexes used by the app's read paths (idempotent)."""
    db["users"].create_index([("email", ASCENDING)], unique=True, name="uniq_email")
    db["problems"].create_index([("contestId", ASCENDING)], name="by_contest")
    db["submissions"].create_index(
        [("contestId", ASCENDING), ("submittedBy.refId", ASCENDING)],
        name="by_contest_and_submitter",
    )
    db["submissions"].create_index(
        [("submittedBy.refType", ASCENDING), ("submittedBy.refId", ASCENDING)],
        name="by_submitter",
    )
    db["submissions"].create_index([("problemId", ASCENDING)], name="by_problem")
    db["teams"].create_index([("memberIds", ASCENDING)], name="by_member")
    db["contests"].create_index([("status", ASCENDING)], name="by_status")


def backfill_team_owners(db: Database) -> None:
    """Set `ownerId` on teams created before the field existed, to their
    first member. `validationLevel="moderate"` lets this update run on
    documents that do not yet satisfy the current schema.

    Each write re-checks that `ownerId` is still unset AND that the chosen
    member is still present, closing the race where a concurrent
    membership change (e.g. that member leaving) could otherwise install a
    departed member as owner. If that conditional write misses because
    membership changed since the read, the team is re-read and retried
    (bounded) against its current membership rather than silently left
    without an owner for the rest of this process's lifetime.

    Teams predating the invariant that a team is deleted rather than left
    without members (`remove_team_member`, `delete_user_transaction`) have
    no member to become owner; since `TeamOut.ownerId` is required, such
    orphaned teams are removed through `delete_team_transaction`'s own
    submission/contest/leaderboard cascade rather than exposed broken.
    `require_empty=True` rechecks emptiness inside that transaction, so a
    team that gains a member between this read and the delete is spared.
    """
    from api.services import delete_team_transaction  # local import: api.services
    # imports api.redis_ops, which imports api.db, so a module-level import
    # here would be circular.

    for stub in db["teams"].find({"ownerId": {"$exists": False}}, {"_id": 1}):
        team_id = stub["_id"]
        for _ in range(5):  # bounded retries against concurrent membership churn
            team = db["teams"].find_one(
                {"_id": team_id}, {"memberIds": 1, "ownerId": 1}
            )
            if team is None or "ownerId" in team:
                break  # deleted, or already owned by this loop or a concurrent writer
            member_ids = team.get("memberIds") or []
            if not member_ids:
                delete_team_transaction(db, team_id, require_empty=True)
                break
            result = db["teams"].update_one(
                {
                    "_id": team_id,
                    "ownerId": {"$exists": False},
                    "memberIds": member_ids[0],
                },
                {"$set": {"ownerId": member_ids[0]}},
            )
            if result.matched_count:
                break
        else:
            raise RuntimeError(
                f"Could not backfill ownerId for team {team_id} after five attempts"
            )


def init_db() -> Database:
    db = get_db()
    ensure_collections(db)
    ensure_indexes(db)
    backfill_team_owners(db)
    return db
