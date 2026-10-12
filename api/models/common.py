"""Shared helpers: ObjectId <-> str conversion, timestamps, doc serialization."""

from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException


def new_object_id() -> ObjectId:
    return ObjectId()


def oid(value: str) -> ObjectId:
    """Parse a request-supplied id string into an ObjectId, or 400."""
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail=f"Invalid id: {value!r}")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def serialize_value(v: Any) -> Any:
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, dict):
        return {k: serialize_value(x) for k, x in v.items()}
    if isinstance(v, list):
        return [serialize_value(x) for x in v]
    return v


def serialize_doc(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    """Convert a raw Mongo document into a JSON-safe dict: `_id` -> `id` (str),
    and every nested ObjectId -> str."""
    if doc is None:
        return None
    out: dict[str, Any] = {}
    for k, v in doc.items():
        key = "id" if k == "_id" else k
        out[key] = serialize_value(v)
    return out


def paginate_collection(
    collection: Any,
    *,
    query: dict[str, Any] | None = None,
    limit: int,
    offset: int = 0,
    sort: list[tuple[str, int]] | tuple[str, int] | None = None,
):
    """Apply a stable sort, skip/limit window, and return the Mongo cursor."""
    cursor = collection.find(query or {})
    if sort is not None:
        cursor = cursor.sort(sort)
    if offset > 0:
        cursor = cursor.skip(offset)
    return cursor.limit(limit)
