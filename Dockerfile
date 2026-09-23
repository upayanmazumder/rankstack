# Backend image: FastAPI + PyMongo API and the seed/demo scripts.
# Python 3.11 (pydantic-core has no wheel for 3.14 yet).
FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /srv

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY api ./api
COPY scripts ./scripts

RUN useradd --create-home --uid 10001 appuser && chown -R appuser:appuser /srv
USER appuser

EXPOSE 8000

# Scripts are included so init_db/seed can run as one-off jobs from the same image:
#   docker run --rm <image> python scripts/init_db.py
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
