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
        "required": ["name", "memberIds", "createdAt"],
        "properties": {
            "name": {"bsonType": "string"},
            "memberIds": {"bsonType": "array", "items": {"bsonType": "objectId"}},
            "totalScore": {"bsonType": ["int", "double"]},
            "createdAt": {"bsonType": "date"},
        },
    }
}

CONTESTS_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["title", "startTime", "endTime", "status", "createdBy", "createdAt"],
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

COLLECTION_VALIDATORS = {
    "users": USERS_SCHEMA,
    "teams": TEAMS_SCHEMA,
    "contests": CONTESTS_SCHEMA,
    "problems": PROBLEMS_SCHEMA,
    "submissions": SUBMISSIONS_SCHEMA,
}


@lru_cache
def get_mongo_client() -> MongoClient:
    return MongoClient(settings.mongo_uri)


def get_db() -> Database:
    return get_mongo_client()[settings.mongo_db]


@lru_cache
def get_redis_client() -> redis.Redis:
    return redis.from_url(settings.redis_uri, decode_responses=True)


def ensure_collections(db: Database) -> None:
    """Create the 5 collections with $jsonSchema validators (idempotent)."""
    existing = set(db.list_collection_names())
    for name, validator in COLLECTION_VALIDATORS.items():
        if name in existing:
            db.command("collMod", name, validator=validator, validationLevel="moderate")
        else:
            try:
                db.create_collection(name, validator=validator, validationLevel="moderate")
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
    db["submissions"].create_index([("problemId", ASCENDING)], name="by_problem")
    db["teams"].create_index([("memberIds", ASCENDING)], name="by_member")
    db["contests"].create_index([("status", ASCENDING)], name="by_status")


def init_db() -> Database:
    db = get_db()
    ensure_collections(db)
    ensure_indexes(db)
    return db
