.PHONY: help venv install up down logs init-db seed demo api test clean reset

PYTHON ?= python3.11
VENV := .venv
PY := $(VENV)/bin/python
PIP := $(VENV)/bin/pip
UVICORN := $(VENV)/bin/uvicorn

help:
	@echo "Targets:"
	@echo "  make up        - start MongoDB (replica set) + Redis via docker compose"
	@echo "  make down      - stop and remove the mongo/redis containers"
	@echo "  make logs      - tail docker compose logs"
	@echo "  make install   - create venv and install python dependencies"
	@echo "  make init-db   - create collections, \$$jsonSchema validators, indexes"
	@echo "  make seed      - wipe and reseed all 5 collections with sample data"
	@echo "  make demo      - run the intermediate demo script"
	@echo "  make api       - run the FastAPI dev server (http://localhost:8000/docs)"
	@echo "  make reset     - down + up + init-db + seed, from a clean slate"
	@echo "  make clean     - remove the venv and docker volumes"

$(VENV)/bin/python:
	$(PYTHON) -m venv $(VENV)

venv: $(VENV)/bin/python

install: venv
	$(PIP) install -q --upgrade pip
	$(PIP) install -q -r requirements.txt

up:
	docker compose up -d mongo redis
	docker compose up mongo-rs-init

down:
	docker compose down

logs:
	docker compose logs -f

init-db: install
	$(PY) scripts/init_db.py

seed: install
	$(PY) scripts/seed.py

demo: install
	$(PY) scripts/demo.py

api: install
	$(UVICORN) app.main:app --host 0.0.0.0 --port 8000 --reload

test: install
	$(PY) -m pytest -q

reset: down up init-db seed

clean:
	rm -rf $(VENV)
	docker compose down -v
