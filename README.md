# RISC

Monorepo skeleton with a Spring Boot backend, Vite frontend, top-level startup orchestration, and Flyway-managed database migrations.

## Structure

```text
.
├── AGENTS.md
├── backend
├── docs
├── frontend
├── Makefile
├── shared
└── specs
```

## Requirements

- JDK 21+
- Maven 3.9+
- Node.js 20+
- npm 10+

## Commands

```bash
make install
make backend-dev
make frontend-dev
make dev-up
make backend-stop
```

## Notes

- Backend uses Spring Boot and exposes `GET /api/health`.
- Database migration files live under `backend/src/main/resources/db/migration`.
- `make dev-up` starts backend first, waits for health success, then starts frontend.
