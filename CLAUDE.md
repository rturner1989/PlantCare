# PlantCare

Plant care assistant app. Rails 8 API + React frontend. Learning project for React (user writes all the code), but also designed as a shippable product.

## Current Status

**Backend MVP (Tasks 1-11) — COMPLETE.** All core API endpoints built, 134 tests passing. Ready to move to the React frontend (Tasks 12+).

Next task: **Task 12** — React foundation (API client, auth context, routing, layout).

## Architecture

**Monorepo:**
```
plant-care/
├── api/        # Rails 8 API (port 3000)
├── client/     # React + Vite (port 5173)
├── scripts/    # Dev workflow scripts
└── docker-compose.yml
```

**Stack:**
- **Backend:** Rails 8 (API mode), PostgreSQL, Redis, Sidekiq
- **Frontend:** React (JavaScript), Vite, TanStack Query, Tailwind, Biome, Playwright
- **Auth:** Custom JWT (access token in memory, refresh token in httpOnly cookie)
- **Search:** pg_search (Species has `tsearch + trigram`)
- **External:** Perenual API for plant species data (100 req/day, cached locally)

## Controller Hierarchy

```
ApplicationController (cookies, authenticatable concern)
├── Api::V1::BaseController (before_action :authenticate!)
│   ├── RoomsController
│   ├── PlantsController
│   ├── SpeciesController
│   ├── DashboardController
│   ├── ProfilesController
│   ├── Api::V1::Profile::PasswordsController
│   └── Api::V1::Plants::PlantScopedController (before_action :set_plant)
│       ├── CareLogsController
│       └── PlantPhotosController
│
├── Api::V1::AuthController (shared token issuance)
│   ├── RegistrationsController
│   └── SessionsController
│
└── Api::V1::TokensController (refresh token exchange)
```

## Key Models

- **User** — auth via `has_secure_password`, has_many rooms (plants through rooms)
- **Room** — user-owned, counter_cache for `plants_count`
- **Plant** — smart schedule calculation from species + environment (light/temperature/humidity)
- **Species** — reference data, seeded + Perenual API fallback, pg_search scope
- **CareLog** — watering/feeding actions, auto-updates plant timestamps via callback
- **PlantPhoto** — ActiveStorage attachment, chronological scope
- **RefreshToken** — hashed storage, usable? predicate, revoke! command
- **JwtToken** — plain Ruby class (`encode`/`decode`) in `app/models/`
- **PerenualClient** — HTTP client in `app/clients/`

## Plant Scheduling

Plants belong to rooms. Users don't set watering/feeding frequency directly — they answer environment questions (light, temperature, humidity) and the system calculates the schedule from the species' base frequency adjusted by modifier hashes on the Plant model.

- `Plant::LIGHT_MODIFIERS`, `TEMPERATURE_MODIFIERS`, `HUMIDITY_MODIFIERS`
- Validation uses `.keys` from these hashes — single source of truth
- `before_save :calculate_schedule, if: :should_recalculate?`

## Plant Personality

Species have personality types (`dramatic`, `prickly`, `chill`, `needy`, `stoic`) that drive UI behaviour. Plant cards show emotes and personality-driven status messages. Cactus is aloof, Monstera is dramatic, Snake Plant is chill.

## Development Commands

```bash
docker compose up                   # Start everything
./scripts/lint.sh                   # Auto-fix lint (RuboCop + Brakeman + Bundler Audit + Biome)
./scripts/run_tests.sh              # Run both API and client tests
./scripts/run_tests.sh api          # API tests only
./scripts/run_tests.sh client       # Client tests only
./scripts/reset_db.sh               # Drop, create, migrate, seed
./scripts/console.sh                # Rails console
./scripts/bash.sh                   # Shell into API container
```

## Branch Protection

- No direct pushes to `main`
- All work in feature branches → PR → merge
- CI runs lint + security + test on API changes, lint + build + test on client changes
- Merge commits preferred (not squash)

## Long-Term Vision

**Phase 1 (MVP, current)** — auth, rooms, plants, care, dashboard, photos, species, profile

**Phase 2** — push notifications (Web Push), AI plant recognition, adaptive scheduling

**Phase 3** — weather-adjusted care, home automation (soil probes), LLM-generated personality messages, **dollhouse view** (interactive 3D isometric house with Three.js, plant speech bubbles per room)

The dollhouse view is the standout product feature — keep data model decisions compatible with it.

## What Not to Touch

- `docs/superpowers/` is gitignored — never commit it
- `api/config/master.key` and `credentials.yml.enc` are gitignored
- `.env` is gitignored; `.env.example` is the template
