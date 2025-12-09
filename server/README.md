# AIDevelo API — server

This folder contains the backend API server for AIDevelo.ai.

Environment variables
- Copy `server/.env.example` to `server/.env` for local development and fill in values.
- **Do not commit secrets** (the repository `.gitignore` already ignores `.env`).
- In production, set environment variables in the hosting environment (e.g., cloud provider secrets, Kubernetes secrets, etc.). The server will exit at startup if required production secrets are missing.

Running locally
- Install dependencies from the repo root or inside `server/` using the repository's package manager.
- Use `npm run dev` from the `server` folder to start in development with hot reload.

Running with a reproducible local dev stack (Docker Compose)

For an easy, reproducible developer environment we've added `docker-compose.dev.yml` at the repository root. It brings up the backend plus commonly used services for development and testing:


Quick start (from repository root):

Optional: enable OpenTelemetry in your dev image
------------------------------------------------

OpenTelemetry packages were intentionally left out of the default `server/package.json` to avoid peer-dependency and build-time failures for developers who don't need tracing locally. If you want full tracing inside the container, install compatible packages and rebuild the image.

Recommended quick steps inside `server/`:

```powershell
npm install @opentelemetry/api@^1.8.0 @opentelemetry/sdk-node@^0.51.0 @opentelemetry/exporter-trace-otlp-http@^0.51.0 @opentelemetry/auto-instrumentations-node@^0.48.0 --save
```

After installing, rebuild your server image:

```powershell
docker compose -f ../docker-compose.dev.yml build server
```

If you don't install these packages, observability will be disabled but the server will run normally.

# Stop and remove running containers
docker compose -f docker-compose.dev.yml down
```

Expected ports (local host):

- Backend API: http://localhost:5000
- Postgres: localhost:5432
- Redis: localhost:6379
- Qdrant REST API: http://localhost:6333
- Jaeger UI: http://localhost:16686 (view traces here)

Notes
-----
- The compose setup mounts the server source directory into the container so changes are reflected without rebuilding.
- Make sure you copy `server/.env.example` to `server/.env` and adjust values (especially `DATABASE_URL`, `QDRANT_URL`, and `REDIS_URL`) when running the compose stack.
- If you prefer running the backend and frontend locally without containers, start them individually (the compose file is optional). 

Migrations / dev init step
-------------------------

The development compose environment runs a small initialization step inside the server container before starting the server. The init step:

- waits for Postgres (and optionally Qdrant/Redis) to be reachable
- runs any SQL migration files found under `server/db/migrations`

You can run the same locally (without compose) using the migration helper scripts:

```powershell
cd server
# Wait for services and run migrations
npm run wait-and-migrate

# Run migrations manually
npm run migrate
```

Migration files live in `server/db/migrations` and are applied in filename order. The migration runner creates a `schema_migrations` table to make successive runs idempotent.
