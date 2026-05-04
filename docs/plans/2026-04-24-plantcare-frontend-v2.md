# PlantCare Frontend v2 Implementation Plan

> **Supersedes:** `docs/plans/2026-04-10-plantcare-frontend.md` (2026-04-10 plan). Backend tasks 1–11 from that plan remain complete and merged. Frontend tasks 12–21 are retired in favour of this doc.
>
> **For agentic workers:** REQUIRED SUB-SKILL — use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to work task-by-task. Steps use checkbox (`- [ ]`) syntax.

---

## 1. Why this plan exists

The 2026-04-10 plan's frontend half started drifting toward a generic plant-app feel. TICKET-010 (House) paused mid-PR when it became obvious the screens needed a shared layout grammar, collection-first framing, and a unified motion/tab vocabulary before any more regions landed.

The 2026-04-23/24 design pivot (`docs/specs/2026-04-23-plantcare-design-v2.md`) resolved that. Seven regions, indie tone, warm paper palette, file-tab + segment primitives, radial wheel, weekly/monthly calendar, outdoor-plant weather pills, intent-adaptive onboarding. Twenty mockups (17–36) render every region at desktop + mobile side-by-side as the frozen visual contract.

Implementation has been PAUSED since 2026-04-22. This plan resumes it, with two non-negotiable additions:

1. **Per-ticket review-skill gates.** Every ticket's AC wires `/vercel-react-best-practices` + `/accessibility` for frontend work and `/dhh-rails-reviewer` for backend work. Not a suggestion in the intro — a gate on done.
2. **Pre-launch `Room` → `Space` rename.** Committed in v2. Lands as the first backend ticket so downstream code only knows one noun.

---

## 2. Goal

Ship the seven-region v2 frontend at post-mockup-21 quality, backed by the backend deltas the new regions demand, with Robert-standard review gates enforced per ticket from day one.

Regions shipped by end of plan: **Today · House · Plant Detail · Journal · Encyclopedia · Me · Add Plant**. Plant Doctor flow (mockup 33) is scoped but sequenced at the tail — it's a post-MVP-v2 bonus, not a launch blocker.

---

## 3. Architecture snapshot

- SPA via React Router 7 (React 19, TanStack Query 5, Tailwind v4, Biome).
- Motion via `motion/react`; sheets via Vaul. No CSS keyframes we can't port to `motion/react-native` later.
- Mobile-first responsive chrome already shipped: Dock on mobile, Sidebar on desktop, `md` breakpoint flip. Drawer/sheet portals live via `position: fixed` — design stays RN-portable (flex + absolute, no `dvh`/`100vh` in new code, no CSS grid outside desktop-exclusive layouts).
- Auth, API client, error classes, toast context, form primitives, and most `ui/` primitives survive untouched from v1.

See `CLAUDE.md` for the component-bucket rules (`ui/`, `form/`, root domain), cache-key shape, naming conventions, tests-mirror-src layout — this plan does not re-litigate them.

---

## 4. Review-skill gates (load-bearing)

Every ticket in §§9–11 ends with AC lines that invoke review skills. Mapping:

- **Frontend-only ticket** → `/vercel-react-best-practices` + `/accessibility`
- **Backend-only ticket** → `/dhh-rails-reviewer`
- **Full-stack ticket** → all three
- **Docs/content-only ticket** → `/accessibility` if it ships HTML, otherwise skip

AC lines to paste verbatim:

```
- [ ] `/vercel-react-best-practices` reviewer finds no blocker issues; non-blocker findings triaged
- [ ] `/accessibility` reviewer passes WCAG 2.1 AA; keyboard nav + focus management verified
- [ ] `/dhh-rails-reviewer` finds no blockers (backend only)
```

Project skills layered on top (after the three review skills):

- `/pre-commit` — lint + tests + auto-fix. Runs LAST.
- `/comment-audit` — WHY-only comments.
- `/review-ticket` — checks completed work against AC.

The review-skill order: implement → `/vercel-react-best-practices` → `/accessibility` (and/or `/dhh-rails-reviewer`) → fix findings → `/comment-audit` → `/pre-commit`. See `~/.claude/projects/.../feedback_rework_review_skills.md` for rationale.

---

## 5. Design tokens + primitive baseline

The v2 mockups' `:root` blocks are the source of truth. Abbreviated token sheet, for client `globals.css`:

**Palette.** Warm paper base (`--paper #fbf8f1`, `--paper-deep #f3eee2`, `--paper-edge #e8ddc6`); green axis (`--mint`, `--leaf`, `--emerald`, `--forest`, `--forest-2`, `--ink`, `--ink-soft`); accents (`--coral` urgent, `--sunshine` milestone/outdoor); weather axis (`--sky`, `--frost`, `--heat`). White is banned on surfaces — use paper.

**Radius tokens** (canonical, verified vs mockups 17–36):

```
--radius-xs:   4px       # segment-option inner
--radius-sm:   8px       # chips, small buttons
--radius-md:  14px       # default surfaces (NOT 12px — see note below)
--radius-lg:  20px       # large panels
--radius-full: 999px     # pills, circles
```

Note: CLAUDE.md references `rounded-md` as 12px — that's the Tailwind class mapping. The design-token value `--radius-md: 14px` is the mockup canon. `--radius-xl` is banned (too soft). Bottom-sheet top-lip 28px and 24px stay hardcoded for now (candidate `--radius-sheet` if it proliferates).

**Blur tokens:**

```
--blur-heavy:   24px     # desktop floating organiser
--blur-primary: 20px     # popovers, drawers
--blur-medium:  12px     # secondary overlays
--blur-light:    2px     # scrim
```

All `backdrop-filter: blur(...)` references a token, never a hardcoded px.

**Typography.** Plus Jakarta Sans (UI body) + Fraunces italic (display). No Inter / Roboto / system-ui — banned. Type scale: 10/11/12/13/14/17/22/32/48/64/88px.

**Motion vocabulary (mobile — three motions only):**

1. Right-slide drawer (Organiser, Notifications) — Vaul side variant.
2. Bottom sheet (CRUD dialogs, Filters) — Vaul bottom variant.
3. Radial wheel (per-plant long-press menu).

Don't add a fourth. Desktop gets popovers, centred modals, and the always-open Plant Detail wheel.

**Tab vocabulary — two primitives, distinct metaphors:**

- **Segment** (`components/form/SegmentedControl`) — paper-deep bg, paper-active-with-shadow-warm-sm. Used for view toggles (House Rooms/List, Log Care care-type), onboarding Low/Medium/Bright, Plant Detail top-level Care/Species/Journal.
- **FileTabs** (`components/ui/FileTabs`, NEW) — manila-folder look, flush-left, active tab connects to its panel via an `::after` paper-seam. Panel top corners flat, bottom rounded. USED ONLY for nested Journal tabs (Timeline / Photos / Milestones / Schedule) — both the standalone Journal region and the Journal tab inside Plant Detail.

Rule: if nested tabs sit inside a panel that should feel like a file folder, use FileTabs. Everything else is Segment.

See `~/.claude/projects/.../project_v2_design_decisions.md` for the full cross-cutting rules set — referenced rather than duplicated here.

---

## 6. Mockup → ticket index

| Mockup | Region | Built by ticket(s) |
|---|---|---|
| 17 | Today desktop | R2 |
| 18 | Today mobile | R2 |
| 19 | Onboarding | R9 |
| 20 | First-run tour | R10 |
| 21 | House | R3 |
| 22 | Plant Detail | R4 |
| 23 | Journal | R5 |
| 24 | Me | R7 |
| 25 | Encyclopedia | R6 |
| 26 | Sidebar states | R1 |
| 27 | Add Plant dialog | R11 |
| 28 | Empty states | R14 |
| 29 | Auth | R15 (visual alignment only — auth functional code already shipped) |
| 30 | Notifications drawer | R8 |
| 31 | Toast | R14 |
| 32 | Error states | R14 |
| 33 | Plant Doctor | R13 (tail) |
| 34 | Edit Plant dialog | R12 |
| 35 | Log Care dialog | R12 |
| 36 | Delete Plant dialog | R12 |
| `_journal-tabs-preview` | reference only | F5 |

---

## 7. Route map

| Path | Component | Lazy? | Notes |
|---|---|---|---|
| `/login` | `Login` | yes | unchanged |
| `/register` | `Register` | yes | unchanged |
| `/forgot-password` | `ForgotPassword` | yes | unchanged |
| `/reset-password/:token` | `ResetPassword` | yes | unchanged |
| `/welcome/:step?` | `Welcome` | yes | rewritten intent-adaptive wizard, R9 |
| `/` | `Today` | yes | rewritten, R2 |
| `/house` | `House` | yes | new build, R3 |
| `/house/:space_id` | `House` (filtered) | yes | same component, URL-filters to a space |
| `/plants/:id` | `PlantDetail` | yes | new build, R4 |
| `/plants/:id/journal` | `PlantDetail` (tab) | yes | same component, tab deep-link |
| `/journal` | `Journal` | yes | new, R5 |
| `/encyclopedia` | `Encyclopedia` | yes | new, R6 |
| `/encyclopedia/species/:id` | `Encyclopedia` (detail) | yes | same component, species detail view |
| `/me` | `Me` | yes | new, R7 |
| `/me/settings` | `Me` (tab) | yes | sub-section |
| `/doctor/:plant_id?` | `Doctor` | yes | new, R13 (phase-tail) |
| `*` | `NotFound` | yes | unchanged |

Notifications is a drawer (no standalone route). Add Plant is a dialog, not a route (FAB opens it app-wide).

---

## 8. File structure (v2 target)

```
client/src/
├── api/
│   └── client.js                  KEEP
├── components/
│   ├── ui/
│   │   ├── Action.jsx             KEEP
│   │   ├── Avatar.jsx             KEEP
│   │   ├── Badge.jsx              KEEP
│   │   ├── Banner.jsx             KEEP
│   │   ├── Card.jsx               KEEP
│   │   ├── CareRing.jsx           NEW   (F9)
│   │   ├── Dialog.jsx             MOD   (F10)
│   │   ├── EmptyState.jsx         KEEP
│   │   ├── FileTabs.jsx           NEW   (F5)
│   │   ├── ProgressBar.jsx        KEEP
│   │   ├── RadialWheel.jsx        NEW   (F3)
│   │   ├── Spinner.jsx            KEEP
│   │   ├── SummarySlab.jsx        NEW   (F6)
│   │   ├── Toast.jsx              KEEP  (R14 adds variants)
│   │   └── WeatherPill.jsx        NEW   (F4)
│   ├── form/
│   │   ├── CheckboxCardInput.jsx  KEEP
│   │   ├── PasswordStrengthBar.jsx KEEP
│   │   ├── SearchField.jsx        KEEP
│   │   ├── SegmentedControl.jsx   MOD   (F2)
│   │   └── TextInput.jsx          KEEP
│   ├── welcome/                   MOD   (R9 rewrites internals)
│   │   └── *.jsx                  restructured for intent-adaptive flow
│   ├── CareConfirmDialog.jsx      KEEP  (used by one-tap path)
│   ├── Dock.jsx                   MOD   (R1)
│   ├── FilterToolbar.jsx          NEW   (F7)
│   ├── HeroCard.jsx               MOD   (R2)
│   ├── LandscapeLock.jsx          KEEP
│   ├── LogCareDialog.jsx          NEW   (R12)
│   ├── EditPlantDialog.jsx        NEW   (R12)
│   ├── DeletePlantDialog.jsx      NEW   (R12)
│   ├── AddPlantDialog.jsx         NEW   (R11)
│   ├── Logo.jsx                   KEEP
│   ├── MobileTopBar.jsx           KEEP
│   ├── NotificationsDrawer.jsx    NEW   (R8)
│   ├── Organiser.jsx              NEW   (F8)
│   ├── PlantAvatar.jsx            MOD   (R1 strips personality emoji)
│   ├── ProgressRing.jsx           KEEP  (replaced at call sites by CareRing; file stays until R4 complete)
│   ├── ProtectedRoute.jsx         KEEP
│   ├── Sidebar.jsx                MOD   (R1)
│   ├── SpaceCard.jsx              NEW   (R3, renamed from RoomCard)
│   ├── RoomCard.jsx               DEL   (replaced by SpaceCard)
│   └── TaskRow.jsx                MOD   (R2 aligns to ritual-row pattern)
├── context/
│   ├── AuthContext.jsx            KEEP
│   └── ToastContext.jsx           KEEP
├── errors/                        KEEP  (all existing classes)
├── hooks/
│   ├── useAuth.js                 KEEP
│   ├── useDashboard.js            MOD   (reshape for collection-first Today)
│   ├── useDebouncedValue.js       KEEP
│   ├── useFirstRunReveal.js      KEEP
│   ├── useFormSubmit.js           KEEP
│   ├── useJournal.js              NEW   (R5)
│   ├── useMilestones.js           NEW   (B6)
│   ├── useNotifications.js        NEW   (R8)
│   ├── usePasswordStrength.js    KEEP
│   ├── usePlants.js               KEEP  (update `room_id` → `space_id`, B1)
│   ├── useProfile.js              KEEP
│   ├── useRooms.js                DEL   (replaced by useSpaces)
│   ├── useSpaces.js               NEW   (B1)
│   └── useSpecies.js              KEEP
├── layouts/
│   ├── AppLayout.jsx              KEEP
│   ├── AuthLayout.jsx             KEEP
│   └── SiteLayout.jsx             KEEP
├── pages/
│   ├── Doctor.jsx                 NEW   (R13)
│   ├── Encyclopedia.jsx           NEW   (R6)
│   ├── ForgotPassword.jsx         KEEP
│   ├── House.jsx                  MOD   (R3 — nothing committed yet)
│   ├── Journal.jsx                NEW   (R5)
│   ├── Login.jsx                  KEEP
│   ├── Me.jsx                     NEW   (R7)
│   ├── NotFound.jsx               KEEP
│   ├── PlantDetail.jsx            NEW   (R4)
│   ├── Register.jsx               KEEP
│   ├── ResetPassword.jsx          KEEP
│   ├── Today.jsx                  MOD   (R2 rewrite)
│   └── Welcome.jsx                MOD   (R9 rewrite)
├── personality/
│   ├── confirmQuotes.js           KEEP  (CareConfirm dialog picks from it)
│   ├── emoji.js                   KEEP  (avatar mood decoration)
│   ├── welcomeQuotes.js           KEEP  (step 7 onboarding)
│   ├── states.js                  KEEP
│   └── voices.js                  DEL   (retired in v2 — no voice library)
├── utils/                         KEEP
├── App.jsx                        MOD   (R1 route table refresh)
├── globals.css                    MOD   (F1)
└── main.jsx                       KEEP
```

`client/tests/` mirrors `src/` one-for-one per CLAUDE.md. New files get `.test.jsx` (Vitest) siblings; new pages get `.spec.js` (Playwright) under `tests/pages/` or `tests/e2e/`.

---

## 9. Backend prerequisites (land first)

Backend deltas that unblock frontend work. Must land before most region tickets; B3/B4/B5/B6 can run in parallel.

### TICKET-020 — B1 — Rename `Room` → `Space` (full-stack)

**Goal:** rename the `Room` model to `Space` across API + client. Pre-launch, single-shot, no compat shims.

**Mockup(s):** terminology only (reflected throughout mockups 17–36).

**Why:** v2 adopts "Space" as the canonical noun covering indoor + outdoor plant locations. `Room` is a subset, leaks into copy awkwardly ("Patio" isn't a room). Pre-launch rename avoids migration compat forever.

**Files:**
- MOD `api/db/migrate/` — add `rename_rooms_to_spaces` migration (table + indexes + FK column `plants.room_id` → `plants.space_id`)
- MOD `api/app/models/room.rb` → `space.rb`; update `has_many :spaces` on User
- MOD `api/app/controllers/api/v1/rooms_controller.rb` → `spaces_controller.rb`; nested plants controller path
- MOD `api/config/routes.rb` — `/rooms` → `/spaces`
- MOD `api/app/models/plant.rb` — `belongs_to :space` (rename FK)
- MOD `api/app/models/dashboard.rb` + serializers — JSON key `room` → `space`
- MOD all fixtures + tests
- MOD `client/src/hooks/useRooms.js` → `useSpaces.js`; query keys `['rooms', ...]` → `['spaces', ...]`
- MOD `client/src/components/RoomCard.jsx` → `SpaceCard.jsx` (minimal rework — visual overhaul lives in R3)
- MOD all `room`/`room_id` references across `client/src`

**Dependencies:** none.

**Steps:**
- [ ] Generate `rename_rooms_to_spaces` Rails migration — `rename_table`, `rename_column :plants, :room_id, :space_id`, index renames
- [ ] Rename `Room` model + all model references; rename controllers + file paths; update routes
- [ ] Update Plant, Dashboard, CareLog `as_json` renders to emit `space` / `space_id`
- [ ] Fixture rename + test rename + full API test pass
- [ ] Client hook rename `useRooms` → `useSpaces`, API path update, query-key update (`['spaces', ...]` per cache-key convention)
- [ ] Component file rename `RoomCard` → `SpaceCard`; preserve current styling (R3 redesigns the visual)
- [ ] All `room` identifier references in client code renamed in one pass
- [ ] Vitest + Playwright suite green

**Acceptance criteria:**
- [ ] API passes `./scripts/run_tests.sh api`
- [ ] Client passes `./scripts/run_tests.sh client`
- [ ] `grep -ri 'room' api/app client/src` returns only incidental/unrelated matches (e.g. "mushroom")
- [ ] `/dhh-rails-reviewer` finds no blockers
- [ ] `/vercel-react-best-practices` finds no blockers on the client rename diff
- [ ] `/accessibility` — n/a unless any user-facing copy changed
- [ ] `/pre-commit` passes
- [ ] `/comment-audit` passes

**Risks:** fixture/FK rename is the widest diff in the plan. Do it in one PR to avoid half-migrated state.

---

### TICKET-021 — B2 — Onboarding intent + step-reached columns on User

**Goal:** persist `User.onboarding_intent` (enum) + `User.onboarding_step_reached` (integer) to back R9 intent-adaptive wizard.

**Mockup(s):** 19.

**Why:** intent drives downstream app behaviour (landing, tour length, notifications, streak prominence, species filter, schedule intervals, jobs-rail order). Step-reached lets refresh resume at the last unfinished step.

**Files:**
- MOD `api/db/migrate/` — add `add_onboarding_fields_to_users`
- MOD `api/app/models/user.rb` — `enum onboarding_intent: { forgetful:, just_starting:, sick_plant:, browsing: }` (string-backed per Rob's Rails enum convention)
- MOD `api/app/controllers/api/v1/profiles_controller.rb` + registrations — permit on create/update
- MOD `api/app/models/user.rb` — `as_json` exposes both fields
- MOD fixtures

**Dependencies:** none.

**Steps:**
- [ ] Migration: `onboarding_intent` string nullable, `onboarding_step_reached` integer default 0, `onboarded_at` datetime (if not already present — merge with existing flag)
- [ ] User model enum + label constant (`USER_INTENT_LABELS`) per Rails enum convention
- [ ] `params.expect` updated on relevant controllers
- [ ] `as_json` exposes the fields
- [ ] Fixture updates + model/controller tests

**Acceptance criteria:**
- [ ] `/dhh-rails-reviewer` passes
- [ ] API tests green
- [ ] `/pre-commit` passes

**Risks:** none significant.

---

### TICKET-022 — B3 — Journal endpoint

**Goal:** `GET /api/v1/journal` returns cross-cutting stream (user entries + system events + care logs + photos) with filter params.

**Mockup(s):** 23.

**Why:** Journal region needs a unified chronological feed filterable by plant, space, event type, date range.

**Files:**
- NEW `api/app/models/journal_entry.rb` (or extend `care_log` + `plant_photo` polymorphically — implementer chooses based on DHH reviewer guidance; initial preference is a small `JournalEntry` model backed by events from existing tables via a read-only query object in `app/models/journal_stream.rb`)
- NEW `api/app/controllers/api/v1/journal_controller.rb`
- MOD `api/config/routes.rb` — `get "/journal", to: "journal#index"`
- TESTS fixtures + request specs

**Dependencies:** B1 (Space rename so filter by space is clean).

**Steps:**
- [ ] Decide entry model vs read-only aggregation (flag for `/dhh-rails-reviewer` — lean to aggregation until user-authored entries land in a separate ticket)
- [ ] Implement `GET /journal` with optional `plant_id`, `space_id`, `event_type`, `date_from`, `date_to`
- [ ] Pagination via `page` + `per` (default 30)
- [ ] Scope via `current_user.plants.includes(...)` — not `Plant.find(...)`
- [ ] `as_json` shape: `{ id, kind, occurred_at, plant: {...}, space: {...}, body, image_url }`
- [ ] Request specs covering filter combinations + scope leakage check

**Acceptance criteria:**
- [ ] `/dhh-rails-reviewer` passes
- [ ] Scope tests prove users cannot fetch other users' journal entries
- [ ] API tests green
- [ ] `/pre-commit` passes

---

### TICKET-023 — B4 — Notifications endpoint

**Goal:** `GET /api/v1/notifications` + `POST /api/v1/notifications/:id/read` drive the notifications drawer (mockup 30).

**Why:** drawer inbox pattern with unread count needs a persisted stream.

**Files:**
- NEW `api/app/models/notification.rb` (per-user table, polymorphic `subject` optional)
- NEW `api/app/controllers/api/v1/notifications_controller.rb` (standard CRUD: `index`, `update` for read flag)
- MOD routes

**Dependencies:** B1.

**Steps:**
- [ ] Migration: notifications table (user_id, kind, body, data jsonb, read_at, created_at)
- [ ] Model + enum for `kind`
- [ ] `index` scoped to `current_user.notifications`, newest first
- [ ] `update` marks `read_at`
- [ ] Request specs + scope test

**Acceptance criteria:**
- [ ] `/dhh-rails-reviewer` passes
- [ ] Unread count surfaces in `Notification.unread.count` (used by Sidebar badge)
- [ ] API tests green
- [ ] `/pre-commit` passes

---

### TICKET-024 — B5 — Calendar endpoint

**Goal:** `GET /api/v1/care_logs/calendar?month=YYYY-MM` returns per-day aggregates for Journal Schedule tab.

**Mockup(s):** 23 (Schedule tab).

**Why:** month calendar cells need day-level care counts + weather markers + overdue flags without fetching the whole stream.

**Files:**
- MOD `api/app/controllers/api/v1/care_logs_controller.rb` — add `calendar` member collection route
- MOD routes

**Dependencies:** B1.

**Steps:**
- [ ] Add `collection get :calendar` on nested `care_logs` routes? No — this is cross-plant. Add `get "/care_logs/calendar", to: "care_logs#calendar"` or prefer a dedicated `Api::V1::CalendarController` (simpler, passes DHH reviewer sniff test)
- [ ] `calendar` action returns `{ "2026-04-24": { care_count: 3, watered: 2, fed: 1, overdue: 0, weather: "rain" }, ... }` for the requested month
- [ ] Query scoped through `current_user.plants`
- [ ] Request specs

**Acceptance criteria:**
- [ ] `/dhh-rails-reviewer` passes
- [ ] Scope test — no leaks
- [ ] API tests green
- [ ] `/pre-commit` passes

---

### TICKET-025 — B6 — Milestones endpoint

**Goal:** `GET /api/v1/milestones` returns per-plant anniversaries + system milestones for Journal Milestones tab + Today widget.

**Mockup(s):** 23.

**Why:** 7/30/100/365-day plant milestones + collection anniversary decorate Journal + celebration moments. Computed from `Plant.created_at`; no persistent table needed Phase 1.

**Files:**
- NEW `api/app/models/milestone.rb` — plain Ruby value object computing upcoming/past milestones from `current_user.plants`
- NEW `api/app/controllers/api/v1/milestones_controller.rb`
- MOD routes

**Dependencies:** B1.

**Steps:**
- [ ] `Milestone.for_user(current_user)` returns ordered array of `{ plant:, kind: :day_7|:day_30|:day_100|:day_365|:collection_week|:collection_month, occurred_on: Date }`
- [ ] Controller returns JSON list; supports `?upcoming=true` + `?since=DATE`
- [ ] Request specs

**Acceptance criteria:**
- [ ] `/dhh-rails-reviewer` passes
- [ ] API tests green
- [ ] `/pre-commit` passes

---

### TICKET-026 — B7 — Expose `primary_photo_url` on Plant

**Goal:** `Plant#as_json` returns `primary_photo_url` so PlantAvatar can render the real photo instead of personality emoji placeholder.

**Why:** unblocks photo-first avatars across Today, House, Plant Detail, Journal — previously blocked on TICKET-012.

**Files:**
- MOD `api/app/models/plant.rb` — `primary_photo_url` method (newest plant_photo attached URL, or nil)
- MOD `api/app/models/plant.rb` — `as_json` includes the field
- TESTS

**Dependencies:** none.

**Steps:**
- [ ] Add `primary_photo_url` method — pulls latest `plant_photo` attachment URL
- [ ] `as_json` update
- [ ] Test coverage for both "no photo" and "with photo" paths
- [ ] No N+1 — eager-load the association where the field is consumed

**Acceptance criteria:**
- [ ] `/dhh-rails-reviewer` passes
- [ ] No N+1 in specs (assert via `bullet` or query-count test)
- [ ] API tests green
- [ ] `/pre-commit` passes

---

## 10. Foundation tickets (tokens + primitives)

Foundation tickets build the shared UI pieces region tickets consume. Most are parallel-safe once F1 lands.

### TICKET-027 — F1 — Design token refactor

**Goal:** align `client/src/globals.css` + Tailwind `@theme` block with the v2 canonical tokens (§5).

**Mockup(s):** every mockup's `:root` block.

**Why:** components can't match mockups if the tokens don't match. Doing this first means every downstream ticket references the same palette, radii, blur, weather axis.

**Files:**
- MOD `client/src/globals.css`
- KEEP `tailwind.config.js` if present (Tailwind v4 uses CSS `@theme`)

**Dependencies:** none.

**Steps:**
- [ ] Rewrite `@theme` to add paper palette (`--color-paper`, `--color-paper-deep`, `--color-paper-edge`)
- [ ] Add weather axis (`--color-sky`, `--color-frost`, `--color-heat`)
- [ ] Radius tokens `--radius-xs/sm/md/lg/full` per canonical values; remove `--radius-xl/2xl/3xl`
- [ ] Blur tokens `--blur-heavy/primary/medium/light`
- [ ] Remove `--paper-deeper` (dead) if present
- [ ] Audit existing components for hardcoded blurs/px radii — migrate to tokens where trivial
- [ ] Document retired tokens in a top-of-file comment (WHY — so future readers don't re-introduce `--radius-xl`)

**Acceptance criteria:**
- [ ] No visual regressions in currently-shipped screens (Login/Register/Today placeholder/House placeholder) — verify via Playwright smoke
- [ ] `/vercel-react-best-practices` passes
- [ ] `/accessibility` — contrast audit on the new paper palette against ink/ink-soft + forest text
- [ ] `/pre-commit` passes

---

### TICKET-028 — F2 — Canonical Segment primitive

**Goal:** align `components/form/SegmentedControl.jsx` to the mockup segment CSS — paper-deep bg, 3px padding/gap, paper-active with `shadow-warm-sm` on active option.

**Mockup(s):** 17, 19, 21, 22, 35.

**Why:** Segment is used by House view toggle, Plant Detail top tabs, Onboarding L/M/H, Log Care care-type picker. A drifted primitive multiplies visual inconsistency across regions.

**Files:**
- MOD `components/form/SegmentedControl.jsx`
- MOD `tests/components/form/SegmentedControl.test.jsx`

**Dependencies:** F1.

**Steps:**
- [ ] Outer wrapper: `background: var(--paper-deep); border-radius: var(--radius-md); padding: 3px; gap: 3px`
- [ ] Option active: `background: var(--paper); color: var(--forest); box-shadow: var(--shadow-warm-sm)`
- [ ] Option inactive: transparent + ink-soft + weight 500
- [ ] ARIA — role group + `aria-pressed` per option, keyboard left/right to move selection
- [ ] Tests: active-selection render, keyboard nav, ARIA attributes

**Acceptance criteria:**
- [ ] Matches mockup 17 + 19 + 21 + 22 + 35 rendering
- [ ] `/vercel-react-best-practices` passes
- [ ] `/accessibility` — arrow-key nav + focus ring visible
- [ ] Vitest tests added
- [ ] `/pre-commit` + `/comment-audit` pass

---

### TICKET-029 — F3 — RadialWheel primitive

**Goal:** new `components/ui/RadialWheel.jsx` — six spokes (Water · Feed · Photo · Note · Doctor · Move) fanning around a centre medallion, 2.2s urgent pulse on the primary spoke.

**Mockup(s):** 17 (Today urgent cards), 22 (Plant Detail always-open hero).

**Why:** core per-plant interaction primitive. Both Today's long-press menu AND Plant Detail's hero reuse it; shared implementation keeps motion + spacing consistent.

**Files:**
- NEW `components/ui/RadialWheel.jsx`
- NEW `tests/components/ui/RadialWheel.test.jsx`

**Dependencies:** F1.

**Steps:**
- [ ] Component API: `<RadialWheel size centreSlot spokes onSpoke open urgent />`
- [ ] Spokes positioned via CSS transforms (flex + absolute, RN-portable — no CSS grid)
- [ ] Open animation: staggered spoke reveal via `motion/react` (RN-portable)
- [ ] Urgent pulse: 2.2s ease-in-out on primary spoke (gradient green → coral glow ring)
- [ ] Scales: 300px mobile / 420px desktop (Plant Detail)
- [ ] On plant cards: long-press shows wheel, pointer-up closes; `onSpoke` fires the chosen action
- [ ] Keyboard: Tab enters centre, Arrow keys cycle spokes, Enter fires, Esc closes
- [ ] Reduced-motion respected — urgent pulse + open stagger skipped when `prefers-reduced-motion: reduce`
- [ ] Tests: rendering, keyboard nav, spoke callback, urgent state

**Acceptance criteria:**
- [ ] Matches mockup 17 + 22
- [ ] `/vercel-react-best-practices` passes (no unnecessary memo on spoke handlers unless crossing a memo boundary)
- [ ] `/accessibility` — keyboard nav + reduced-motion + ARIA menu pattern
- [ ] Vitest tests added
- [ ] `/pre-commit` + `/comment-audit` pass

**Risks:** long-press on touch + pointer events — verify with Playwright on mobile viewport.

---

### TICKET-030 — F4 — WeatherPill primitive

**Goal:** new `components/ui/WeatherPill.jsx` — base pill + modifier variants (`strip` for Today full-width, `calendar` for Journal cell badge, `group` for space-group headers) + colour variants (`sky` default, `frost`, `heat`).

**Mockup(s):** 17 (strip), 21 (group + outdoor cards), 23 (calendar).

**Why:** weather surface is prominent for outdoor plants; consolidating the four drawn variants into one primitive with modifiers avoids the `.weather-strip` / `.sum-row.weather` / `.weather-alert` / `.sg-weather` drift seen during the consistency pass.

**Files:**
- NEW `components/ui/WeatherPill.jsx`
- NEW `tests/components/ui/WeatherPill.test.jsx`

**Dependencies:** F1.

**Steps:**
- [ ] API: `<WeatherPill variant="strip|calendar|group" scheme="sky|frost|heat" icon label detail urgent />` — `variant` + `scheme` follow the two-axis convention (CLAUDE.md)
- [ ] Circular icon badge (forces the medallion motif)
- [ ] Animated pulse when `urgent` — reduced-motion respected
- [ ] Fold `.sg-weather` (mockup 21 space-group headers) in from day one — that's the explicit known-debt cleanup
- [ ] Tests: each variant + scheme renders; urgent pulse gated on reduced-motion

**Acceptance criteria:**
- [ ] Matches mockups 17 + 21 + 23
- [ ] `/vercel-react-best-practices` passes
- [ ] `/accessibility` — pill has `role="status"` or appropriate live-region semantics when urgent
- [ ] Vitest tests added
- [ ] `/pre-commit` passes

---

### TICKET-031 — F5 — FileTabs primitive

**Goal:** new `components/ui/FileTabs.jsx` — manila-folder look. Flush-left against its panel; active tab connects to the panel via an `::after` paper-seam; panel top corners both FLAT, bottom rounded; inactive tabs rounded top + sharp bottom; mobile `flex: 1` equal-share, 12px font.

**Mockup(s):** 22 (Plant Detail nested Journal tabs), 23 (Journal region tabs), `_journal-tabs-preview.html` (visual reference).

**Why:** the file-folder metaphor sells the "filing cabinet" vibe unique to Journal. Must not be reused for general segments — that's Segment's job. Separate primitive prevents cross-contamination.

**Files:**
- NEW `components/ui/FileTabs.jsx`
- NEW `tests/components/ui/FileTabs.test.jsx`

**Dependencies:** F1.

**Steps:**
- [ ] API: `<FileTabs tabs activeId onChange />` (tabs = `[{ id, label, count? }]`)
- [ ] Compound component `<FileTabs.Panel>` wraps the connected panel
- [ ] Paper-seam `::after` on the active tab — via styled element, no CSS keyframes
- [ ] Panel top corners flat (`border-radius: 0 0 var(--radius-lg) var(--radius-lg)`)
- [ ] Mobile: `flex: 1` per tab, drop count pill, 12px font
- [ ] ARIA `role="tablist"` + `aria-selected` + `aria-controls` wiring
- [ ] Keyboard: Left/Right arrow cycles tabs, Home/End to ends
- [ ] Tests: tab switching, keyboard nav, ARIA attributes

**Acceptance criteria:**
- [ ] Matches mockup 22 nested tabs + mockup 23 standalone tabs
- [ ] `/vercel-react-best-practices` passes
- [ ] `/accessibility` — WAI-ARIA tabs pattern
- [ ] Vitest tests added
- [ ] `/pre-commit` passes

---

### TICKET-032 — F6 — SummarySlab primitive

**Goal:** new `components/ui/SummarySlab.jsx` — a fixed-height card-row pattern so dashed dividers align across a grid.

**Mockup(s):** 21 (House cards use it for "next care" row), 17 (Today plant strip), 22 (Plant Detail panels).

**Why:** without a shared fixed-height primitive, space cards drift and dividers stop lining up. Shipping it as a dedicated component keeps the discipline enforceable in review.

**Files:**
- NEW `components/ui/SummarySlab.jsx`
- NEW `tests/components/ui/SummarySlab.test.jsx`

**Dependencies:** F1.

**Steps:**
- [ ] API: `<SummarySlab><SummarySlab.Row>...</SummarySlab.Row></SummarySlab>`
- [ ] Row `min-height: 62px` desktop / `34px` mobile (locked — see design decisions memo)
- [ ] Dashed divider between rows
- [ ] Compose-friendly — takes children for the row content
- [ ] Tests: height assertion, divider render

**Acceptance criteria:**
- [ ] Matches mockup 21 card layout
- [ ] `/vercel-react-best-practices` passes
- [ ] `/accessibility` — decorative divider (not in reading order)
- [ ] Vitest tests added
- [ ] `/pre-commit` passes

---

### TICKET-033 — F7 — FilterToolbar primitive

**Goal:** new `components/FilterToolbar.jsx` — single `⊞ Filters` button + count pill + dismissible active-filter badges, desktop popover (340px) / mobile bottom sheet.

**Mockup(s):** 23 (Journal), 25 (Encyclopedia).

**Why:** Journal + Encyclopedia both need the same filter-toolbar pattern. Second use case confirms the extraction per CLAUDE.md "extract as you go" rule.

**Files:**
- NEW `components/FilterToolbar.jsx` (domain component — knows app-level filter shapes)
- NEW `tests/components/FilterToolbar.test.jsx`

**Dependencies:** F1, Vaul already installed.

**Steps:**
- [ ] API: `<FilterToolbar sections active onChange />` where `sections = [{ id, label, kind: 'chips'|'date-range', options }]`
- [ ] Active filters render as dismissible badges beside the button (plant badges show avatar, others text + ×)
- [ ] Mint-tinted button when any filter active
- [ ] Desktop: 340px anchored popover, grouped sections, Reset/Apply footer
- [ ] Mobile: ~72dvh Vaul bottom sheet, scrim-dimmed, sticky Reset/Apply
- [ ] "Clear all" link when any filter applied
- [ ] Keyboard: Tab into button → Enter opens popover → Tab cycles chips/sections
- [ ] Focus trap in popover + sheet; focus returns to the button on close
- [ ] Tests: open/close, apply, dismiss, clear all, keyboard trap

**Acceptance criteria:**
- [ ] Matches mockup 23 toolbar + mockup 25 toolbar
- [ ] `/vercel-react-best-practices` passes
- [ ] `/accessibility` — focus trap + escape + return-focus verified
- [ ] Vitest tests added
- [ ] `/pre-commit` passes

---

### TICKET-034 — F8 — Organiser drawer primitive

**Goal:** new `components/Organiser.jsx` — right-slide drawer used by Today (desktop organiser column) + Notifications (from bell).

**Mockup(s):** 17 (Today organiser), 18 (Today mobile organiser), 30 (Notifications).

**Why:** right-slide drawer shows up at least twice; shared primitive enforces consistent motion + scrim + focus behaviour.

**Files:**
- NEW `components/Organiser.jsx`
- NEW `tests/components/Organiser.test.jsx`

**Dependencies:** F1.

**Steps:**
- [ ] API: `<Organiser open side="right" onClose title>{children}</Organiser>`
- [ ] Right-slide via `motion/react` (RN-portable)
- [ ] Scrim `backdrop-filter: blur(var(--blur-light))` + fade
- [ ] Focus trap while open; Esc closes; return-focus on close
- [ ] Desktop-static variant: when viewport ≥ `lg`, Organiser can render inline as a column instead of a drawer — gated by `mode="drawer"|"column"` prop
- [ ] Mobile: slide-right, ≥72dvh, drag-to-dismiss via Vaul side variant
- [ ] Tests: open/close, keyboard (Esc + focus trap), inline-vs-drawer mode

**Acceptance criteria:**
- [ ] Matches mockup 17 organiser column + mockup 30 drawer
- [ ] `/vercel-react-best-practices` passes
- [ ] `/accessibility` — focus trap, Esc, return focus, `role="dialog"` + `aria-modal`
- [ ] Vitest tests added
- [ ] `/pre-commit` passes

---

### TICKET-035 — F9 — CareRing primitive

**Goal:** new `components/ui/CareRing.jsx` — SVG circular progress ring for Plant Detail's four rings (Water · Feed · Light · Mood).

**Mockup(s):** 22.

**Why:** Plant Detail's rings carry "current state" truth (next-due countdown, mood). Separate primitive from `ProgressRing` so the semantics stay distinct — ProgressRing is legacy onboarding progress, CareRing is per-care-axis state.

**Files:**
- NEW `components/ui/CareRing.jsx`
- NEW `tests/components/ui/CareRing.test.jsx`
- DEL `components/ProgressRing.jsx` after R4 completes and no callers remain

**Dependencies:** F1.

**Steps:**
- [ ] API: `<CareRing label value max scheme="mint|coral|sunshine|sky" />`
- [ ] SVG-based (inline OK for web; add a note in JSDoc that RN port requires `react-native-svg`)
- [ ] Smooth value-change animation via `motion/react` (reduced-motion respected)
- [ ] Rings are LABEL + VALUE only — no subtitle (Schedule panel owns config + history)
- [ ] Tests: rendering at various values, scheme variants

**Acceptance criteria:**
- [ ] Matches mockup 22 ring cards
- [ ] `/vercel-react-best-practices` passes
- [ ] `/accessibility` — `role="progressbar"` + `aria-valuenow/min/max`
- [ ] Vitest tests added
- [ ] `/pre-commit` passes

---

### TICKET-036 — F10 — Dialog shell canonicalisation

**Goal:** align `components/ui/Dialog.jsx` to mockups 27/34/35/36 — centred on desktop (`rounded-lg`, paper bg, `shadow-lg`), Vaul bottom sheet on mobile with drag-to-dismiss.

**Mockup(s):** 27 (Add Plant), 34 (Edit Plant), 35 (Log Care), 36 (Delete Plant).

**Why:** four CRUD dialog mockups share a single shell. Getting the shell right once means R11/R12 just fill it with form content.

**Files:**
- MOD `components/ui/Dialog.jsx`
- MOD `tests/components/ui/Dialog.test.jsx`

**Dependencies:** F1, Vaul already installed.

**Steps:**
- [ ] Centred desktop: `rounded-lg`, `background: var(--paper)`, `shadow-lg`, `max-width: 520px`
- [ ] Mobile: Vaul bottom sheet, top-lip `border-radius: 28px 28px 0 0` (keep hardcoded 28px)
- [ ] Drag-to-dismiss on mobile via Vaul drag
- [ ] `<Dialog.Header>`, `<Dialog.Body>`, `<Dialog.Footer>` compound API
- [ ] Focus trap + Esc + return-focus
- [ ] ARIA `role="dialog"` + `aria-modal="true"` + `aria-labelledby` tied to header
- [ ] Reduced-motion respected — drag animation skipped
- [ ] Tests: open/close, focus trap, Esc, sheet drag

**Acceptance criteria:**
- [ ] Existing CareConfirmDialog still renders correctly (it wraps Dialog)
- [ ] Matches mockups 27/34/35/36 shell
- [ ] `/vercel-react-best-practices` passes
- [ ] `/accessibility` — dialog pattern fully compliant
- [ ] Vitest tests added
- [ ] `/pre-commit` passes

---

## 11. Region tickets

Region tickets assemble foundation primitives into user-facing surfaces. R1 is blocking for most (nav labels); others parallelise once their dependencies land.

### TICKET-037 — R1 — Sidebar + Dock nav restructure

**Goal:** update `Sidebar.jsx` + `Dock.jsx` to the 7-region nav (Today · House · Journal · Encyclopedia · Me · Notifications + Add FAB).

**Mockup(s):** 26 (sidebar states), 17, 18, 21.

**Why:** nav is the spine every region hangs off. Renames (Discover → Encyclopedia, Rooms → Spaces) + additions (Journal, Me) + notifications bell need to be in place before region tickets land, otherwise each region tries to invent its own nav.

**Files:**
- MOD `components/Sidebar.jsx`
- MOD `components/Dock.jsx`
- MOD `components/PlantAvatar.jsx` (remove 🎭 personality emoji)
- MOD `App.jsx` (route table reflects new regions)
- MOD tests

**Dependencies:** B1.

**Steps:**
- [ ] Sidebar items: Today, House (was Rooms), Journal (new), Encyclopedia (was Discover), Me (was placeholder) — six primary entries + bottom Add FAB + top Notifications bell
- [ ] Dock items (mobile): same five primary + centre Add FAB; Notifications bell in MobileTopBar, not Dock
- [ ] PlantAvatar: strip 🎭 emoji badge + any personality label (personality inferred, never labelled per v2 decisions memo)
- [ ] Notifications bell: badge with unread count from `useNotifications`
- [ ] Sidebar supports collapsed + expanded states per mockup 26
- [ ] App.jsx routes updated to §7
- [ ] Playwright smoke for each nav destination

**Acceptance criteria:**
- [ ] Matches mockup 26 states + mockup 17/18 nav chrome
- [ ] `/vercel-react-best-practices` passes
- [ ] `/accessibility` — nav `role="navigation"` + `aria-label`; active route via `aria-current="page"`
- [ ] Vitest + Playwright smoke green
- [ ] `/pre-commit` + `/comment-audit` pass

---

### TICKET-038 — R2 — Today v2

**Goal:** rewrite `pages/Today.jsx` per mockup 17 + 18: collection-first hero strip, jobs rail, weekly calendar, ritual rows with 56px slab + swipe-to-complete on mobile, radial wheel on urgent rows, desktop organiser column.

**Mockup(s):** 17, 18.

**Why:** v2's tamagotchi framing lives or dies on Today. Current Today is v1 urgent-hero-first — needs ground-up rebuild.

**Files:**
- MOD `pages/Today.jsx`
- MOD `components/HeroCard.jsx` (demote; still exists as conditional surface for rescue missions, not primary)
- MOD `components/TaskRow.jsx` (align to 56px ritual-row, swipe gesture on mobile)
- MOD `hooks/useDashboard.js` (reshape for collection-first payload)
- NEW `tests/pages/today.spec.js` (Playwright)
- NEW `tests/components/TaskRow.test.jsx` + MOD `tests/components/HeroCard.test.jsx`

**Dependencies:** B1, B2, F1, F3 (RadialWheel), F4 (WeatherPill), F6 (SummarySlab), F8 (Organiser).

**Steps:**
- [ ] Layout: collection strip (horizontal on mobile, grid on desktop) → jobs rail → weekly calendar → rituals list → latest-journal widget
- [ ] Collection strip: every plant visible with mood-decorated avatars; coral ring on urgent avatars (not a hero)
- [ ] Jobs rail: named-verb cards per §3.1b of design spec; personality-visual not voiced-copy
- [ ] Weekly calendar: 7-day strip with weather icons (uses WeatherPill calendar variant) + care dots
- [ ] Ritual rows: 56px SummarySlab height, swipe-to-complete on mobile via `motion/react` drag
- [ ] Urgent ritual row long-press opens RadialWheel
- [ ] Desktop: Organiser column on the right (static `mode="column"`), carries Notifications preview + jobs overflow
- [ ] Mobile: Organiser drawer triggered from top-bar icon
- [ ] Reduced-motion respected on swipe + wheel open
- [ ] Playwright E2E: load Today, complete a ritual, open wheel, open organiser

**Acceptance criteria:**
- [ ] Matches mockup 17 desktop + mockup 18 mobile
- [ ] `/vercel-react-best-practices` passes (no unnecessary memo; `useDeferredValue` used where appropriate for the collection grid)
- [ ] `/accessibility` — keyboard path for every swipe-to-complete row (space/enter equivalent), wheel keyboard nav, reduced-motion respected
- [ ] Vitest + Playwright E2E green
- [ ] `/pre-commit` + `/comment-audit` pass

**Risks:** swipe + long-press gesture interplay on touch. Test on mobile viewport + with a pointer/touch emulator.

---

### TICKET-039 — R3 — House v2

**Goal:** new build of `pages/House.jsx` per mockup 21: Spaces grid (default) + List view toggle (Segment primitive), space cards with locked slab height, prominent WeatherPill on outdoor spaces.

**Mockup(s):** 21.

**Why:** House was paused TICKET-010 pre-pivot. This picks it up fresh with v2 grammar.

**Files:**
- MOD `pages/House.jsx` (nothing committed; effectively rewrite)
- NEW `components/SpaceCard.jsx` (replaces RoomCard from B1)
- NEW `tests/pages/house.spec.js`
- NEW `tests/components/SpaceCard.test.jsx`

**Dependencies:** B1, F1, F2 (Segment), F4 (WeatherPill), F6 (SummarySlab).

**Steps:**
- [ ] Top-level view toggle: Rooms / List (Segment primitive, Habitat disabled + tooltip "Phase 3")
- [ ] Rooms view: responsive grid of SpaceCard
- [ ] SpaceCard: header (space name + plants_count + overflow) → `.rc-summary` locked min-height 62px desktop / 34px mobile → indoor shows next-care + env hint, outdoor shows next-care + WeatherPill
- [ ] List view: flat plant list grouped by space with collapsible headers; group headers use WeatherPill `group` variant for outdoor
- [ ] URL-filter support — `/house/:space_id` opens with that space expanded
- [ ] Empty state per mockup 28 (no spaces yet)
- [ ] Playwright E2E: load House, toggle view, open a space, filter to a space

**Acceptance criteria:**
- [ ] Matches mockup 21 desktop + mobile
- [ ] Space card slab heights uniform across grid (visual regression check)
- [ ] `/vercel-react-best-practices` passes
- [ ] `/accessibility` — segment primitive keyboard nav, list/grid semantics
- [ ] Vitest + Playwright E2E green
- [ ] `/pre-commit` + `/comment-audit` pass

---

### TICKET-040 — R4 — Plant Detail v2

**Goal:** new build of `pages/PlantDetail.jsx` per mockup 22: RadialWheel hero with medallion centre, four CareRings (Water · Feed · Light · Mood), three panels (Schedule · Recent care · Environment), nested FileTabs for plant-scoped Journal.

**Mockup(s):** 22.

**Why:** the portrait-and-timeline centerpiece. The role split (rings own state, panels own config+history) is specifically locked in the v2 design decisions memo — don't duplicate facts across them.

**Files:**
- NEW `pages/PlantDetail.jsx`
- NEW `tests/pages/plant-detail.spec.js`
- NEW supporting tests

**Dependencies:** B1, B3 (Journal endpoint for nested tab), B6 (Milestones), B7 (photo URL), F1, F3 (RadialWheel), F5 (FileTabs), F9 (CareRing).

**Steps:**
- [ ] Hero layout: RadialWheel (always-open desktop, 420px; mobile 300px + 150px medallion) with nine-o'clock spoke primary
- [ ] Text column: name (Fraunces italic) → species (italic) → 2 meta pills (space + age); one optional Fraunces quote as decorative copy (no rotation infra — enforced via `/vercel-react-best-practices` pass on PR)
- [ ] NO personality/mood pills on hero — both banned per design decisions
- [ ] Four CareRings in a row (label + value only — no subtitles)
- [ ] Three panels: Schedule (frequency + reasoning, e.g. "Every 7 days — medium light bump"; no countdown/overdue text), Recent care (care log stream), Environment (editable L/T/H with Segment primitives)
- [ ] Top-level Segment tabs: Care / Species / Journal
- [ ] Journal tab uses FileTabs (Timeline / Photos / Milestones / Schedule) with plant-scoped filter passed to `useJournal({ plant_id })`
- [ ] Desktop scroll model: main scrolls as one page, hero scrolls away, Segment tab-bar sticks to top (iOS large-title pattern)
- [ ] Overflow menu: Edit · Log care · Doctor · Delete (opens corresponding dialogs from R11/R12/R13)
- [ ] Playwright E2E: deep-link to a plant, spin wheel, switch top-level tab, switch nested Journal tab

**Acceptance criteria:**
- [ ] Matches mockup 22 desktop + mobile
- [ ] Role split honoured (rings = state, panels = config+history — no duplicated "Next water in X days" text)
- [ ] `/vercel-react-best-practices` passes
- [ ] `/accessibility` — RadialWheel keyboard nav (from F3), tablist semantics on both Segment + FileTabs
- [ ] Vitest + Playwright E2E green
- [ ] `/pre-commit` + `/comment-audit` pass

**Risks:** scroll-model interplay between sticky tab bar and RadialWheel animation. Desktop + mobile both need smooth scroll.

---

### TICKET-041 — R5 — Journal region

**Goal:** new build of `pages/Journal.jsx` per mockup 23: FileTabs (Timeline · Photos · Milestones · Schedule), FilterToolbar, collapsible stats rail (desktop), month calendar on Schedule tab.

**Mockup(s):** 23.

**Why:** Journal is the cross-cutting spine of v2 (tamagotchi narrative arc). Without it, plants have no history surface beyond care logs.

**Files:**
- NEW `pages/Journal.jsx`
- NEW `hooks/useJournal.js`
- NEW `tests/pages/journal.spec.js`
- NEW `tests/hooks/useJournal.test.jsx`

**Dependencies:** B1, B3 (Journal endpoint), B5 (Calendar endpoint), B6 (Milestones), F1, F5 (FileTabs), F7 (FilterToolbar).

**Steps:**
- [ ] Layout: FilterToolbar top + FileTabs header + panel
- [ ] Timeline tab: chronological feed with sticky day headers (Fraunces italic, paper-deep bg)
- [ ] Entry decorations: Care (mint/emerald badge), Photo (coral-tinted + thumbnail), System/Weather (sunshine), Milestone (sunshine-deep + horizontal gradient wash + Fraunces italic)
- [ ] Photos tab: masonry grid, clickable to source entry
- [ ] Milestones tab: sparse list of plant anniversaries
- [ ] Schedule tab: month calendar grid. Today cell = mint fill + emerald ring; weather days = sky-blue; overdue dots pulse coral. Week/Month toggle (Week deferred to Phase 2 — disabled w/ tooltip)
- [ ] Mobile Schedule: calendar fixed natural height, day-detail card below is the scrollable region
- [ ] Right stats rail (desktop only): collapsible via "Hide stats" / "Show stats · 48" toggle; preference persists via localStorage; collapsed grid becomes `1fr 0`
- [ ] Scroll lives inside the panel (`.t-main { overflow: hidden }`); file-tab header stays pinned
- [ ] Keyboard nav through FileTabs + FilterToolbar + calendar cells
- [ ] Playwright E2E: filter apply, tab switch, calendar day tap, stats rail collapse

**Acceptance criteria:**
- [ ] Matches mockup 23 desktop + mobile
- [ ] `/vercel-react-best-practices` passes (no prop-drilling through Journal's nested tabs — context if needed)
- [ ] `/accessibility` — tab pattern, calendar grid keyboard nav, live-region for filter-applied summary
- [ ] Vitest + Playwright E2E green
- [ ] `/pre-commit` + `/comment-audit` pass

---

### TICKET-042 — R6 — Encyclopedia region

**Goal:** new build of `pages/Encyclopedia.jsx` per mockup 25: species search + card grid, species detail article view, care-tips articles. Replaces the old Discover route.

**Mockup(s):** 25.

**Why:** old Discover was a shell. Encyclopedia is a first-class reference reader with SEO value (per-competitor audit in v2 spec).

**Files:**
- NEW `pages/Encyclopedia.jsx`
- MOD `hooks/useSpecies.js` (extend for search + detail fetch shapes)
- NEW `tests/pages/encyclopedia.spec.js`

**Dependencies:** B1, F1, F7 (FilterToolbar).

**Steps:**
- [ ] Default route `/encyclopedia` shows search + card grid of species
- [ ] Search uses existing `useSpecies` + `useDebouncedValue`
- [ ] FilterToolbar: filter by difficulty, habitat (indoor/outdoor/both), personality (internal filter; label in copy is "Temperament" not "Personality" — inferred not labelled)
- [ ] `/encyclopedia/species/:id` renders species detail: hero + care guide + common issues + tips stack
- [ ] Care-tips articles: card-stream mobile / reader desktop
- [ ] `useDeferredValue` on the search input per `/vercel-react-best-practices`
- [ ] Empty state per mockup 28 (no results)
- [ ] Playwright E2E: search, open species, open a tip article

**Acceptance criteria:**
- [ ] Matches mockup 25 desktop + mobile
- [ ] `/vercel-react-best-practices` passes
- [ ] `/accessibility` — search input label, result list semantics, reader heading hierarchy
- [ ] Vitest + Playwright E2E green
- [ ] `/pre-commit` + `/comment-audit` pass

---

### TICKET-043 — R7 — Me region

**Goal:** new build of `pages/Me.jsx` per mockup 24: profile, settings, widgets, preferences, tour replay trigger, password change, logout.

**Mockup(s):** 24.

**Why:** TICKET-014 placeholder. Phase 2 adds billing + devices — the settings-navigation pattern needs to exist Phase 1 to absorb those without churn.

**Files:**
- NEW `pages/Me.jsx`
- MOD `hooks/useProfile.js` (already exists; minor extensions for preferences)

**Dependencies:** B1, F1, F2 (Segment for sub-navigation).

**Steps:**
- [ ] Sub-nav: Profile · Settings · Widgets · Preferences (Segment primitive, desktop horizontal / mobile tabs)
- [ ] Profile: name, email, avatar, timezone
- [ ] Settings: password change form, notification prefs placeholder (full stack lands Phase 2), logout
- [ ] Widgets: Today widget priority order (drag-reorder list — `motion/react` gesture)
- [ ] Preferences: onboarding intent change (triggers re-render of Today widget order), units, reduced-motion override
- [ ] Tour replay button — resets `User.onboarding_tour_completed_at` → driver.js fires on next Today load
- [ ] Playwright E2E: change password, reorder a widget, reset tour

**Acceptance criteria:**
- [ ] Matches mockup 24 desktop + mobile
- [ ] `/vercel-react-best-practices` passes
- [ ] `/accessibility` — drag-reorder has keyboard equivalent (up/down arrows), password form has explicit labels
- [ ] Vitest + Playwright E2E green
- [ ] `/pre-commit` + `/comment-audit` pass

---

### TICKET-044 — R8 — Notifications drawer

**Goal:** new `components/NotificationsDrawer.jsx` per mockup 30: right-slide drawer triggered from the Sidebar/MobileTopBar bell, read/unread states, tap-to-navigate.

**Mockup(s):** 30.

**Why:** notifications inbox. Drawer reuse of F8 Organiser primitive, not a standalone page.

**Files:**
- NEW `components/NotificationsDrawer.jsx`
- NEW `hooks/useNotifications.js`
- NEW `tests/components/NotificationsDrawer.test.jsx`

**Dependencies:** B4 (Notifications endpoint), F1, F8 (Organiser).

**Steps:**
- [ ] Drawer uses `<Organiser side="right" mode="drawer">`
- [ ] `useNotifications` — query key `['notifications']`, polling/staleTime TBD; mutation `markRead`
- [ ] Each row: icon + title + body + timestamp; unread gets mint dot + bold weight
- [ ] Tap navigates to the subject (plant/space/journal entry) + marks read
- [ ] Empty state per mockup 28
- [ ] Keyboard: Tab into bell → Enter opens drawer → Tab cycles rows → Enter activates
- [ ] Playwright E2E: open drawer, tap notification, verify navigated + marked read

**Acceptance criteria:**
- [ ] Matches mockup 30
- [ ] `/vercel-react-best-practices` passes
- [ ] `/accessibility` — drawer dialog pattern, live-region for unread count
- [ ] Vitest + Playwright E2E green
- [ ] `/pre-commit` + `/comment-audit` pass

---

### TICKET-045 — R9 — Onboarding intent-adaptive

**Goal:** rewrite `pages/Welcome.jsx` + `components/welcome/*` per mockup 19: 8-step intent-adaptive wizard (Forgetful / Just starting / Sick plant / Browsing branches).

**Mockup(s):** 19.

**Why:** v2 spec §3.1h/k locks the intent-driven flow. Current Welcome is a 5-step linear flow — needs structural rework.

**Files:**
- MOD `pages/Welcome.jsx`
- MOD `components/welcome/*.jsx` (rebuild per-step components around intent config)
- NEW `tests/pages/welcome.spec.js` (replace existing)

**Dependencies:** B2 (intent + step-reached columns), F1, F2 (Segment for L/M/H), F6.

**Steps:**
- [ ] Step 0 Welcome (shared)
- [ ] Step 1 Intent — four intent cards; preview line (Fraunces italic) updates per selection per §3.1k copy table; commits `User.onboarding_intent`
- [ ] Step 2 Spaces — preset grid + custom add; commits per add (not on continue)
- [ ] Step 3 Plants — multi-add loop; easy-care filter for Just starting; single-add for Sick plant; gallery-first for Browsing. Species search input doesn't persist across reload; added chips do (Plant records)
- [ ] Step 4 Environment — per-space L/T/H via Segment; batch-default for Forgetful, walk-through for Just starting, skip for Sick plant
- [ ] Step 5 Stakes — promoted for Forgetful, soft for Just starting, SKIPPED for Sick plant + Browsing
- [ ] Step 6 Journal seed — system events auto-created per plant; explanatory for Just starting
- [ ] Step 7 Welcome home — per-intent CTA routing: Today / Today-take-your-time / Diagnose flow / Today-plus-Encyclopedia
- [ ] Commit-per-advance — server state persists; refresh lands at `User.onboarding_step_reached`
- [ ] Micro-tip pattern (Fraunces italic aside per step) per §3.1k
- [ ] Payoff moments per step (plant chips stagger, schedule auto-calc, streak ring fill)
- [ ] Playwright E2E per intent branch (4 scenarios)

**Acceptance criteria:**
- [ ] Matches mockup 19 across all four intents
- [ ] Intent preview line updates without re-render jank
- [ ] `/vercel-react-best-practices` passes
- [ ] `/accessibility` — step region labelled + progress announced; focus moves to step heading on advance
- [ ] Vitest + Playwright E2E green (all four intent scenarios)
- [ ] `/pre-commit` + `/comment-audit` pass

---

### TICKET-046 — R10 — First-run tour (driver.js)

**Goal:** driver.js spotlight tour launched on first Today landing, intent-adaptive length (5 / 7 / 2 / 3 stops), plus first-care-log celebration overlay.

**Mockup(s):** 20.

**Why:** seals the first-run arc (onboarding → tour → first care-log → celebration) per v2 spec §3.1k.

**Files:**
- NEW `hooks/useFirstRunTour.js` (driver.js driver instance + step config per intent)
- MOD `pages/Today.jsx` (tour trigger integration — adds a `data-tour-*` attribute set)
- NEW `components/FirstCareLogCelebration.jsx` (one-shot overlay)

**Dependencies:** B2, R2 (Today v2), R9 (Welcome writes onboarding fields).

**Steps:**
- [ ] `useFirstRunTour` reads `User.onboarding_intent` + `User.onboarding_tour_completed_at`
- [ ] Stops per intent table (§3.1k): Forgetful 5, Just starting 7, Sick plant 2 (redirects to Doctor), Browsing 3
- [ ] Each spotlight: dimmed bg + bright hole at target + tooltip card (title + one-line + Next/Skip/Done); pulse anim 2.4s
- [ ] Esc + tap-outside skips; completion sets `User.onboarding_tour_completed_at`
- [ ] Manual replay from Me region (R7)
- [ ] First care-log completion: one-shot overlay with plant name + streak tick + vitality sparkle + Fraunces copy + "Back to Today" CTA; sets `User.first_care_logged_at`
- [ ] Reduced-motion respected — pulse + sparkle skipped

**Acceptance criteria:**
- [ ] Matches mockup 20
- [ ] `/vercel-react-best-practices` passes
- [ ] `/accessibility` — tour is dismissable with Esc + keyboard Next/Skip; spotlighted element receives focus
- [ ] Vitest + Playwright E2E green (tour + celebration)
- [ ] `/pre-commit` + `/comment-audit` pass

**Note:** mockup 20 renders a simplified Today backdrop; in production the tour overlays live Today state. Flag as implementation note.

---

### TICKET-047 — R11 — Add Plant dialog

**Goal:** new `components/AddPlantDialog.jsx` per mockup 27: dialog shell with species search → env questions → save. FAB opens this dialog app-wide (replaces the old `/add-plant` route).

**Mockup(s):** 27.

**Why:** Add Plant is a universal action, not a route destination. FAB consolidation landed in v2 design decisions.

**Files:**
- NEW `components/AddPlantDialog.jsx`
- MOD `App.jsx` — remove `/add-plant` route; add dialog context + open hook
- NEW `context/AddPlantContext.jsx` (open/close + keyboard shortcut `N`)
- NEW `tests/components/AddPlantDialog.test.jsx`

**Dependencies:** B1, F10 (Dialog), F2 (Segment for env).

**Steps:**
- [ ] Dialog shell (F10)
- [ ] Step 1: species search (reuses `useSpecies` + `SearchField`)
- [ ] Step 2: environment (space picker + L/T/H via Segment)
- [ ] Step 3: confirmation (nickname + notes + acquired_at)
- [ ] Submit via existing `usePlants` mutation
- [ ] Keyboard shortcut `N` opens dialog (app-wide)
- [ ] Playwright E2E: FAB → dialog → species → env → save → verify plant appears in House

**Acceptance criteria:**
- [ ] Matches mockup 27
- [ ] `/vercel-react-best-practices` passes
- [ ] `/accessibility` — dialog pattern (from F10), each form step has explicit labels, error messaging inline
- [ ] Vitest + Playwright E2E green
- [ ] `/pre-commit` + `/comment-audit` pass

---

### TICKET-048 — R12 — Edit / Log Care / Delete Plant dialogs

**Goal:** three dialogs on the shared Dialog shell — EditPlantDialog (34), LogCareDialog full-form variant (35), DeletePlantDialog (36).

**Mockup(s):** 34, 35, 36.

**Why:** per-plant CRUD surfaces. LogCareDialog is distinct from existing `CareConfirmDialog` — one-tap flow stays, full-form variant is when user wants to log care on a different date / attach a note.

**Files:**
- NEW `components/EditPlantDialog.jsx`
- NEW `components/LogCareDialog.jsx`
- NEW `components/DeletePlantDialog.jsx`
- NEW matching tests

**Dependencies:** B1, B7, F10 (Dialog), F2 (Segment for env + care-type).

**Steps:**
- [ ] EditPlantDialog: same form shape as AddPlantDialog minus species; mutation via existing hook
- [ ] LogCareDialog: care-type Segment (Water / Feed) + performed_at date picker + notes textarea; confirmation renders plant-personality quote (from `personality/confirmQuotes.js` — existing)
- [ ] DeletePlantDialog: destructive confirmation, type-to-confirm for plants older than 30 days
- [ ] All reached from Plant Detail overflow menu + List view row context menu
- [ ] Playwright E2E for each

**Acceptance criteria:**
- [ ] Matches mockups 34 + 35 + 36
- [ ] `/vercel-react-best-practices` passes
- [ ] `/accessibility` — destructive action has clear warning + focus on cancel by default
- [ ] Vitest + Playwright E2E green
- [ ] `/pre-commit` + `/comment-audit` pass

---

### TICKET-049 — R13 — Plant Doctor flow

**Goal:** new `pages/Doctor.jsx` per mockup 33: symptom picker → tailored summary. Reached from Sick Plant onboarding branch, Today jobs-rail "Something's wrong", Plant Detail overflow, Encyclopedia nav.

**Mockup(s):** 33.

**Why:** Phase-1 Doctor is templated summary (symptom + plant state + static tips). Phase 2 adds LLM photo diagnosis. Doctor is scope-tail in this plan — ship if scope allows, otherwise sequence as a follow-up ticket post-R14.

**Files:**
- NEW `pages/Doctor.jsx`
- NEW backend: `api/app/controllers/api/v1/doctor_controller.rb` + `POST /doctor` action (templated summary generator)
- NEW backend model: `CareTip` if not already present
- NEW tests

**Dependencies:** B1, F1, F10 (dialog shell inside flow on mobile).

**Steps:**
- [ ] Flow step 1: plant picker (skippable if entering from Plant Detail)
- [ ] Flow step 2: symptom multi-select (yellow leaves / drooping / brown tips / soggy soil / pests / slow growth / root issues / other)
- [ ] Backend: generate summary from symptoms + plant's current care state + species-specific tips (5–8 bullets max). No LLM.
- [ ] Summary render: Journal-entry-style paper card, bullets
- [ ] Action buttons: Apply to schedule (adjusts watering/feeding intervals on confirm) · Log this (creates system journal event) · Dismiss
- [ ] Mobile = bottom sheet sequence; desktop = modal

**Acceptance criteria:**
- [ ] Matches mockup 33
- [ ] `/vercel-react-best-practices` passes (frontend)
- [ ] `/accessibility` — symptom multi-select checkbox semantics, summary region labelled
- [ ] `/dhh-rails-reviewer` passes (backend — controller stays thin, logic on model)
- [ ] Vitest + Playwright E2E green
- [ ] `/pre-commit` + `/comment-audit` pass

**Risks:** scope-heavy for a tail ticket — prefer to defer Doctor entry points from Today jobs rail if schedule tightens (keep Plant Detail overflow + onboarding branch only).

---

### TICKET-050 — R14 — Empty/error/toast library expansion

**Goal:** deploy EmptyState variants per mockup 28, wire Toast variants per mockup 31, hook error boundaries per mockup 32.

**Mockup(s):** 28, 31, 32.

**Why:** polish pass. All regions need empty + error + toast coverage before calling v2 done.

**Files:**
- MOD `components/ui/EmptyState.jsx` (add variants)
- MOD `components/ui/Toast.jsx` (six variants per mockup 31)
- NEW `components/RouteErrorBoundary.jsx` (rendered via React Router `errorElement`)
- MOD `App.jsx` — attach `errorElement` to each route

**Dependencies:** F1, all region tickets (R2–R8) so empty states can be hooked site-wide.

**Steps:**
- [ ] EmptyState: 8 variants from mockup 28 (no spaces, no plants, no journal entries, no notifications, no tips, no results, offline, error)
- [ ] Toast: 6 variants from mockup 31 (success, info, warning, error, care-celebration, milestone)
- [ ] RouteErrorBoundary: renders mockup 32 error state; recovers via route nav
- [ ] Wire EmptyState in each region at the appropriate "no data" moment
- [ ] Wire new Toast variants across care completions + milestones
- [ ] Playwright E2E: force empty state, force error boundary

**Acceptance criteria:**
- [ ] Matches mockups 28, 31, 32
- [ ] `/vercel-react-best-practices` passes
- [ ] `/accessibility` — error boundary is announced via live region; empty states have meaningful headings
- [ ] Vitest + Playwright E2E green
- [ ] `/pre-commit` + `/comment-audit` pass

---

### TICKET-051 — R15 — Auth visual alignment to mockup 29

**Goal:** bring shipped auth pages (Login, Register, ForgotPassword, ResetPassword) up to post-21 visual quality per mockup 29. Functional code stays untouched.

**Mockup(s):** 29.

**Why:** auth functionally works but visually predates the v2 design pivot. Density, tokens, copy tone, Fraunces usage all lag the rest of the app. Thin ticket — design parity only.

**Files:**
- MOD `pages/Login.jsx`
- MOD `pages/Register.jsx`
- MOD `pages/ForgotPassword.jsx`
- MOD `pages/ResetPassword.jsx`
- MOD `layouts/AuthLayout.jsx` (if shared chrome needs token/density alignment)

**Dependencies:** F1 (tokens must land first so auth uses canonical paper/mint/emerald palette + radius tokens).

**Steps:**
- [ ] Diff each auth page against mockup 29 desktop + mobile — flag specific density / padding / token / copy gaps
- [ ] Apply token swaps (radius, blur, colour) to match
- [ ] Tighten vertical rhythm to post-21 density
- [ ] Copy tone pass — Fraunces italic on contextual hints, warmer subtitles, no generic form-app phrasing
- [ ] Verify existing vitest + Playwright auth tests still pass (no behaviour change)
- [ ] Re-check reduced-motion + focus-visible states on all auth CTAs

**Acceptance criteria:**
- [ ] Matches mockup 29 desktop + mobile — tokens, density, tone
- [ ] No functional regressions — existing auth tests stay green
- [ ] `/vercel-react-best-practices` passes
- [ ] `/accessibility` — form labels, error states, password-reveal toggle all announced correctly
- [ ] Vitest auth suite green
- [ ] Playwright auth happy-path green
- [ ] `/pre-commit` + `/comment-audit` pass

**Risks / open questions:**
- None expected — thin scope, no behaviour change. If rework exposes a shared component that also needs touching, treat as bonus cleanup within the ticket rather than spinning a followup.

---

## 12. Parallel-trackable work

Which tickets can safely run in parallel:

- **B3 / B4 / B5 / B6 / B7** — parallel after B1 merges. No shared files.
- **F2 through F10** — mostly parallel after F1. F5 + F9 + F10 share test-harness patterns but different files.
- **R1** — blocks most region work (nav shape).
- **R5 / R6 / R7 / R8** — parallel after R1 + their dependent foundation tickets.
- **R11 / R12** — parallel after F10.
- **R13 / R14** — tail; parallel with each other.

One-shot sequential chains:
- **B1 → B3/B5 → R5** (Journal depends on Journal endpoint + Space rename).
- **B2 → R9 → R10** (onboarding persistence → intent-adaptive wizard → tour).
- **F1 → F3/F9 → R4** (tokens → wheel + rings → Plant Detail).

---

## 13. Dependency graph

```
B1 (Space rename) ───────────────────────────────────────────┐
                                                             │
B2 (Intent columns) ──────────────── R9 ─── R10              │
                                                             │
B3 (Journal) ────────────┐                                   │
B4 (Notifications) ──┐   │                                   │
B5 (Calendar) ────┐  │   │                                   │
B6 (Milestones) ─┐│  │   │                                   │
B7 (Photo URL) ─┐││  │   │                                   │
                │││  │   │                                   │
F1 (Tokens) ────┼┼┼──┼───┼─── F2..F10 ──┐                    │
                │││  │   │               │                   │
                ▼▼▼  ▼   ▼               ▼                   ▼
               R4  R5  R8  R11 R12 R13  R2  R3  R6  R7  R14  R1
                │   │                        │
                └───┴──────► all region tickets depend on R1 nav
```

R1 is the universal frontend dependency; backend B-tickets feed per-region tickets independently.

---

## 14. Testing strategy

Per CLAUDE.md testing conventions:

- **Vitest** for components + hooks. Files mirror `src/` in `client/tests/`; `.test.jsx` for React, `.test.js` for plain JS.
- **Playwright** for page-level E2E. Files in `client/tests/pages/` or `client/tests/e2e/` with `.spec.js`.
- **Do not cross extensions.** Vitest ignores `.spec.*`; Playwright ignores `.test.*`.
- **Backend:** Minitest with fixtures. No service mocks in integration tests (Rob's convention).
- **Accessibility assertions** live inside component tests — role, labelledby, keyboard nav — caught by `/accessibility` review if missed.
- **Scope leak tests** on every backend controller (prove `current_user` isolation).

Per-ticket: Vitest for new components + Playwright smoke for new pages. Multi-intent flows (R9) get one Playwright spec per branch.

---

## 15. Post-launch followups

Explicit scope-out — work logged but not in this plan:

- Phase 2: Weather-driven watering (skip-rain), frost alerts, calendar weather overlay (Journal Schedule → full forecast).
- Phase 2: AI plant recognition (camera-first Add Plant).
- Phase 2: Push notifications (Web Push).
- Phase 2.5: TBD AI helper layer (Claude API). Plant-voiced framing retired 2026-05-03 (see memory `project_voice_removed_from_plan.md`). Redesign before scoping.
- Phase 3: Dollhouse / Habitat 3D view (name TBD). Three.js.
- Phase 3: Community gateway via Journal opt-in sharing.
- Phase 3: Soil moisture probes + device pairing in Me.
- RN port: React Native mobile build. All phases complete first.

Redis prod maxmemory + allkeys-lru policy (per Rob's memory) — cap before public launch.

---

## 16. Known debt / deferred fixes

- **`.sg-weather`** third weather-pill variant in mockup 21 space-group headers — folded into WeatherPill `group` variant as part of F4.
- **Dead `--radius-xl` token declarations** in mockups 19, 22 — harmless, sweep on next mockup pass.
- **Dead `--paper-deeper` token** in mockup 17 — harmless, sweep when convenient.
- **Tour mockup 20 uses a simplified Today backdrop.** Implementation overlays live Today state; R10 notes this.
- **Memory file `project_v2_consistency_pass_todo.md`** can be deleted once this plan lands (its TODO list is absorbed).
- **`ProgressRing.jsx`** survives until R4 ships + no callers remain; delete in R4's final commit.
- **`personality/voices.js`** retired; delete as part of R2 (it's referenced nowhere after Today rebuild).

---

## 17. Cache-key reference

Per CLAUDE.md cache-key shape. TanStack query keys (flat arrays, one segment per entry) used by this plan:

```
['spaces']
['spaces', id]
['plants']
['plants', id]
['plants', plantId, 'care_logs']
['plants', plantId, 'photos']
['species']
['species', 'search', query]
['species', id]
['dashboard']
['journal']
['journal', 'filter', filterKey]
['milestones']
['notifications']
['care_logs', 'calendar', yyyyMm]
['user', 'profile']
```

All flat arrays, resource-first, one segment per entry. Don't nest arrays; don't flatten into colon strings.
