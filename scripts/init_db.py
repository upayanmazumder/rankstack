"""Idempotently create collections (with $jsonSchema validators) and indexes.

Usage: python scripts/init_db.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db import init_db  # noqa: E402


def main() -> None:
    db = init_db()
    print(f"Database '{db.name}' ready.")
    print("Collections:", sorted(db.list_collection_names()))
    for name in ["users", "teams", "contests", "problems", "submissions"]:
        idx_names = [i["name"] for i in db[name].list_indexes()]
        print(f"  {name} indexes: {idx_names}")


if __name__ == "__main__":
    main()
