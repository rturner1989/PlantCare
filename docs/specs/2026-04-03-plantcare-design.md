# PlantCare — Design Spec

**Working title.** A plant care assistant app that helps users keep their plants healthy through smart scheduling, personalised reminders, and plant personality.

**Date:** 2026-04-03

---

## Purpose

Users forget to water and care for their plants. PlantCare removes the guesswork by automatically calculating care schedules based on plant species and environment, presenting care tasks through an engaging dashboard where each plant has personality and expressive emotes.

This is a real product — designed to be shippable, cloud-hosted, and accessible via browser or as a PWA on mobile devices.

## Development Approach

- **Learning-first workflow.** The user writes all code. AI assists with guidance, decisions, and unblocking — not writing code.
- **Product mindset.** Clean architecture, proper auth, shippable UI. Not a portfolio demo.
- **Portfolio progression.** EmuVault (full-stack Rails) → PlantCare (Rails API + React JS) → future project (TypeScript + Go).

---

## Architecture

### Stack

| Layer | Technology |
|-------|-----------|
| Backend | Rails 8 (API mode) |
| Frontend | React (Vite, JavaScript) |
| Styling | Tailwind CSS |
| State management | TanStack Query + React built-in hooks |
| Routing | React Router |
| Database | PostgreSQL |
| Cache / Jobs | Redis + Sidekiq |
| File storage | ActiveStorage |
| Infrastructure | Docker Compose (monorepo) |
| Deployment | Cloud-hosted (provider TBD) |
| Mobile | PWA (service worker, Add to Home Screen) |

### Project Structure

```
plant-care/
├── api/              # Rails 8 API
├── client/           # React app (Vite)
├── docker-compose.yml
└── README.md
```

### Docker Services

- `api` — Rails API server
- `client` — React dev server (Vite)
- `db` — PostgreSQL
- `redis` — Redis
- `sidekiq` — Background job processor

---

## Authentication

Custom JWT auth using Rails-native `has_secure_password` with bcrypt. No Devise.

### Token Strategy

- **Access token:** 15-minute expiry, stored in memory on the client. Sent via `Authorization: Bearer` header.
- **Refresh token:** 30-day expiry, stored as an httpOnly cookie. Used to obtain new access tokens.
- **Auto-refresh:** React intercepts 401 responses, calls the refresh endpoint, and retries the original request.

### Auth Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/register` | Create account, returns access + refresh tokens |
| POST | `/api/v1/login` | Authenticate, returns access + refresh tokens |
| POST | `/api/v1/refresh` | Exchange refresh token for new access token |
| DELETE | `/api/v1/logout` | Revoke refresh token |

---

## Data Models

### User

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| email | string | unique, required |
| password_digest | string | bcrypt hash |
| name | string | required |
| timezone | string | for scheduling reminders correctly |
| created_at | datetime | |

**Associations:** has_many :rooms, has_many :plants (through :rooms), has_many :refresh_tokens

### Room

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| user_id | bigint | FK → User |
| name | string | required (e.g. "Living Room") |
| icon | string | nullable, visual identifier |
| created_at | datetime | |

**Associations:** belongs_to :user, has_many :plants

### Plant

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| room_id | bigint | FK → Room |
| species_id | bigint | FK → Species, nullable |
| nickname | string | required (e.g. "Sir Plantalot") |
| notes | text | nullable |
| light_level | string | bright / medium / low (user-reported environment) |
| temperature_level | string | cool / average / warm |
| humidity_level | string | dry / average / humid |
| calculated_watering_days | integer | system-computed from species + environment |
| calculated_feeding_days | integer | system-computed, nullable |
| last_watered_at | datetime | |
| last_fed_at | datetime | nullable |
| acquired_at | date | nullable |
| created_at | datetime | |

**Associations:** belongs_to :room, belongs_to :species (optional), has_many :plant_photos, has_many :care_logs

**Schedule calculation:** The user never sets watering/feeding frequency directly. During plant setup, the user answers environment questions (light, temperature, humidity). The system calculates the schedule from the species' base frequency adjusted by environment context. The user can recalculate by re-answering the questions.

### Species

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| common_name | string | required |
| scientific_name | string | |
| watering_frequency_days | integer | base frequency (before environment adjustment) |
| feeding_frequency_days | integer | nullable |
| light_requirement | string | |
| humidity_preference | string | |
| temperature_min | decimal | Celsius |
| temperature_max | decimal | Celsius |
| toxicity | string | nullable (pet/child safety info) |
| difficulty | string | nullable (beginner / intermediate / advanced) |
| growth_rate | string | nullable (slow / moderate / fast) |
| personality | string | e.g. prickly, dramatic, chill, needy, stoic |
| description | text | |
| care_tips | text | |
| image_url | string | nullable |
| source | string | "seed" or "api" |
| external_id | string | nullable, for API-sourced records |
| created_at | datetime | |

**Data source:** Seeded with common houseplants (100-200). Perenual API as fallback for uncommon species. API results are cached locally as new Species records.

### PlantPhoto

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| plant_id | bigint | FK → Plant |
| caption | string | nullable |
| taken_at | datetime | when the photo was taken |
| created_at | datetime | |

**Attachment:** has_one_attached :image (ActiveStorage)

**Purpose:** Photo journal / growth timeline. Displayed chronologically on the plant detail page.

### CareLog

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| plant_id | bigint | FK → Plant |
| care_type | string | "watering" or "feeding" |
| performed_at | datetime | |
| notes | string | nullable |
| created_at | datetime | |

**Behaviour:** Creating a CareLog also updates the corresponding `last_watered_at` or `last_fed_at` on the Plant. Extensible for future care types (repotting, misting, pruning).

### RefreshToken

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| user_id | bigint | FK → User |
| token_digest | string | hashed token |
| expires_at | datetime | |
| revoked_at | datetime | nullable, set on logout |
| created_at | datetime | |

### PushSubscription (Phase 2)

| Field | Type | Notes |
|-------|------|-------|
| id | bigint | PK |
| user_id | bigint | FK → User |
| endpoint | string | Web Push endpoint |
| p256dh_key | string | |
| auth_key | string | |
| created_at | datetime | |

---

## API Endpoints

All endpoints are namespaced under `/api/v1/`. All protected endpoints require a valid access token.

### Dashboard

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/dashboard` | Today's care tasks, plant statuses, summary stats |

Response includes:
- `plants_needing_water` — plants overdue or due today, with days overdue
- `plants_needing_feeding` — same for feeding
- `upcoming_care` — plants with care coming up in the next few days
- `stats` — total plants, total rooms, care streak

### Rooms

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/rooms` | List rooms with plant counts |
| POST | `/api/v1/rooms` | Create a room |
| GET | `/api/v1/rooms/:id` | Room detail with its plants |
| PATCH | `/api/v1/rooms/:id` | Update room |
| DELETE | `/api/v1/rooms/:id` | Delete room (must reassign or delete plants first) |

### Plants

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/plants` | List all user's plants (filterable by room) |
| POST | `/api/v1/plants` | Add a plant |
| GET | `/api/v1/plants/:id` | Plant detail with species info and care status |
| PATCH | `/api/v1/plants/:id` | Update plant |
| DELETE | `/api/v1/plants/:id` | Remove a plant |
| POST | `/api/v1/plants/:id/care` | Log care action (water/feed), updates last cared timestamps |

### Plant Photos

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/plants/:plant_id/photos` | Photo journal timeline |
| POST | `/api/v1/plants/:plant_id/photos` | Upload a photo with caption |
| DELETE | `/api/v1/plants/:plant_id/photos/:id` | Delete a photo |

### Care Logs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/plants/:plant_id/care_logs` | Care history (filterable by type) |

### Species Lookup

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/species/search?q=monstera` | Search local DB, fallback to Perenual API |
| GET | `/api/v1/species/:id` | Full species detail |

### User Settings

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/profile` | Current user info |
| PATCH | `/api/v1/profile` | Update name, email, timezone |
| PATCH | `/api/v1/profile/password` | Change password |

---

## React Routes

| Route | Page | Auth |
|-------|------|------|
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/` | Dashboard — today's tasks, plant statuses with emotes | Protected |
| `/rooms` | Room list / grid view | Protected |
| `/rooms/:id` | Room detail with its plants | Protected |
| `/plants/new` | Add plant (species search, room select, environment questions) | Protected |
| `/plants/:id` | Plant detail — emote, info, photos, care log, species | Protected |
| `/settings` | Profile, password, preferences | Protected |

---

## Core UX Features

### Plant Personality & Emotes

Each plant has personality and expressive emotes, inspired by desk robots / Tamagotchis.

- **Personality is tied to species.** A cactus is prickly and aloof. A monstera is dramatic. A snake plant is chill. A fern is needy.
- **Emote states:** happy, thirsty, wilting, refreshed, fed, content. Displayed as expressive faces/icons on plant cards.
- **Status messages:** Template-based messages that match the plant's personality and current care state.
  - Prickly cactus: "I'm fine. Stop fussing."
  - Dramatic monstera: "I'm PARCHED! How could you forget about me?!"
  - Chill snake plant: "No rush. Whenever you're ready."
- **MVP:** Pre-written message templates (5-10 variants per personality + status combination).
- **Phase 3:** LLM-generated dynamic messages as a premium feature.

### Smart Scheduling

Users do not manually set watering or feeding frequencies.

**Add plant flow:**
1. Search/select species
2. App asks environment questions: light level, temperature, humidity
3. System calculates schedule from species base frequency + environment adjustments
4. User sees the result: "I'll remind you to water every 5 days and feed every 14 days"

**Recalculation:** User can re-answer environment questions at any time to recalculate.

**Future (Phase 2/3):** Adaptive scheduling — the system analyses care log patterns and adjusts frequency over time.

### Dashboard

The main view is **"what do I need to do today?"** — not a plant list.

- Urgent tasks first (overdue plants)
- Due today
- Upcoming care (next few days)
- Quick action: mark as watered/fed directly from the dashboard
- Each plant shows its emote and a personality-driven status message

### Photo Journal

Each plant has a chronological photo timeline with captions. Displayed on the plant detail page. Supports growth tracking over time.

---

## Feature Phasing

### Phase 1 — MVP

- User accounts (register, login, JWT auth)
- Rooms (CRUD, icons)
- Plants (CRUD, species link, environment setup, smart scheduling)
- Care tracking (watering, feeding, care logs)
- Dashboard (today's tasks, emotes, personality messages, room grouping)
- Photo journal (upload, caption, timeline)
- Species database (seeded + Perenual API fallback)
- Species detail (care info, toxicity, difficulty, personality)
- Settings (profile, password)
- Docker Compose development environment

### Phase 2 — Notifications & AI

- Push notifications (PWA service worker, Web Push API, VAPID keys, Sidekiq)
- Notification preferences
- AI plant recognition (photo → species identification via Plant.id or PlantNet)
- AI disease detection (photo → diagnose problems, care recommendations)
- Adaptive scheduling (system learns from care log patterns)

### Phase 3 — Smart Features

- Weather-adjusted care schedules
- Humidity tracking
- Home automation integration (smart probes: soil moisture, light sensors)
- Sensor-driven scheduling (real data replaces user-reported environment)
- LLM-generated personality messages
- Dollhouse view (see below)

### Dollhouse View (Phase 3)

An interactive 3D isometric house using Three.js that replaces the standard room list. The user configures their house layout during setup (number of rooms, bathrooms, etc.).

**Experience flow:**
- Top level: isometric/3D house with labelled rooms, cutaway or transparent roof
- Click a room: camera swoops in with animation, walls fade, room fills the view
- Plant list appears as cards/tiles overlaid on or beside the 3D scene
- Plants with personality speech bubbles visible in the room (e.g. cactus in the bedroom: "I'm fine. I've been fine for two weeks. Stop watering me.")
- Click a plant: navigates to plant detail or opens a details panel
- Back button: camera pulls back out to the full house view

**Visual style:** Cozy dollhouse aesthetic. Plants are visible in their rooms with expressive emotes and speech bubbles driven by the personality system. The house feels alive.

**Dependencies:** Room model (exists), plant personalities (planned), Three.js, house layout configuration (new).

---

## External Services

| Service | Purpose | Phase |
|---------|---------|-------|
| Perenual API | Plant species data, care info | MVP |
| Plant.id / PlantNet | AI plant recognition, disease detection | Phase 2 |
| Web Push (VAPID) | Browser push notifications | Phase 2 |
| Weather API (TBD) | Weather-adjusted schedules | Phase 3 |
| Home automation (TBD) | Smart sensor integration | Phase 3 |
