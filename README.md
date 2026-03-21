# RISC

RISC is a multiplayer strategy game project with a Spring Boot backend and two client modes:

- A web client (Vite + TypeScript)
- A terminal client (`npm run terminal`) for text-based turn control

The game supports **2 to 5 networked players** in a room-based workflow.

## Project Architecture

### High-level modules

- `backend/`: Spring Boot game server
  - Room management (`/api/rooms`)
  - Game state machine (LOBBY -> SETUP -> ORDERS -> GAME_OVER)
  - Turn validation and combat resolution
- `frontend/`: Vite TypeScript web app + Node terminal client
  - Browser UI in `src/main.ts`
  - Terminal client in `terminal_client.mjs`
- `docs/`: architecture and project documentation
- `shared/`: shared placeholders/docs
- `specs/`: assignment/spec references

### Runtime flow

1. Backend starts on HTTP (default `127.0.0.1:8080`)
2. Clients create/join a room via `/api/rooms`
3. Host starts the match
4. All players submit setup
5. Players submit orders each turn until one winner remains

## Requirements

- JDK `21+`
- Maven `3.9+`
- Node.js `20+`
- npm `10+`

## Configuration

### Ports

- Backend default: `8080`
- Frontend (web) default: `5173`

### Terminal client backend URL

The terminal client reads backend address from:

- `RISC_BACKEND_URL` (optional)
- fallback: `http://127.0.0.1:8080`

Example (if backend is on 8081): 

```bash
RISC_BACKEND_URL=http://127.0.0.1:8081 npm run terminal
```

## Startup Commands

From repo root:

```bash
make install
make backend-dev
make frontend-dev
```

Or start backend + frontend in one command:

```bash
make dev-up
```

Stop background backend started by `dev-up`:

```bash
make backend-stop
```

## Terminal Client Quick Start

Open a new terminal:

```bash
cd frontend
npm run terminal
```

If backend is not on `8080`: (e.g. nginx is on 8080)

```bash
cd frontend
RISC_BACKEND_URL=http://127.0.0.1:8081 npm run terminal
```

## Game Tutorial (Terminal Mode)

### 1. Create / Join room

- Host: choose `C` (create)
- Other players: choose `J`(join) and enter Room ID

### 2. Lobby management (host only)

Host commands:

- `S`: start game
- `A`: add seat
- `X`: remove last empty seat
- `R`: refresh
- `Q`: quit

Notes:

- Seats can be adjusted from **2 to 5**
- Game can start only when:
  - at least 2 players joined
  - no empty seat remains

### 3. Setup phase

Each player submits setup allocation once.

### 4. Orders phase

Main commands:

- `M`: queue move
- `A`: queue attack
- `D`: submit turn (`done`)
- `U`: undo last queued order
- `C`: clear queued orders

Input tips:

- Source/target can be selected by index or territory name
- For `MOVE`, target list excludes enemy-owned territories
- **Invalid submissions** do not exit the client; you can adjust and resubmit

### 5. Win condition

Game ends when only one player still controls territories.

## Combat Notes

- Attack is resolved by repeated dice rounds (`1..20` vs `1..20`)
- Defender wins ties
- So `6 vs 5` does **not** guarantee attacker victory

## API Endpoints (Core)

- `POST /api/rooms` create room
- `POST /api/rooms/{roomId}/join` join room
- `GET /api/rooms/{roomId}` room/game view
- `POST /api/rooms/{roomId}/start` start game (host)
- `POST /api/rooms/{roomId}/setup` submit setup
- `POST /api/rooms/{roomId}/turn` submit turn
- `POST /api/rooms/{roomId}/seats/add` add seat (host)
- `POST /api/rooms/{roomId}/seats/remove` remove seat (host)

## Troubleshooting

### `mvn: command not found`

Install Maven and JDK 21, then rerun backend.

### Terminal client gets HTML / nginx page instead of JSON

You are hitting the wrong service/port.

Check:

```bash
curl -i http://127.0.0.1:8080/api/health
```

If needed, run backend on another port and pass `RISC_BACKEND_URL`.

### `Done` submit fails repeatedly

Likely due invalid queued orders (adjacency, unit availability, etc.).

Use:

- `U` to remove the last queued order
- `C` to clear all queued orders and rebuild

## Development Notes

- Backend is authoritative for rule validation
- Client-side checks are convenience checks and may still be stricter/looser than server in edge cases
- Prefer testing multiplayer scenarios with at least two client terminals

## Repository Layout

```text
.
├── backend/
├── docs/
├── frontend/
│   ├── src/
│   └── terminal_client.mjs
├── shared/
├── specs/
└── Makefile
```
