# PlantCare

Plant care assistant app. Rails 8 API + React frontend. Learning project for React — user drives frontend, can hand off to Claude for support, scaffolding, or unblocking. Also a shippable product.

Current ticket / plan / phase state lives in memory (`project_frontend_progress.md`) and the active plan in `docs/plans/`. Don't hardcode it here — it rots.

## Stack

Rails 8 API (PostgreSQL, Redis, Sidekiq) + React (JavaScript, Vite, TanStack Query, Tailwind v4, Biome, Playwright). Custom JWT auth (access in memory, refresh in httpOnly cookie). pg_search on Species. Perenual API for species data (100/day, cached).

Monorepo: `api/`, `client/`, `scripts/`, `docker-compose.yml`. Controller layout discoverable via `ls api/app/controllers/api/v1/`; models via `ls api/app/models/`; mockups under `docs/mockups/plantcare-ui/{v1,v2}/`; plans under `docs/plans/`.

## Plant Scheduling

Plants belong to spaces. Users don't set watering/feeding frequency directly — they answer per-space environment questions (light, temperature, humidity) and schedule is calculated from species base frequency adjusted by `Space::LIGHT_MODIFIERS / TEMPERATURE_MODIFIERS / HUMIDITY_MODIFIERS`. Validation reads `.keys` from those hashes — single source of truth.

`before_save :calculate_schedule, if: :should_recalculate?` on Plant.

## Plant Personality

Core selling point. Species carry personality types (`dramatic`, `prickly`, `chill`, `needy`, `stoic`) that drive **visual** behaviour — emotes, status copy, motion, colour accents. Cactus aloof, Monstera dramatic, Snake Plant chill.

Visual-only across all phases. Per-plant *voice* was retired 2026-05-03 — don't reintroduce text framed as "the plant says…". Phase 2.5 helper layer is TBD and must not assume per-plant voice.

Deeper personality work (richer emote sets, motion, personality-driven UI states) is a deliberate second-pass concern — surface it once the v2 baseline (R-tickets / current frontend plan) lands. Keep data + UI hooks compatible: don't strip personality fields from `as_json`, don't hardcode neutral-only states in components that already branch on personality.

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

## Code Style

### Accountability for visual work

When a ticket references a mockup, **read the mockup's CSS before writing JSX** — not just the rendered iframe. Eyeballing loses class names, custom properties, exact spacing, shared styles between mockups.

**Before extracting or implementing a UI primitive, check if a sibling page already has the same shape.** Today + House + Plant Detail share the page-header shape. Today + House list share search row + filter chip. Extract once, share.

**Mid-level dev's reading test:** primitive name recognisable from its job, slot/prop API obvious within 30s, consumer site reads like a layout not CSS. If any answer is no, fix the abstraction before moving on.

Pre-flight before page-level JSX rewrite: open mockup HTML → grep head/chrome/section CSS → cross-reference shared sections → identify primitive name + slot API → then write JSX.

### Reuse existing primitives before building new ones

Grep `components/ui/` and `components/form/` first. If 80% match, **extend** (add prop, variant, slot) — don't fork. Bar for new primitive: existing one can't extend without breaking its API or polluting purpose.

### Comments

Code speaks for itself. Comments reinforce, never narrate. A comment must carry weight code can't — hidden constraint, subtle invariant, bug-specific workaround, surprising behaviour, cross-system coupling. Better identifier name or small refactor → do that, not a comment.

**Delete on sight:** WHAT-narration, identifier-restatement, task narration (`// for TICKET-013`), diff narration (`// now using X`), banners/dividers/changelogs-in-code, unowned TODOs, multi-paragraph essays.

Borderline cases bias toward deletion. Run `/comment-audit` before substantive commits.

### Cache keys

Shape: `<resource> : <selector-parts…> [: v<N>]`. Resource = snake_case domain noun matching Rails model where one exists, singular. External sources flatten into resource (`perenual_search`, not `perenual:search`). Version suffix added on first breaking payload change, never speculatively.

Server (`Rails.cache`) — colon-delimited strings: `"species:popular:v1"`, `"user:42:dashboard:v1"`.
Client (TanStack Query) — flat array tuples: `['species', 'popular']`, `['species', 'search', query]`. Never nested arrays. Never mix the two formats.

Rules: resource first always; one key per consumer (writer doesn't own the namespace, the resource does); bump don't chain (schema change → `:v2`, never `:v1:new`).

### Mutation cache pattern (TanStack Query)

`invalidateQueries` is the **default**. `setQueriesData` is a targeted optimization, never speculative.

Use `invalidateQueries` when: cascading server effects on other queries (counter caches, related records), active subscriber on screen during mutation, or 204 No Content (delete — nothing to patch).

Upgrade to `setQueriesData` only when ALL hold: response IS the canonical record for the cache shape, flow is submit → unmount → remount (no active subscriber to drive refetch), cascading effects covered by selective `invalidateQueries` layered on top.

Worked example — TICKET-045 Step 4: `useUpdateSpace` patches every cached `['spaces', *]` with the response, then `invalidateQueries(['plants'])` because server reschedules every plant in the space. Step 4 remount on Back nav reads patched cache instead of stale.

### Deferred rendering — `useDeferredValue` / `useTransition`

| Hook | Mechanism | Use when |
|---|---|---|
| `useDebouncedValue` | Time-based | Value change triggers a side effect (network, IO, navigation) — don't fire per keystroke |
| `useDeferredValue` | Priority-based | Pure render-only consumer — instant response without arbitrary debounce delay |
| `useTransition` | Priority at setState site | Wrapping setState that triggers heavy renders |

Don't reach speculatively — first ask why the render is slow. Both `useDeferredValue` and `useTransition` are lipstick on a slow render.

Concrete spots: SpeciesPicker keeps `useDebouncedValue` (network call). Future filter UIs → `useDeferredValue`. Tab swap to a heavy panel → `startTransition`.

### Pagination — `useInfiniteQuery` + cursor backend

Don't paginate today. When list volume justifies it: client uses `useInfiniteQuery` with `pageParam`, server returns `{ records, next_cursor }` and reads `?after=ID&limit=N`. Cursor over page-number — stable under inserts, no `OFFSET N` cost, maps onto `pageParam`.

Trigger only on real signals (user feedback, measured slowness, growth past 100+ records). Don't pre-empt — adds API surface, mutation cache complexity, UI affordance work. Pairs with filter UIs (filter narrows visible, pagination loads more).

### Server owns business calculations

Client never duplicates backend business logic. If server computes a value, it ships via `as_json` and client renders it. Mirroring constants client-side → silent drift the moment server tweaks a number.

- **Read, don't compute.** Use server-shipped fields like `plant.days_until_water`, `plant.water_status`, `plant.calculated_watering_days`.
- **Need a preview before persistence?** Add a server endpoint (`POST /plants/preview` → `{ watering_days, feeding_days }`) that reuses the model's calculation method.
- **Round-trip cost actually matters?** Expose constants via a small read-only endpoint. Default to round-trip — only do this if measured.
- **Pure presentation transforms stay client-side.** Formatting `daysUntil` → "In 3 days" / "Due today" / "1 day overdue" lives in `client/src/utils/careStatus.js`.

Pre-flight before adding to `client/src/utils/`: reads backend constants → move to backend; formats a server-computed value → ship; computes something server doesn't yet ship → add to model `as_json`, then read.

Backend reference: `api/app/models/plant.rb#calculate_schedule`, `api/app/models/space.rb#*_MODIFIERS`. Authoritative — never duplicated.

### Naming

- No single-letter or ultra-short abbreviations (`s`, `x`, `fn`, `cfg`, `tmp`) even in tiny helpers. Reader-time beats author-time.
- One-letter names OK only for short loop iterators, and prefer the domain noun (`plant`) over `item`/`el`.
- Destructuring follows the same rule.
- Tiny scope is not an exemption — `const variantStyles = VARIANTS[variant]` beats `const v = …`.
- **No vague placeholder names that pass the length test but tell the reader nothing.** `when`, `sub`, `data`, `value`, `info`, `result`, `obj`, `temp`, `content`, `thing` — multi-letter but useless. Name for *what's in the variable*, not its slot in the function. `when` → `relativeWhen` / `whenLabel` / `performedAtLabel`. `sub` → `subContent` / `secondaryLine`. `data` → `plant` / `species` / whatever it actually is.
- **Avoid identifiers that read as control-flow keywords.** `when`, `then`, `case`, `if`, `do` collide with reader expectations even when not reserved. `whenLabel` beats `when` even before considering content-vs-slot naming.
- **`...kwargs` is the project convention** for rest parameters, not `...rest`.

### CSS — no inline `style` for decorative CSS

Reusable / decorative CSS goes in a Tailwind v4 `@utility` block in `client/src/globals.css`. Match the existing pattern (`hero-glow-urgent`, `hero-image-fade`, `toast-progress`, `marketing-halo-sunshine`).

`style={{...}}` is the escape hatch for genuinely dynamic values (Framer Motion targets, computed transforms, per-instance CSS custom properties like `style={{ '--toast-duration': duration }}`). Not for static gradients, shadows, named visual treatments.

Naming: kebab-case, scoped prefix where it helps. `@utility` owns the visual treatment only — size and position stay as Tailwind utilities at the call site.

### Components

Three buckets, chosen by purpose not reusability:

- **`components/ui/`** — general-purpose primitives that would survive being copy-pasted into a different React app unchanged. Action, Badge, Card, Logo.
- **`components/form/`** — form-specific primitives encoding form UX conventions. TextInput today.
- **`components/`** root — domain components that know about PlantCare data shapes. Sidebar, Dock, ProtectedRoute.

Test: "would this make sense in an app that doesn't have forms?" Yes → `ui/`. No → `form/`. Touches Plant/Space/CareLog → root.

**Two-axis prop convention:** `variant` for style/preset, `scheme` for colour/palette. Same names across primitives so `variant="solid"` or `scheme="coral"` behaves predictably wherever you see it.

**Slot patterns:**

| Slot shape | Pattern | Rails analog |
|---|---|---|
| Single, always paired with parent | Prop on parent (`<Heading subtitle="...">`) | `renders_one :subtitle` |
| Multiple instances, variable count | Compound children (`<AuthMarketing><PeekPill/></AuthMarketing>`) | `renders_many :pills` |
| Default body / form / freeform | `children` | `content` |
| Standalone with no inherent pairing | Independent primitive, not slotted | n/a |

Don't mix patterns for the same slot.

**Sub-components live under their parent's folder.** When extracting bits owned by a parent, group in `components/parent/<role>/`. Path = ownership. One sub-piece used inside one parent only → keep inline as a function. Multiple, or earns its own file → extract to `parent/Sub.jsx`. Genuinely shared → bubble up to module root or `ui/`. File names keep the convention prefix (`AuthCrossAuth.jsx`, not `CrossAuth.jsx`).

**Card slots have no default padding.** Padding lives on the outer container (`<form>`, `<Dialog>`'s Card, `WizardCard`'s SHELL); spacing between slots comes from `gap-*` on the flex parent. `Card.Body` keeps `flex-1 min-h-0 overflow-y-auto` because scroll is the slot's job, but everything else lives on the wrapper.

### Icon-only buttons — `ActionIcon` is the primitive

Don't hand-roll `<Action variant="unstyled" className="rounded-full bg-… hover:bg-…">` + `<FontAwesomeIcon>`. Use `components/ui/ActionIcon.jsx`.

```jsx
<ActionIcon
  icon={faXmark}
  label="Close"
  onClick={handleClose}
  scheme="neutral"
  size="sm"
  tooltipPlacement="top"
/>
```

`ref` and `...kwargs` forward to underlying `<Action>` so popover anchors and arbitrary aria attrs work.

**Schemes** (pick by role, not colour): `neutral` (default chrome), `paper` (sidebar/topbar chrome), `ink` (in-card chip dismiss, drawer back/close), `warning` (edit-style sunshine hover), `danger` (delete-style coral hover), `ghost` (transparent → paper-deep hover), `ghost-danger` (transparent + coral hover, logout-flavour).

**Sizes:** `xs` (20/10px, chip-internal close), `sm` (28/12px, default), `md` (36/16px, mobile top bar).

Hand-roll only when: genuinely unique chrome no scheme matches AND no future repeat (rare — add a scheme instead if reused), decorative non-interactive icon badge, button needs a child element ActionIcon doesn't support (e.g. unread-count badge over the bell).

### Forms

**Use `TextInput`, never hand-rolled `<input>`.** Owns label association, hint/error slots, focus ring, `aria-invalid` wiring, iOS no-zoom 16px font-size. Pass `error` as string for invalid state + message; falsy renders optional `hint`.

**Multi-field error state is `{ field, message }`, not a plain string.** Border highlight + `aria-invalid` + `aria-describedby` only fire on the field that failed.

```jsx
const [error, setError] = useState(null) // { field: 'nickname' | 'space', message }

<TextInput
  label="Nickname"
  error={error?.field === 'nickname' ? error.message : null}
/>
```

**No primitive for the field type yet? Build it in `components/form/`.** Don't hand-roll at the consumer. The "two-or-more" extraction rule still applies — first consumer ships a thin component encoding the same label/error/focus-ring shape as TextInput.

**Focus rings use `focus:ring-inset`.** A 4px outer ring gets clipped by `overflow-hidden` containers (Dialog, scrollable Card.Body). Inset variant lives inside the input border, always visible.

### Dialogs

`<Dialog>` IS a Card under the hood (`MotionCard = motion.create(Card)`). Drop `Card.Header / Card.Body / Card.Footer` as direct children — never wrap in another `<Card>`. Dialog owns outer chrome (radius, padding, gap, shadow, drag handle, focus-trap, close-X).

```jsx
<Dialog open={open} onClose={onClose} title={title}>
  <Card.Header divider={false}>
    <p className="text-lg font-extrabold text-ink">{title}</p>
  </Card.Header>
  <Card.Body className="!flex-none flex flex-col gap-4">…</Card.Body>
  <Card.Footer divider={false} className="flex gap-2.5">…</Card.Footer>
</Dialog>
```

**CRUD dialog title:** plain bold paragraph, `text-lg font-extrabold text-ink`. Not `<Heading variant="display">` (wizard/hero treatment, reads too large in CRUD utility).
**Wizard / hero dialog title:** `<Heading variant="display">` + subtitle OK — surface is doing storytelling.
Don't mix the two within a single dialog tree.

**Footer buttons — fixed convention across every dialog.** Cancel uses `<Action variant="secondary">` (mint pill). Primary action uses `variant="primary"` (emerald gradient pill); destructive primary uses `variant="danger"` (coral-deep pill). Footer is `flex justify-end gap-2.5` — primary pinned right; Cancel sits next to it in confirm dialogs, or pushed left by `ml-auto` / a `<div className="flex-1" />` spacer in form dialogs that have a third left-aligned slot (e.g. EditPlantDialog's delete-link). Don't reach for `variant="ghost"` text-link Cancels — visual drift across surfaces was the original sin.

**File naming — three flavours by suffix:**

| Pattern | Suffix | When | Examples |
|---|---|---|---|
| Record-form (handles add + edit via `record` prop) | `*FormDialog` | Single CRUD form, mode driven by prop. Mirrors Rails `form_with model:`. | `SpaceFormDialog`, `PlantFormDialog` |
| Single-action | `*Dialog` (action) | Fixed intent — confirm, archive, delete | `ConfirmDialog`, `QuickDialog` |
| Multi-step wizard | `*Dialog` (verb-noun) | Multi-step flow, non-form chrome | `AddPlantDialog` |

Don't ship `EditFooDialog` alongside `AddFooDialog` — promote to `FooFormDialog`, prop drives mode. `*Form` (without `Dialog`) is reserved for pure form components NOT wrapped in Dialog.

### Onboarding wizard structure

`/welcome` flow has a specific shape every step follows. Don't invent a new layout per step.

```
components/onboarding/
├── shared/                  ← cross-step primitives
│   ├── WizardCard.jsx       ← outer card shell with SHELL class
│   ├── WizardActions.jsx    ← Card.Footer with Back+Continue + footerExtras
│   ├── StepTip.jsx          ← mint-bg italic advice badge
│   └── StepProgress.jsx     ← progress strip, rendered by OnboardingLayout
├── plants/                  ← Step 3-owned subcomponents
├── spaces/                  ← Step 2-owned subcomponents
├── intentConfig.js          ← shared logic config
└── Step*.jsx                ← step components only at root
```

Every step returns:

```jsx
<form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 gap-4">
  <Card.Header divider={false}>
    <Heading variant="display" subtitle="...">…</Heading>
    {/* StepTip lives here, alongside heading + subtitle — not in Body */}
  </Card.Header>
  <Card.Body className="flex flex-col gap-4">{/* work area */}</Card.Body>
  <WizardActions onBack={onBack} continueLabel={...} continueDisabled={...} />
</form>
```

Even non-mutation steps wrap in `<form>` — Enter-to-submit + `type="submit"` for free.

Dialog form components inside a step: `Add<Thing>Form`, lives in step's domain folder (`AddCustomSpaceForm` → `spaces/`, `AddPlantForm` → `plants/`).

### Client directory layout

Organised by *role*, not feature. Don't invent new top-level folders without a real reason.

```
client/src/
├── api/              # fetch wrapper + API client
├── components/
│   ├── ui/           # general-purpose primitives
│   ├── form/         # form-specific primitives
│   └── *.jsx         # domain components at root
├── context/          # React contexts + providers (AuthContext, ToastContext)
├── errors/           # named Error subclasses, one per file (ValidationError…)
├── hooks/            # custom hooks (useAuth, useFormSubmit)
├── layouts/          # route layout shells
├── pages/            # route-level pages
├── App.jsx           # route table + provider tree
├── main.jsx          # ReactDOM entry
└── globals.css       # Tailwind @theme + @utility
```

Rules: contexts in `context/` not `components/`; errors in `errors/` named after condition not HTTP code, no barrel export, catch with `instanceof`; hooks in `hooks/` even if just wrapping `useContext`; no colocation (no `Foo.test.jsx` next to `Foo.jsx`).

### Tests

Tests live in `client/tests/`, mirroring `client/src/` one-for-one. `src/hooks/useFormSubmit.js` → `tests/hooks/useFormSubmit.test.jsx`.

- `.test.jsx` / `.test.js` — Vitest (RTL, `renderHook`, `vi.mock`)
- `.spec.js` — Playwright, under `tests/pages/` or `tests/e2e/`

Two extensions are how Vitest and Playwright tell their files apart — don't cross.

### Extract as you go

First use: inline. Second use: extract — that's the signal. Don't wait for three. Name for the job, not the shape (`useFormSubmit`, not `useAsyncHandler`). Extraction is part of the current ticket — not a followup.
