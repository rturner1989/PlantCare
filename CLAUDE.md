# PlantCare

Plant care assistant app. Rails 8 API + React frontend. Learning project for React — the user drives the frontend work and writes code when they want hands-on practice, but can hand off to Claude for support, scaffolding, or unblocking at any time. Also designed as a shippable product.

## Current Status

**Backend MVP (Tasks 1-11) — COMPLETE.** All core API endpoints built, 134 tests passing. Frontend work starting.

**Next task: Frontend Plan Task 1** — Install dependencies + design tokens. See `docs/plans/2026-04-10-plantcare-frontend.md`.

**Note:** The old MVP plan (`docs/plans/2026-04-03-plantcare-mvp.md`) Tasks 12-21 are superseded by the new frontend plan.

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

## Project Documentation

```
docs/
├── specs/                          # Design specs (committed)
│   ├── 2026-04-03-plantcare-design.md      # Technical spec (data models, API, auth)
│   └── 2026-04-09-plantcare-ui-design.md   # UI/UX design spec (palette, IA, screens, animations)
├── plans/                          # Implementation plans (committed)
│   ├── 2026-04-03-plantcare-mvp.md         # Original MVP plan (backend tasks 1-11 done, frontend tasks 12-21 SUPERSEDED)
│   └── 2026-04-10-plantcare-frontend.md    # Current frontend plan (tasks 1-14, use this one)
├── mockups/plantcare-ui/           # HTML mockups (committed, open in browser)
│   └── 00-12 *.html                        # 13 self-contained mockup files with README
└── tickets/                        # Work tickets (committed)
    └── TICKET-NNN.html                     # Generated via /ticket skill
```

## Skills

- `/pre-commit` — run lint + tests, fix failures, prepare for commit
- `/ticket` — generate a Jira-style HTML ticket with requirements, acceptance criteria, and design references
- `/review-ticket` — review completed work against ticket acceptance criteria and design spec
- `/github-make-pr` — push current branch and create a GitHub pull request
- `/github-babysit-pr` — watch current PR for CI failures and auto-fix them

## What Not to Touch

- `api/config/master.key` and `credentials.yml.enc` are gitignored
- `.env` is gitignored; `.env.example` is the template
