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
./scripts/npm_install.sh            # Install client deps into container volume (run after package.json changes)
./scripts/npm_install.sh ci         # Pass-through: runs `npm ci` in the client container
```

## Branch Protection

- No direct pushes to `main`
- All work in feature branches → PR → merge
- CI runs lint + security + test on API changes, lint + build + test on client changes
- Merge commits preferred (not squash)

## Long-Term Vision

**Phase 1 (MVP, current)** — auth, rooms, plants, care, dashboard, photos, species, profile

**Phase 2** — push notifications (Web Push), AI plant recognition, adaptive scheduling

**Phase 2.5** — **in-app AI helper bot voiced by the user's own plants.** Claude API backend, contextual triggers (stuck on a form, explicit "?" tap) rather than always-on chat. System prompt is built from the active plant's personality type, so a dramatic Monstera sounds different to a stoic snake plant — rotate per session so each plant gets to be the voice-of-the-day. Tool use for safe actions ("I'll add the Kitchen room for you" → confirm button → POST `/rooms`, routed through the existing `current_user`-scoped queries). Shares the personality-prompting infrastructure with Phase 3's LLM messages and dollhouse speech bubbles. Gated behind payment (LLM cost) — build after the free tier is stable.

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

- `/pre-commit` — run lint + tests, fix failures, prepare for commit (use `/review-ticket` for full AC review)
- `/ticket` — generate a Jira-style HTML ticket with requirements, acceptance criteria, and design references
- `/review-ticket` — review completed work against ticket acceptance criteria and design spec
- `/github-make-pr` — push current branch and create a GitHub pull request
- `/github-babysit-pr` — watch current PR for CI failures and auto-fix them
- `/github-post-merge` — after a PR has been merged, sync main, delete the local feature branch, and update Claude's memory with merge details
- `/comment-audit` — audit comments in the working tree against the WHY-only rule and strip the ones that don't pull their weight

## Code Style

### Comments

**Code should speak for itself. Comments exist to reinforce, not to narrate.** A comment has to carry weight the code can't — a hidden constraint, a subtle invariant, a bug-specific workaround, a surprising behaviour, a cross-system coupling. If a better identifier name or a small refactor would make the comment redundant, that's the fix — not a comment.

**Delete on sight:**
- Anything that restates WHAT the code does (`// fetch rooms` above `apiGet('/api/v1/rooms')`).
- Anything that names what the identifier already names (`# the user's first name` above `first_name = …`).
- Task narration — `// for TICKET-013`, `// added when fixing Step 3`, `// used by Dashboard`. That context belongs in the commit, PR, or ticket.
- Diff narration — `// now using X instead of Y`. Git has this.
- Banners, dividers, changelogs-in-code, unowned/undated TODOs.
- Multi-paragraph essays on a single function — if the context is that large, put it in the PR description or the ticket, not inline.

**Borderline cases bias toward deletion.** If a WHY comment could be expressed as a variable name (`shouldFetch` → `onlyWhenFocused`), rename and delete. If it belongs in a test name, move it there.

**Keep** only when the WHY is non-obvious, the code alone cannot convey it, and removing it would cost the next reader something real.

Run `/comment-audit` before committing anything substantial, especially changes I or an assistant produced.

### Cache keys

Every cache in the app — server-side `Rails.cache`, client-side TanStack Query — uses the same shape:

```
<resource> : <selector-parts…> [: v<N>]
```

- **Resource** — snake_case domain noun, matching the Rails model name where one exists (`species`, `plant`, `room`, `user`, `dashboard`). Singular, not the table name. External data sources flatten the source into the resource itself: `perenual_search`, not `perenual:search` (colons are separators; the source is part of the resource's identity).
- **Selector parts** — whatever narrows down to the specific entry. Ids, scope names, normalised query strings. `downcase.strip` user input before interpolating so `"Rose "` and `"rose"` share a key.
- **Version suffix** — `:v1` appended when the serialised payload shape might change. Bump on breaking change. Don't version speculatively; add it when the first breaking change lands.

**Server (`Rails.cache` string keys)** — colon-delimited:

```ruby
"perenual_search:rose"
"species:popular:v1"
"user:42:dashboard:v1"
```

**Client (TanStack Query array keys)** — same structure as an array, one segment per array entry:

```js
['perenual_search', query]
['species', 'popular']
['species', id]
['species', 'search', query]          // flat — NOT ['species', ['search', query]]
['user', id, 'dashboard']
['plants', plantId, 'photos']
```

**Rules:**

- **Resource first, always.** The first segment is the domain noun. Don't prefix with `cache:`, `app:`, or similar.
- **Never mix strings and arrays.** Client uses array tuples; server uses colon-delimited strings. Don't flatten arrays into strings (`keys.join(':')`) or build arrays out of colon strings (`key.split(':')`).
- **Flat arrays on the client.** Never nest an array inside a Query key. `['species', 'search', query]`, never `['species', ['search', query]]`.
- **One key per consumer.** If two controllers return popular species, both read `species:popular:v1`. The writer doesn't own the namespace — the resource does.
- **Bump, don't chain.** Schema change → `:v2`, old entries expire naturally. Never `species:popular:v1:new`.

### Naming

- **Be explicit with variable names.** No single-letter or ultra-short abbreviations (`s`, `x`, `fn`, `cfg`, `tmp`) — even in tiny helper functions. Use `schemeRecipe` not `s`, `handleSubmit` not `fn`, `roomCount` not `rc`. A reader should understand what a variable holds without scrolling up to the declaration.
- **One-letter names are OK only for loop iterators** in short loops (`for (const [i, plant] of plants.entries())`). Even then, prefer the domain name (`plant`) over `item` or `el`.
- **Destructuring names follow the same rule.** `const { scheme, variant } = props` beats `const { s, v } = props`.
- **Tiny scope is not an exemption.** Short helper functions and lookup-result locals are exactly where lazy naming hides. `const variantStyles = VARIANTS[variant]` beats `const v = VARIANTS[variant]`. `const intentLabel = LABELS[intent]` beats `const l = LABELS[intent]`. Reader-time beats author-time.
- **`...kwargs` is the project convention for rest parameters**, not `...rest`. See `feedback_kwargs_naming.md` if you need the reasoning.

### CSS — no inline `style` for decorative CSS

- **Reusable / decorative CSS goes in a Tailwind v4 `@utility` block** in `client/src/globals.css`, not in JSX `style={{...}}`. Match the existing pattern (`hero-glow-urgent`, `hero-image-fade`, `toast-progress`, `marketing-halo-sunshine`).
- **`style={{...}}` is the escape hatch for genuinely dynamic values** that come from props/state and can't be enumerated — Framer Motion targets, computed transforms, per-instance CSS custom properties (`style={{ '--toast-duration': duration }}`). Don't use it for static gradients, shadows, decorative backgrounds, or named visual treatments.
- **Naming convention:** kebab-case, scoped prefix where it helps (`marketing-halo-*`, `hero-image-*`, `toast-progress`).
- If multiple consumers need the same gradient/shadow but different sizes or positions, the `@utility` owns the visual treatment only — size and position stay as Tailwind utilities at the call site.

### Components

Three buckets, chosen by the component's purpose — not its reusability:

- **`client/src/components/ui/`** — general-purpose primitives that work anywhere in the app and would survive being copy-pasted into a different React app unchanged. Action, Badge, Card, Logo. Future: Button, Icon, Dialog, Tooltip.
- **`client/src/components/form/`** — form-specific primitives that encode form UX conventions (label association, hint/error slots, required/disabled, autoComplete). TextInput today. Future: Textarea, Select, Checkbox, Radio, FormField wrapper.
- **`client/src/components/`** at the root — domain components that know about PlantCare's data shapes (rooms, plants, care state, personality). Dock, Sidebar, ProtectedRoute today. Future: HeroCard, TaskRow, RoomCard, PlantAvatar, SinceRibbon.

**Rule of thumb:**
- Building a form? Reach into `form/`.
- Building general chrome or a one-off clickable? Reach into `ui/`.
- Building something that touches a Plant, Room, or CareLog? It's a domain component — lives at the root.

Components that are genuinely general-purpose (Action is used as both "form submit button" and "nav FAB") stay in `ui/`, not `form/`. When in doubt, ask: "would this make sense in an app that doesn't have forms?" Yes → `ui/`. No → `form/`.

**Two-axis prop convention for primitives:** `variant` for the style/preset choice, `scheme` for the colour/palette choice. Keep the names consistent across components so a `variant="solid"` or `scheme="coral"` behaves predictably wherever you see it.

**Slot patterns — props vs compound vs children.** When a component exposes places where consumers fill in content, pick the pattern by slot shape. Rails analog given for translation:

| Slot shape | Pattern | Rails analog |
|---|---|---|
| Single, always paired with parent | Prop on parent (`<Heading subtitle="...">`) | `renders_one :subtitle` |
| Multiple instances, variable count | Compound children (`<AuthMarketing><PeekPill>...</PeekPill></AuthMarketing>`) | `renders_many :pills` |
| Default body / form / freeform | `children` prop | `content` |
| Standalone with no inherent pairing | Independent primitive, not slotted | n/a |

Why this split:
- **Prop for single-paired slots** prevents drift. Caller can't insert between heading + subtitle or reorder them. The parent's template enforces position.
- **Compound for multi-occurrence** keeps JSX inline natural. No `peekPills={[{id, emoji, content}, ...]}` array-of-objects + key boilerplate.
- **Don't mix both** for the same slot. Two ways to do the same thing = bad API.

**Sub-components live under their parent's folder.** When you extract a piece of a feature into its own file, group it in a subfolder named after the parent's role — not next to the parent at the top level of its module folder.

```
components/auth/
├── AuthBody.jsx
├── AuthMarketing.jsx
├── body/                  ← bits owned by AuthBody
│   ├── AuthCrossAuth.jsx
│   ├── AuthSubtitle.jsx
│   ├── DisplayEm.jsx
│   └── SocialRow.jsx
└── marketing/             ← bits owned by AuthMarketing
    ├── PeekPill.jsx
    └── SunshineEm.jsx
```

Rules:
- **One sub-piece used only inside one parent** — keep inline as a function in the parent's file. No new file.
- **Multiple sub-pieces, or a sub-piece that earns its own file** — extract to `parent/Sub.jsx`.
- **Genuinely shared across multiple parents** — bubble up to the module root or `ui/` (e.g. `Heading` + `Preheading` cross both AuthBody and AuthMarketing → live in `components/ui/`).
- File names keep their convention prefix (`AuthCrossAuth.jsx`, not `CrossAuth.jsx`) so React DevTools and grep stay precise. The folder is the namespace; the file/component name is the human-readable label.

Mirrors `components/onboarding/` (the wizard step components live in their own subfolder). The pattern formalises the same idea inside any feature module.

### Client directory layout

The `client/` tree is organised by *role*, not by feature. Every file has one obvious home based on what kind of thing it is. Keep it this way — don't invent new top-level folders without a real reason.

```
client/
├── src/
│   ├── api/              # fetch wrapper + API client (api/client.js)
│   ├── components/
│   │   ├── ui/           # general-purpose primitives (Action, Badge, Card, Logo, Toast)
│   │   ├── form/         # form-specific primitives (TextInput, future: Select, Checkbox)
│   │   └── *.jsx         # domain components at the root (Sidebar, Dock, ProtectedRoute)
│   ├── context/          # React contexts + their providers (AuthContext, ToastContext)
│   ├── errors/           # named Error subclasses per failure mode (ValidationError, future: NotFoundError, RateLimitError)
│   ├── hooks/            # custom hooks (useAuth, useFormSubmit)
│   ├── layouts/          # route layout shells (AppLayout, AuthLayout, SiteLayout)
│   ├── pages/            # route-level page components (Login, Register, NotFound)
│   ├── App.jsx           # route table + provider tree
│   ├── main.jsx          # ReactDOM entry point
│   └── globals.css       # Tailwind @theme tokens + @utility classes
└── tests/                # mirrors src/ exactly — see "Tests" below
```

**Rules:**
- **Contexts live in `context/`, not `components/`.** Even though a Provider is technically a component, its job is state plumbing — group it with the other contexts.
- **Errors live in `errors/`, one class per file.** Named after the condition (`ValidationError`, `NotFoundError`), not the HTTP code. Thin `Error` subclasses — no React dependencies so they can be thrown from `api/client.js`. Catch with `instanceof`, not property sniffing. Don't export a barrel — import directly from the specific file (bundle-size rule).
- **Custom hooks live in `hooks/`.** Includes both generic hooks (`useFormSubmit`) and context-reader hooks (`useAuth`). A hook that only wraps `useContext` still lives here, not next to the context file.
- **Pages vs layouts:** a *page* is the thing rendered for a single route. A *layout* is the persistent frame that wraps several pages via `<Outlet />`.
- **Don't colocate.** No `Foo.jsx` + `Foo.test.jsx` + `Foo.module.css` clusters. Tests mirror `src/` inside `tests/`; styles live in Tailwind classes or `globals.css`.

### Tests

Tests live in `client/tests/`, mirroring `client/src/` one-for-one. A source file at `src/hooks/useFormSubmit.js` has its test at `tests/hooks/useFormSubmit.test.jsx`. No colocated tests.

- **`.test.jsx` / `.test.js`** — Vitest unit/integration tests (React Testing Library, `renderHook`, `vi.mock`).
- **`.spec.js`** — Playwright end-to-end tests, under `tests/pages/` or `tests/e2e/`.

The two extensions are how Vitest and Playwright tell their files apart — don't cross them. If you're writing a Vitest test it's `.test.jsx`, if it's Playwright it's `.spec.js`.

### Extract as you go

Build components and hooks *when a second copy appears*, not up-front and not after the third. The goal is to catch duplication the moment it's obvious, while the second use case is still fresh in your head — that's when you know the right shape for the abstraction.

**Worked examples from this project:**
- **`Action`** extracted when Login's submit button, the "sign up" link, and the floating nav button all wanted the same rounded/sized/tappable surface with different variants.
- **`Card` / `CardBody` / `CardFooter`** extracted when Login and Register both wanted the same padded container — compound components so the layout slots stay explicit.
- **`TextInput`** extracted when stacking `<label>` + `<input>` + hint markup in every form became line noise, AND when autofill on duplicate `id`s started causing React warnings.
- **`Toast` + `ToastContext`** extracted when Login and Register both needed to surface inline API errors — became the Rails-flash-style single source of truth for transient messages.
- **`useFormSubmit`** extracted when Login and Register had identical `preventDefault → setSubmitting → try/await/catch/finally → toast → onSuccess` handlers. Two copies was enough; the third form would have baked the pattern in wrong.

**Rules:**
- **First use: inline it.** Premature extraction guesses at an API you don't have evidence for.
- **Second use: extract it.** Two copies is the signal. Don't wait for three — by then you're mid-ticket on the third and tempted to copy-paste "just this once".
- **Name for the job, not the shape.** `useFormSubmit`, not `useAsyncHandler`. `Action`, not `ClickableThing`.
- **Extraction is part of the current ticket.** Don't split it out to "a followup" — it goes in the same branch as the code that made it necessary.

## What Not to Touch

- `api/config/master.key` and `credentials.yml.enc` are gitignored
- `.env` is gitignored; `.env.example` is the template
