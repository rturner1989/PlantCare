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

**Phase 2.5** — **TBD AI helper layer (redesign needed).** Original "voiced by user's plants" framing was retired 2026-05-03 (see memory `project_voice_removed_from_plan.md`). Personality stays visual-only across all phases. Whatever ships in 2.5 should not assume per-plant voice. Use case to revisit (contextual help / tool use for safe actions / generic onboarding assistant) — design from scratch when scoping.

**Phase 3** — weather-adjusted care, home automation (soil probes), LLM-generated personality messages, **dollhouse view** (interactive 3D isometric house with Three.js, plant speech bubbles per room)

**Auto-layout / best-space-for-plant suggestions** (post-R9 follow-up) — per-space environment (`Space.light_level` / `temperature_level` / `humidity_level`, owned per-space since R9) gives a clean species-vs-space comparison: score each space against the species' suggested levels, default-pick the best fit when adding a plant, surface "consider moving to {space}" hints in Plant Doctor, eventually offer a one-shot "auto-layout" pass that proposes optimal plant→space assignments. Hold until R9 baseline ships.

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

### Accountability for visual work

**When a ticket references a mockup, read the mockup's CSS before writing JSX — not just the rendered iframe.** Eyeballing the iframe loses class names, custom properties, exact spacing, and shared styles between mockups. Open the HTML, grep for the relevant section (`.house-head`, `.t-head`, `.eyebrow`, etc.), read the rule blocks, and use them as the source of truth.

**Before extracting or implementing a UI primitive, check if a sibling page already has the same shape.** Today + House + Plant Detail all use the same page-header shape (eyebrow + display heading + meta + actions). Today + House list views both use a search row + filter chip pattern. Don't roll a one-off in House if Today already has the same chrome — extract once, share.

**The work has to pass a mid-level dev's reading test.** A reader who hasn't seen this codebase before should:
- Recognise primitive names from their job (`PageHeader`, `ViewToggle`) without needing to open the file.
- Find the slot/prop API on the primitive obvious within 30 seconds.
- See the consumer site (`House.jsx`) reading like a layout, not like CSS.

If the answer to any of those is "no", the abstraction is wrong — fix it before moving to the next step.

**Pre-flight checklist before writing JSX for any page-level rewrite:**
1. Open the mockup HTML for this page.
2. Grep for the head/chrome/section CSS classes.
3. Cross-reference any other mockup that shares the same section (Today + House headers, etc.).
4. Identify shared shape → primitive name → slot API.
5. Only then write the JSX.

This rule is hard-won (TICKET-039a step 1 first-pass) — don't relearn it.

### Reuse existing primitives before building new ones

**Before creating a new component, grep the codebase for an existing primitive that does the same job.** A pill control with a sliding active state + radio semantics is `SegmentedControl` — don't build `ViewToggle` to do the same thing. A bordered card with header + body + footer slots is `Card` — don't roll a divider-padded `<div>`. A modal shell is `Dialog` — don't build a one-off overlay.

**If an existing primitive is 80% there, EXTEND it.** Add a new prop (`density="auto"`, `option.icon`, `option.phase`) instead of forking. Two primitives doing the same job means two test files, two style drifts, and a future reader asking "why are there two?".

**The bar for a NEW primitive:** the existing one can't be extended without breaking its API or polluting its purpose. `SegmentedControl` taking per-option `icon` + `phase` chip extends cleanly. `SegmentedControl` taking a `style="auth-marketing"` prop pollutes — that's a sign to fork.

**Pre-flight before creating any new `components/ui/*.jsx` file:**
1. Grep the existing `components/ui/` and `components/form/` folders for similar names + similar shapes.
2. If found: extend the existing one. Add a prop, add a variant, add a slot.
3. If genuinely no overlap: build new.

This rule is hard-won (TICKET-039a step 1 — built `ViewToggle` when `SegmentedControl` already existed). Don't relearn it.

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

### Mutation cache pattern (TanStack Query)

`invalidateQueries` is the **default**. `setQueriesData` is a **targeted optimization** for specific scenarios — never reach for it without one of the criteria below.

**Use `invalidateQueries` when:**

- The mutation has cascading server effects on *other* queries (counter caches, computed fields, related records). The response only carries the directly-mutated record, so the cache for the cascade has to be refetched anyway. Most of our mutations land here.
- An active subscriber will be on screen when the mutation finishes (typical for "edit in place" flows). The refetch fires through the subscriber and the screen updates live.
- The mutation response is `204 No Content` (delete). There's nothing to patch with — invalidate is mandatory.

**Upgrade to `setQueriesData` (often combined with selective invalidate) when ALL of these hold:**

- The mutation response IS the canonical record for the cache shape (server returns the full updated row, not a partial).
- The flow is **submit → unmount → remount** so there's no active subscriber to drive a refetch in time. The next reader gets stale cache before refetch completes — this is the race that justifies the upgrade.
- Any cascading effects on *other* queries can be covered by selective `invalidateQueries` calls layered on top of the patch.

**Worked example — TICKET-045 Step 4:** `useUpdateSpace` patches every cached `['spaces', *]` list with the mutation response (canonical Space row), then `invalidateQueries(['plants'])` because the server reschedules every plant in the space and those records aren't in the response. On Back nav from Step 5, Step 4 remounts and `useState`'s initializer reads the just-patched cache instead of stale values waiting on a refetch.

**Don't apply this pattern speculatively.** Audit shows most of our hooks (plant CRUD, care logs, photos, archive/unarchive, profile) correctly use plain invalidate because they either have wide cascades or stay subscribed during the mutation. Upgrade only when you can name the specific race or perf cost.

### Deferred rendering — `useDeferredValue` / `useTransition`

React 18 added priority-based scheduling. We use it to keep urgent updates (typing, clicking) responsive while heavier renders run as low-priority work.

**`useDeferredValue(value)`** — returns a deferred copy of a value. Consumers of the deferred copy render at low priority; the urgent input keeps using the live value. React can interrupt the deferred render if more urgent work arrives.

```jsx
const [query, setQuery] = useState('')
const deferredQuery = useDeferredValue(query)

return (
  <>
    <input value={query} onChange={(event) => setQuery(event.target.value)} />
    <ExpensiveList items={filter(items, deferredQuery)} />
  </>
)
```

**`useTransition()`** — wraps a state setter so updates inside it are low-priority. `isPending` returns `true` while the transition is in flight, so we can show a spinner.

```jsx
const [isPending, startTransition] = useTransition()
startTransition(() => setSelectedTab('heavy-tab'))
```

**vs. our existing `useDebouncedValue` (`client/src/hooks/useDebouncedValue.js`):**

| Hook | Mechanism | Use when |
|---|---|---|
| `useDebouncedValue` | Time-based — waits N ms of stillness before updating. | Value change triggers a side effect: API request, navigation, expensive non-React work. We don't want to fire it per keystroke. |
| `useDeferredValue` | Priority-based — scheduled around React's render work. No timer. | Pure render-only consumer of a value. We want instant response without an arbitrary debounce delay. |
| `useTransition` | Same priority system, applied at the setState site. | We're about to call setState that triggers heavy renders, and want to flag the *next* render low-priority. |

**Rule of thumb:**

- Side effect on every value change (network, IO, navigation)? → `useDebouncedValue`.
- Pure render-only consumer of a value? → `useDeferredValue`.
- Wrapping a state setter that triggers heavy renders? → `useTransition`.

**Don't reach for these speculatively.** Both `useDeferredValue` and `useTransition` are lipstick on a slow render — first ask "why is this render slow?" If it's already cheap, deferring just adds complexity. Use a profiler before reaching for the priority knob.

**Concrete spots in our app:**

- **SpeciesPicker** — keeps `useDebouncedValue` (network call). Don't switch.
- **Future filter UIs** (long plant list by status/species/room, searchable encyclopedia, etc.) — client-side filter render → `useDeferredValue`.
- **Tab swap to a heavy panel** (e.g. Plant Detail tab to a large care log) — wrap the tab-switch state set in `startTransition` so the click stays snappy.

### Pagination — `useInfiniteQuery` + cursor-based backend

We don't paginate any endpoint today. When list volume justifies it, this is the pattern.

**Client — TanStack `useInfiniteQuery`:**

```js
import { useInfiniteQuery } from '@tanstack/react-query'

export function usePlantsInfinite() {
  return useInfiniteQuery({
    queryKey: ['plants', 'infinite'],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: '50' })
      if (pageParam) params.set('after', String(pageParam))
      return apiGet(`/api/v1/plants?${params}`)
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
  })
}
```

Consumer flattens pages and renders a "Load more" button or an intersection-observer auto-load:

```jsx
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = usePlantsInfinite()
const plants = data?.pages.flatMap((page) => page.plants) ?? []
```

**Backend — cursor-based, not page-number:**

```ruby
def index
  scope = current_user.plants.order(:id)
  scope = scope.where('id > ?', params[:after]) if params[:after].present?
  limit = params.fetch(:limit, 50).to_i.clamp(1, 100)
  plants = scope.limit(limit + 1)
  has_more = plants.size > limit
  plants = plants.first(limit)

  render json: {
    plants:,
    next_cursor: has_more ? plants.last.id : nil
  }
end
```

**Cursor over page-number** because:
- Stable under inserts (page numbers shift records as new ones are added)
- Better performance on large tables (no `OFFSET N` cost)
- Maps cleanly onto TanStack's `pageParam` shape

**Payload shape change:** existing endpoints return bare arrays; paginated endpoints return `{ records: [...], next_cursor }`. Migrate the client and server in the same change — don't ship a transitional shape.

**When to paginate:**

- Real user feedback surfaces slow page load — measured, not assumed.
- Storage growth past 100+ records for a typical user.
- Mobile data + render cost matters (Notifications drawer, plant care logs, photo lists).

**When NOT to paginate:**

- Spaces (typically <20 per user).
- Plants for new and intermediate users (10-50 typical).
- One-off lookups that complete in a single round-trip.

**Don't paginate speculatively.** Adds API surface, mutation cache complexity (invalidating an infinite query is more involved than a flat one), and UI affordance work (load-more buttons, scroll restoration). Wait for the gap to be real.

**Pairs with filtering UIs** — see the Deferred rendering section above. Filter narrows what's visible from already-loaded pages; pagination loads more pages. They sit in the same pipeline but solve different problems.

### Server owns business calculations

The client never duplicates backend business logic. If the server computes a value, it ships the answer via `as_json` and the client renders it. Mirroring constants or formulas client-side leads to silent drift the moment the server tweaks a number — CI never catches it because each side passes its own tests against its own values.

**The rule:**

- **Read, don't compute.** If the field exists on the model's `as_json`, the client reads it as-is. Examples we already have: `plant.days_until_water`, `plant.days_until_feed`, `plant.calculated_watering_days`, `plant.water_status`, `plant.feed_status`. All authoritative on the backend.
- **Need a value before persistence (a preview)?** Add a server endpoint (`POST /plants/preview { species_id, space_id }` → `{ watering_days, feeding_days }`). The endpoint reuses the model's calculation method — single source of truth, network round-trip is cheap.
- **Round-trip cost actually matters?** Expose the underlying constants via a small read-only endpoint (`GET /care_modifiers`), client fetches once and caches forever. Only do this if you can prove the round-trip cost. Default to round-trip.
- **Pure presentation transforms stay client-side.** Formatting `daysUntil` → "In 3 days" / "Due today" / "1 day overdue" lives in `client/src/utils/careStatus.js`. Date formatting via `Intl.RelativeTimeFormat`, locale-aware week-boundary math (e.g. NotificationsDrawer's `startOfWeekMs`), and view-state filter/sort over server fields are all fine.

**Pre-flight checklist before adding a util to `client/src/utils/`:**

1. Does this util read backend constants (modifier tables, frequency formulas, threshold numbers)? **Stop. Move to backend.**
2. Does this util format a value the server already computes? **Ship it.**
3. Does this util compute something the server doesn't yet ship? **Add the field to the model's `as_json`, then read it on the client.**

**Backend reference:** `api/app/models/plant.rb#calculate_schedule`, `api/app/models/space.rb#LIGHT_MODIFIERS / TEMPERATURE_MODIFIERS / HUMIDITY_MODIFIERS`. Both authoritative — never duplicated client-side.

This rule is hard-won (TICKET-047 — `client/src/utils/scheduleEstimate.js` mirrored `Plant#calculate_schedule` for an Add Plant preview, deleted before merge). Don't relearn it.

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

**Card primitive (`Card.Header` / `Card.Body` / `Card.Footer`) slots have no default padding.** Padding is a concern of the *outer container* (the `<form>`, `<Dialog>`'s Card, `WizardCard`'s SHELL), and spacing between slots comes from `gap-*` on that flex parent. Subcomponents are pure layout slots — no `p-6` baked into Header/Body/Footer. `Card.Body` keeps `flex-1 min-h-0 overflow-y-auto` because the scroll behaviour is the slot's job, but everything else (padding, gap) lives on whoever wraps it. The two consumers today: onboarding step `<form>` (`p-6 gap-4` on the form) and `<Dialog>` (`p-6 gap-4` baked into the Dialog's MotionCard className).

### Icon-only buttons — `ActionIcon` is the primitive

**Don't hand-roll `<Action variant="unstyled" className="rounded-full bg-… hover:bg-…">` + `<FontAwesomeIcon>`.** That shape — round icon button with hover accent + tooltip + aria-label — is exactly what `components/ui/ActionIcon.jsx` exists to solve. Hand-rolling drifts visual + a11y across the app and forces the next reader to compare three slightly different button recipes to spot the conventions.

**API:**

```jsx
<ActionIcon
  icon={faXmark}                       // FontAwesome icon
  label="Close"                         // aria-label + tooltip text
  onClick={handleClose}
  scheme="neutral"                      // see schemes table
  size="sm"                             // xs | sm | md
  tooltipPlacement="top"
  tooltip={true}                        // pass false to suppress (e.g. tiny chip-internal X)
/>
```

`ref` and `...kwargs` forward to the underlying `<Action>` so popover anchors and arbitrary aria attrs work without ceremony:

```jsx
<ActionIcon
  ref={triggerRef}
  icon={faBars}
  label="Living Room actions"
  aria-haspopup="menu"
  aria-expanded={open}
  aria-controls={panelId}
/>
```

**Schemes (pick by *role*, not colour):**

| `scheme` | Surface |
|---|---|
| `neutral` | Default. Soft ink wash on transparent. Most chrome-level affordances. |
| `paper` | Paper-deep at-rest, mint hover. Sidebar/topbar chrome (organiser, notifications, mobile menu). |
| `ink` | Ink-tinted at-rest, deeper-ink hover. In-card chip dismiss, drawer back/close. |
| `warning` | Edit-style — sunshine warning tint on hover. |
| `danger` | Delete-style — coral danger tint on hover. |
| `ghost` | Transparent at-rest, paper-deep on hover. Use inside chrome strips where surrounding fill is already paper-deep. |
| `ghost-danger` | Transparent + coral hover. Logout-flavour. |

**Sizes:**

- `xs` — 20px wrapper, 10px icon. Chip-internal close, clear-input X.
- `sm` (default) — 28px wrapper, 12px icon. Most chrome triggers.
- `md` — 36px wrapper, 16px icon. Mobile top bar, larger touch targets.

**When to hand-roll instead:**

- Genuinely unique chrome with no scheme match AND no future repeat (rare). Add a scheme to ActionIcon if the recipe will be reused.
- Decorative non-interactive icon badges (the mint plus circles inside `AddSpaceTile` / `AddPlantTile` aren't ActionIcon — they're visual children of a larger interactive surface).
- A button that needs a child element ActionIcon doesn't support (e.g. an unread-count badge floating over the bell icon — `NotificationsTrigger` keeps a hand-roll for this; could take a `badge` slot prop in future).

**Pre-flight before reaching for `<Action variant="unstyled">` + a `rounded-full` className:** check the schemes table. If one fits, use ActionIcon. If not, ask whether a new scheme is worth codifying, then add it. Don't multiply hand-rolled variants.

This rule is hard-won (TICKET-047 — sweep replaced ~6 hand-rolled icon buttons across Sidebar / MobileTopBar / NotificationsDrawer / Menu / MobileSearchDrawer with ActionIcon, after the same recipe was being copy-pasted around). Don't relearn it.

### Forms

**Use the `TextInput` primitive, never hand-rolled `<input>`.** TextInput owns the label association, hint/error slots, focus ring, `aria-invalid` wiring, and the iOS no-zoom 16px font-size — all of which are easy to forget when copy-pasting markup. Pass `error` as a string when you want the input to render the invalid state and the message; pass falsy to render the optional `hint` instead.

**Error state for multi-field forms is `{ field, message }`, not a plain string.** Border highlight, `aria-invalid`, and `aria-describedby` should only fire on the field that actually failed. Single-error-string state applies the red border to whichever input you wired it to, even when the failure was elsewhere — caught in TICKET-045 when the "pick a space" error painted the nickname input red.

```jsx
const [error, setError] = useState(null) // { field: 'nickname' | 'space', message }

<TextInput
  label="Nickname"
  error={error?.field === 'nickname' ? error.message : null}
  ...
/>
```

**No primitive for the field type you need? Build the primitive.** When you reach for a control that doesn't have a primitive yet (`<select>`, `<textarea>`, etc.), build the primitive in `components/form/` rather than hand-rolling the markup at the consumer. The "two-or-more" extraction rule still applies — if you're the *first* consumer, ship a thin component that encodes the same label/error/focus-ring shape as `TextInput` (so future consumers find it and the visual stays unified). Don't invent new error-styling or focus-ring rules per consumer.

**Focus rings use `focus:ring-inset`.** A 4px outer ring gets clipped by `overflow-hidden` containers (Dialog, scrollable Card.Body). The inset variant lives inside the input border and is always visible. Auth surfaces have plenty of room either way, so the inset version is universally safe.

### Dialogs

The `<Dialog>` primitive *is* a Card under the hood (`MotionCard = motion.create(Card)`). Consumers drop `Card.Header / Card.Body / Card.Footer` as direct children — never wrap them in another `<Card>`. The Dialog owns the outer chrome (radius, padding, gap, shadow, drag handle, focus-trap, close-X).

```jsx
<Dialog open={open} onClose={onClose} title={title}>
  <Card.Header divider={false}>
    <p className="text-lg font-extrabold text-ink">{title}</p>
  </Card.Header>
  <Card.Body className="!flex-none flex flex-col gap-4">…</Card.Body>
  <Card.Footer divider={false} className="flex gap-2.5">…</Card.Footer>
</Dialog>
```

**Dialog title style — CRUD dialogs (Add/Edit space, Add plant):** plain bold paragraph, sans-serif, `text-lg font-extrabold text-ink`. Not `<Heading variant="display">` — that's the wizard/hero treatment and reads too large in a CRUD utility surface. Title text comes from a single const so the variants stay aligned (`Add a plant`, `Edit space`, etc.). Reference: `AddCustomSpaceForm`, `AddPlantForm` (onboarding), `AddPlantDialog`.

**Wizard / hero dialogs (onboarding steps, marketing):** these CAN use `<Heading variant="display">` plus a subtitle — the surface is doing more storytelling than CRUD. Don't mix the two styles within a single dialog tree.

**File naming — three flavours, distinguished by suffix:**

| Pattern | Suffix | When | Today's examples |
|---|---|---|---|
| Record-form dialog (handles **add and edit** modes via `record` prop) | `*FormDialog` | Single CRUD form, mode driven by whether the prop is set. Mirrors Rails `form_with model: @space`. | `SpaceFormDialog` (handles new + edit), `PlantFormDialog` (onboarding's plant add — primed to handle edit if needed via the same prop pattern). |
| Single-action dialog | `*Dialog` (action-Dialog) | Fixed intent — confirm, archive, delete, quick-status. No record-form behind it. | `ConfirmDialog`, `QuickDialog`. |
| Multi-step wizard dialog | `*Dialog` (verb-noun-Dialog) | Multi-step flow with non-form chrome (species pick → details, etc.). The verb is the identity. | `AddPlantDialog` (cross-cutting wizard for picking species + entering details). |

**Rule of thumb:**
- Adding **and** editing a single record → `*FormDialog`. One file, one component, mode driven by the prop.
- One-off action with confirm/cancel or pick-an-option → `*Dialog` (action-Dialog).
- Multi-step orchestration → `*Dialog` (verb-noun-Dialog).
- **Don't ship `EditFooDialog` alongside `AddFooDialog`** — that's the duplication trap. Promote to `FooFormDialog` and let the prop drive mode.

`*Form` (without `Dialog`) is reserved for pure form components NOT wrapped in Dialog — for example a form designed to be embedded inline or in a custom container. None today. If a future use case demands one, name it `*Form` and the consumer wraps it in `<Dialog>` themselves.

This rule is hard-won (TICKET-047 — `AddCustomSpaceForm` lived as a Form file but rendered `<Dialog>` itself; `PlantForm` (onboarding) same. Both were renamed mid-ticket once the convention shook out). Don't relearn it.

### Onboarding wizard structure

The `/welcome` flow has a specific shape that every step follows. Match it; don't invent a new layout per step.

**Folder layout** — `components/onboarding/`:

```
onboarding/
├── shared/                  ← cross-step primitives
│   ├── WizardCard.jsx       ← outer card shell with the SHELL class set
│   ├── WizardActions.jsx    ← Card.Footer with Back+Continue + footerExtras slot
│   ├── StepTip.jsx          ← mint-bg italic advice badge
│   └── StepProgress.jsx     ← progress strip rendered by OnboardingLayout
├── plants/                  ← Step 3-owned subcomponents (AddPlantForm, etc.)
├── spaces/                  ← Step 2-owned subcomponents (AddCustomSpaceForm)
├── intentConfig.js          ← shared logic config (steps, slugs, intents)
└── Step*.jsx                ← step components only at the root
```

The root holds *only* step components and `intentConfig`. Cross-step primitives go in `shared/`; subcomponents owned by a single step go in a folder named after the step's domain (`plants/`, `spaces/`).

**Step structure.** Every step component returns:

```jsx
<form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 gap-4">
  <Card.Header divider={false}>
    <Heading variant="display" subtitle="...">…</Heading>
    {/* StepTip lives here, alongside heading + subtitle — not in Body */}
  </Card.Header>

  <Card.Body className="flex flex-col gap-4">
    {/* the work area */}
  </Card.Body>

  <WizardActions onBack={onBack} continueLabel={...} continueDisabled={...} />
</form>
```

Even non-mutation steps (placeholders, intro screens) wrap in `<form>` — Enter-to-submit and `type="submit"` semantics come for free.

**Naming convention for dialog form components.** When a step opens a Dialog containing a small form, the component is named `Add<Thing>Form` and lives in the step's domain folder: `AddCustomSpaceForm` (Step 2 → `spaces/`), `AddPlantForm` (Step 3 → `plants/`).

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
