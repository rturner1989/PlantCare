# Rootine

Plant care assistant. Track watering, feeding, and the personality of each plant in your collection. Schedules adapt to per-space environment (light, temperature, humidity) rather than a one-size frequency.

Rails 8 API + React frontend. Work in progress — currently building toward a public beta.

> Note: codebase is named `PlantCare` for historical reasons. App-facing brand is **Rootine** (root + routine). Rebrand sweep deferred to a dedicated ticket.

## Stack

- **Backend** — Rails 8 (API-only), PostgreSQL 17, Redis, Sidekiq, custom JWT auth
- **Frontend** — React 19, Vite, TanStack Query, React Router, Tailwind v4, Biome
- **Tests** — Minitest + fixtures (API), Vitest + Playwright (client)
- **External** — Perenual API for species data (cached, 100/day free tier)
- **Dev** — Docker Compose, host UID/GID volume mounts

## Quick start

First-time setup:

```bash
./scripts/install.sh
```

Then:

```bash
docker compose up
```

Web client at `http://localhost:5173`, API at `http://localhost:3000`.

## Scripts

| Script | Purpose |
|---|---|
| `./scripts/install.sh` | One-shot setup — generates `.env`, builds, migrates, seeds |
| `./scripts/lint.sh` | Auto-fix lint (RuboCop, Brakeman, Bundler Audit, Biome) |
| `./scripts/run_tests.sh [api\|client]` | Run test suite |
| `./scripts/reset_db.sh` | Drop, create, migrate, seed |
| `./scripts/console.sh` | Rails console |
| `./scripts/bash.sh` | Shell into API container |
| `./scripts/npm_install.sh` | Install client deps (run after `package.json` changes) |

## Repo layout

```
api/           Rails 8 API
client/        React frontend (Vite)
docs/          Plans, mockups, design specs
scripts/       Docker dev helpers
CLAUDE.md      AI collaboration instructions (project + code style)
```

## Key concepts

- **Plant scheduling** — Watering/feeding frequency derived from species base × per-space environment modifiers. Users answer light/temp/humidity per space, not per plant.
- **Plant personality** — Species carry personality types (`dramatic`, `prickly`, `chill`, `needy`, `stoic`) that drive emote, colour, and motion. Visual-only.
- **Auth** — Custom JWT. Short-lived access token in memory + refresh token in httpOnly cookie.
- **Scoping** — Every query scopes through `current_user` via association. No policy gem.

## License

MIT — see [LICENSE](LICENSE).
