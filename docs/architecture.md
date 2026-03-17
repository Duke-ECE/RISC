# Architecture

## Principles

- Single responsibility per file.
- High cohesion inside modules.
- Low coupling across modules.
- Database schema is versioned through Flyway migrations.

## Runtime

- `backend`: Spring Boot API on port `8080`
- `frontend`: Vite dev server on port `5173`

## Startup order

1. Start backend.
2. Wait for `/api/health` to return success.
3. Start frontend.
