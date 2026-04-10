# PlantCare — UI/UX Design Spec

**Date:** 2026-04-09
**Status:** Draft, pending user review
**Scope:** Visual design, information architecture, personality system, interaction patterns, animation choreography, component patterns, and layout system for mobile and desktop.

## Relationship to Other Documents

This spec **extends** — does not replace — the existing planning artifacts:

- [`2026-04-03-plantcare-design.md`](./2026-04-03-plantcare-design.md) — Technical spec: data models, API endpoints, auth, feature phasing. Still authoritative for backend concerns.
- [`../plans/2026-04-03-plantcare-mvp.md`](../plans/2026-04-03-plantcare-mvp.md) — Implementation plan: Tasks 1–21. Backend tasks 1–11 complete. Frontend tasks 12–21 should be re-scoped against this design spec before execution.

No technical decisions from the April 3rd spec are overridden. Data model additions: `CareLog.source` field and `Room.default_light/temperature/humidity` fields, documented in §16.

## 1. Context & Goals

### 1.1 What PlantCare is

A plant care app that helps people keep houseplants alive and thriving. The product thesis: plant care is a **relationship**, not a task list. Each plant has a personality, a voice, and a visible mood. Caring for them should feel like caring for something that notices.

### 1.2 Why this spec exists

Tasks 1–11 of the implementation plan delivered a complete backend (auth, rooms, plants, species, care logs, photos, dashboard, profile — 134 tests passing). Task 12 was slated to begin the React frontend but the plan only specified file structure and data shapes, not visual design, interaction patterns, or UX mental model. This spec fills that gap.

### 1.3 Product pillars

1. **Care mode on mobile, browse mode on desktop.** Phone in hand, standing next to the plant = care. Laptop at the kitchen table = browse. The same app, two layouts, one data model.
2. **Personality is the standout feature.** Five personality archetypes (dramatic, prickly, chill, needy, stoic) drive copy, animation, and visual reactions throughout. Never buried.
3. **Shippable as PWA, installable on iOS.** Web-first today, with the design choices (safe areas, touch targets, glass effects, no hover-only interactions) that allow a future Capacitor wrap or native port.
4. **Phase 3 Greenhouse is the north star.** MVP decisions are made with Phase 3's 2.5D isometric Greenhouse view in mind. The hand-drawn aesthetic and illustrated plant avatars scale directly into that view.

## 2. Core Mental Model

### 2.1 Today = care mode

The default landing screen. Answers "what needs me right now?" The Today screen has two states:

- **Urgent state** — at least one plant is overdue. A hero card dominates the top of the screen, displaying the most urgent plant with its in-character voice and a quick-water CTA.
- **Default state** — nothing urgent. Hero card is absent. The since-ribbon, progress indicator, and today's rituals fill the space.

When the user performs the hero's care action, the screen transitions from urgent → default via a care animation followed by a fade-and-sweep (see §15).

### 2.2 House = browse mode

The collection view. Answers "show me everything I own." Has three view modes that toggle inside the House route, not separate routes:

- **Rooms** (MVP) — 2×2 grid of room cards with plant counts and attention badges
- **List** — flat list of all plants, searchable, sortable
- **Greenhouse** (Phase 3) — 2.5D isometric view of the user's home with plants visible in their rooms, Pokemon-habitat style

### 2.3 The hero card exists because urgency exists

The hero card is a conditional component, not a permanent fixture. If nothing is overdue, there's no hero. This is a deliberate choice: it prevents the screen from being cluttered when the user is on top of things, and it gives the hero weight when it appears because its appearance itself communicates "something needs you."

## 3. Visual Direction

### 3.1 Aesthetic principles

- **Light, airy, bold greens.** Warm near-white base, saturated forest/emerald/leaf greens for accents. Not muted sage, not yellow chartreuse. Think fresh spring foliage after rain.
- **Modern botanical without being generic.** The default 2026 plant-app aesthetic is mint backgrounds + dark forest accents. We stay in that neighbourhood but differentiate with (a) warmer greens that pop, (b) editorial touches on desktop, (c) the personality voice system, (d) illustrated plant avatars that scale into Phase 3.
- **Show, don't label.** Personality is communicated through plant voices, visual states (drooping, sparkles), and animation — never through labels ("DRAMATIC" pills were tried and rejected).
- **Calm when calm, dramatic when needed.** The app is quiet in the default state and loud in the urgent state. The contrast between the two is a feature.

### 3.2 Colour palette

All colours as CSS custom properties. Use the named tokens, not the hex values, in implementation.

| Token | Hex | Role |
|---|---|---|
| `--base` | `#F6FBF4` | App background — warm near-white with slight green tint |
| `--mint` | `#DFF2E2` | Soft fills: stats pills, input backgrounds, since-ribbon, nav hover |
| `--lime` | `#86DB65` | Highlights, CTA accents, sparkle particles, underline swatch behind display words |
| `--leaf` | `#32C456` | Primary accent — the "alive" green. Logo, FAB gradient, active states, progress fills |
| `--emerald` | `#14902F` | Deeper accent — section labels, plant SVG stems, darker FAB stop |
| `--forest` | `#0B3A1A` | Primary dark — hero card, dock active state, primary text inversion |
| `--forest-2` | `#124626` | Hero card gradient second stop |
| `--ink` | `#0A1D0E` | Primary text colour (warm near-black with green undertone) |
| `--ink-soft` | `#4A6A51` | Secondary text, muted meta |
| `--coral` | `#FF6B3D` | Urgency, alerts, overdue indicators, destructive actions (complementary to green) |
| `--sunshine` | `#FFB83D` | Warm highlights, cactus flower, rare celebrations |
| `--card` | `#FFFFFF` | Card backgrounds, sidebar, dock |

**Usage rules:**

- Coral is reserved for true urgency. Never decorative.
- Forest / forest-2 gradient is the signature "statement" treatment — used on hero cards, the add-plant sidebar CTA, and the stats widget. Not for general surfaces.
- Leaf/lime/emerald form a ladder of green emphasis. Leaf is the default accent; lime is highlight; emerald is deeper/richer.
- The base tint (`#F6FBF4`) is *barely* green. Don't increase saturation.

### 3.3 Typography

Two typefaces, loaded from Google Fonts.

- **Plus Jakarta Sans** — primary UI typeface. Clean geometric sans with real personality in the bold weights. Used for all UI chrome, body copy, headings, labels, buttons, everything except display moments. Weights in use: 300, 400, 500, 600, 700, 800.
- **Fraunces** — editorial display serif with beautiful italic. Used sparingly on desktop for page titles ("Good morning, *Robert*") and the desktop hero speech quote. NOT used on mobile (too tight). NOT used for body copy. Creates an editorial moment, not a literary one. Weights in use: 400, 500, 600, 800 with italic.

**Type scale (mobile reference, iPhone 15 Pro points):**

| Role | Family | Size | Weight | Letter-spacing |
|---|---|---|---|---|
| Display headline (onboarding, Today desktop title) | Fraunces | 48–54px | 800 | -0.035em |
| Page title (mobile, "Hi, Robert") | Plus Jakarta Sans | 30px | 800 | -0.025em |
| Section heading ("Today's rituals") | Plus Jakarta Sans | 22px | 800 | -0.025em |
| Hero speech quote (mobile) | Plus Jakarta Sans italic | 22px | 700 | -0.02em |
| Hero speech quote (desktop) | Fraunces italic | 36px | 500 | -0.02em |
| Hero plant name ("MONTY THE MONSTERA") | Plus Jakarta Sans | 13px | 800 uppercase | 0.04em |
| Body task name | Plus Jakarta Sans | 15px | 800 | -0.01em |
| Body plant voice (italic) | Plus Jakarta Sans italic | 13px | 500 | 0 |
| Meta / timestamps | Plus Jakarta Sans | 11–13px | 600 | 0 |
| Tiny labels / tags | Plus Jakarta Sans | 9–11px | 700–800 uppercase | 0.06–0.12em |
| CTA button text | Plus Jakarta Sans | 13–15px | 800 | -0.01em |

**Weight philosophy:** Lean bold. 700 and 800 are default for most text. 500 is italic body/voice text. 400 is rare. Thin weights are not used.

### 3.4 Corner radii

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 6px | Small chips, keyboard keys, tiny badges |
| `--radius-md` | 12px | Task icon tiles, icon boxes, small cards |
| `--radius-lg` | 18px | Task rows, content cards, widgets |
| `--radius-xl` | 22px | Plant avatars (rounded square), medium cards |
| `--radius-2xl` | 28px | Hero card, since ribbon, large content cards |
| `--radius-3xl` | 37px | Mobile dock pill (large radius = floating pill shape) |
| `--radius-full` | 100px | Pills, badges, buttons, progress bar track |

### 3.5 Shadows

| Token | Definition | Use |
|---|---|---|
| `--shadow-sm` | `0 2px 8px rgba(11,58,26,0.06)` | Card resting state |
| `--shadow-md` | `0 10px 30px rgba(11,58,26,0.10)` | Floating widgets |
| `--shadow-lg` | `0 24px 60px rgba(11,58,26,0.14)` | Large panels |
| `--shadow-xl` | `0 40px 100px -20px rgba(11,58,26,0.30)` | Modals, the phone frame in mockups |
| FAB-specific | `0 0 0 4px var(--card), 0 10px 24px rgba(20,144,47,0.4), 0 4px 10px rgba(11,58,26,0.22)` | Halo + coloured drop + ambient |
| Dock-specific | `0 12px 32px rgba(11,58,26,0.14), 0 4px 12px rgba(11,58,26,0.08)` | Floating glass dock |

All shadows use the forest green tint (`rgba(11,58,26,*)`) rather than pure black for a warmer result.

### 3.6 Gradient background

All authenticated screens use the mint gradient as the screen background:

```css
background: linear-gradient(180deg, #F6FBF4 0%, #DFF2E2 50%, #C7ECCA 100%);
```

This applies to both mobile screens and the desktop `.main` content area. The sidebar stays white. Content cards are white with mint borders, floating on the gradient.

## 4. Information Architecture

### 4.1 Navigation structure

Four primary destinations + one persistent primary action. This is the **canonical IA** — don't add a fifth nav item without explicit discussion.

| Slot | Destination | Purpose | Contains |
|---|---|---|---|
| 1 | **Today** | "What needs me right now?" | Hero card (if urgent), since ribbon, today's rituals, progress tracker |
| 2 | **House** | "Show me what I own" | Rooms view / List view / Greenhouse view (Phase 3) toggle |
| FAB | **Add Plant** (primary action) | Camera-first identification flow | Bottom sheet → camera → AI ID → confirm → environment questions → save |
| 3 | **Discover** | "Show me what I don't own" | Species library, AI "what is this plant?" (no add), care guides, future community |
| 4 | **Me** | Profile, settings, account | Avatar, name, email, notifications, theme, streak, export, logout |

**Notes:**

- **No "Plants" as a separate destination.** House's list view covers that.
- **No "Rooms" as a separate destination.** House's rooms view covers that.
- **Climate / environment data lives on plant detail**, not as a top-level nav item.
- **Personality is ambient** — not a nav item. It colours copy and visuals throughout.

### 4.2 FAB dual behaviour

The FAB opens a bottom sheet (Vaul, §14.2) with two camera-driven entry points:

1. **"Add a plant"** — AI identifies species → confirm → ask environment questions → assign to room → save. Creates a new plant.
2. **"Diagnose a plant"** (plant detail page + long-press from FAB) — AI analyses a leaf photo → returns diagnosis + suggested action → optionally logs a CareLog entry with a note.

Both paths share the camera component. Both benefit from Phase 2's AI identification feature.

### 4.3 Mobile vs desktop IA

Same four destinations, different chrome:

- **Mobile:** Bottom dock with 4 labelled icons + floating FAB. Glass treatment. Safe area-aware.
- **Desktop:** Left sidebar with labelled nav items (plant counts visible), dedicated "Add a plant" CTA card, user avatar at the bottom. No bottom dock.

## 5. Screen: Today

### 5.1 Today (mobile) — urgent state

**Layout (top to bottom):**

1. **Status bar** — 54px tall, standard iOS icons (cellular, wifi, battery)
2. **Header** (padding 0 4px, margin-bottom 20px)
   - Left: "Good morning · Wed 9 April" (greet, 14px ink-soft), "Hi, **Robert**" (name, 30px 800 ink, with leaf-coloured name)
   - Right: 52px circular avatar with coral notification dot if unread
3. **Hero card** (the urgent state signature, margin-bottom 18px)
   - Background: `linear-gradient(135deg, var(--forest), var(--forest-2))` with coral radial glow at 80% 100%
   - Border-radius: 28px
   - Padding: 24px
   - **Plant illustration peeks from bottom-right corner**, rotated -4deg, partially cropped by the card edges. The pot is inside the card, leaves extend upward. Uses the "wilting" SVG variant for overdue plants. Gentle droop animation (`rotate(-4deg)` → `rotate(-6deg)` over 5s, ease-in-out, infinite).
   - Text content (`max-width: 220px` so it never overlaps the plant):
     - Title line: 6px coral pulse dot + "MONTY THE MONSTERA" (13px 800 uppercase lime, letter-spacing 0.04em)
     - Speech quote: 22px 700 italic white, left-border 3px coral, padding-left 14px, max-width 220px. Content is the plant's personality-driven voice line.
     - Meta row: "Living room · ⏰ 8 days overdue" — the overdue portion is inline coral text with a small clock SVG icon, NOT a boxed pill (pills take too much real estate and look disconnected from flow)
     - CTA: "Water Monty →" — rounded lime button on forest background, 12×22 padding, 14px 800, lime shadow
4. **Since-you-were-gone ribbon** (compact, single-line, margin-bottom 24px)
   - Background: mint
   - Small circular coral alert icon (28px) on the left
   - Main text: "**3 things changed**" (13px 700 ink), subtext "Monty's mood dropped, Basil needs feeding" (11px 500 ink-soft) on a second line
   - Trailing: "18h ago" (11px 600 ink-soft) right-aligned
5. **Today's rituals header** with progress ring on the right
   - Title: "Today's rituals" (22px 800 ink)
   - Progress: "**1 done** / 2 to go" text + 44px circular progress ring with "1/3" fraction inside. Ring stroke is leaf on mint track.
6. **Task rows** — one per care item today
   - 48px plant avatar (icon tile with SVG illustration of the plant)
   - Plant name (15px 800 ink)
   - In-character voice quote (13px italic 500 ink-soft) — one of the plant's personality voices for "needs care"
   - Tag row: care type + timing, colour-coded (water emerald, overdue coral, mist teal, done leaf)
   - Check circle on the right (30px, 2.5px mint border, becomes leaf-filled with white check when done)
   - Overdue rows get `border-color: rgba(255,107,61,0.3)` and `background: #FFF8F5`
   - Done rows get `background: #F7FDF4` and `opacity: 0.75` with strikethrough on the voice quote
7. **Glass dock** — absolutely positioned, 10px from safe area bottom, 12px from sides
   - 74px tall, 37px radius
   - Background: `rgba(255,255,255,0.78)` with `backdrop-filter: blur(24px) saturate(1.5)`
   - Border: `1px solid rgba(255,255,255,0.6)`
   - Four labelled nav items: Today (active) / House / [FAB gap] / Discover / Me
   - Each nav item: 20×20 stroke SVG icon + 10px 700 uppercase label below
   - Active state: forest colour
   - FAB: 54×54 circle, `linear-gradient(135deg, var(--leaf), var(--emerald))`, 24×24 plus icon in white, positioned `top: -14px` (14px protrusion above the pill), 4px white halo + leaf drop shadow

### 5.2 Today (mobile) — default state

Same layout as urgent state but **the hero card is absent**. The content below the header collapses upward:

- Since ribbon variant: "You're on top of things" with a green checkmark icon instead of coral alert. Subtext: "2 rituals done today · 1 left for Spike". Time: "just now".
- Today's rituals header + progress ring showing the updated fraction (e.g. 2/3)
- Task rows reflecting the current state

The transition from urgent → default is animated, not instant — see §15.2.

### 5.3 Today (mobile) — all-caught-up state

If the user has completed every ritual for today AND has no overdue plants, show a celebratory state where the hero used to be:

- Small celebration card (not the urgent hero)
- Copy: "All caught up. Your plants are thriving." + streak counter
- Confetti particles on first arrival at this state (Framer Motion, one-shot)
- Dissolves automatically on next visit

Not in MVP scope unless time permits. Phase 1.5.

### 5.4 Today (desktop)

**Browser frame, max-width ~1360px centred. Content:**

- **Left sidebar** — 260px wide, white background, right border mint
  - Logo block (38px gradient-filled logo mark + "Plant**Care**" wordmark, Fraunces-free)
  - Nav label "NAVIGATE" (10px 800 ink-soft tracking 0.12em)
  - Nav items: Today (active, with count "2" badge) / House (count "12") / Discover / Me
  - Active state: mint background, 4px leaf rail on left, count badge becomes leaf-filled
  - **Add a plant CTA card** (18px radius, forest gradient background, "+ New plant" lime button) — this replaces the FAB. "Add a plant" has its own dedicated real estate on desktop.
  - Footer: 38px user avatar + name + "12 plants · 4 rooms" meta
- **Main content** (flex: 1, padding 40px 56px)
  - **Page head** (margin-bottom 32px): page title "Good morning, *Robert*" in **Fraunces italic 54px** (this is the only place Fraunces appears on Today, and it's the editorial moment). Date eyebrow "Wednesday, 9 April" above. Right side: 240px search input with `⌘K` hint + "3 plants need care today" pill.
  - **Hero card** (wider than mobile, flex horizontal layout, min-height 320px)
    - Left side: text content (max-width 440px) — same structure as mobile but scaled up, hero speech quote in **Fraunces italic 36px 500**
    - Right side: 340px × 400px plant SVG with `drop-shadow(-8px 8px 30px rgba(0,0,0,0.4))`. Monty has real presence here.
    - Hand-drawn dashed arrow flourish: `stroke: var(--lime)`, `stroke-dasharray: 4 3`, curving above the hero, 160×60px, opacity 0.35. Editorial detail, used sparingly (one per page maximum).
  - **2-column below the hero** (`display: grid; grid-template-columns: 2fr 1fr; gap: 24px`)
    - **Left column (tasks):** Section header with progress ring (48px version) + task rows at 56px avatar size, 20px 22px row padding. Same structure as mobile, scaled up.
    - **Right column (widgets):**
      - **"Since you were gone" widget** — mint background, list of individual changes with timestamps ("Monty's mood dropped from Content to Wilting · 6 hours ago"). Replaces the compact mobile ribbon with a more detailed feed.
      - **"Your jungle" stats widget** — forest gradient background. Big number in **Fraunces italic 54px** ("12"). "plants across 4 rooms" label below. Sub-stats row: 94% healthy / 7d streak / 34 photos.
      - **"Discover picks" widget** — species recommendations with small thumbnails, arrow links.

### 5.5 Today (desktop) — default state

Sidebar stays. Page head stays (possibly with a quieter title variant: "Good afternoon, *Robert*. Everything is calm."). Hero card is absent; tasks and widget column promote upward with the same LayoutGroup sweep animation.

## 6. Screen: Auth (Login + Register)

Both login and register are single-screen forms, not wizard steps. Same mint gradient background as all authenticated screens.

### 6.1 Shared elements

- **Logo mark + PlantCare wordmark** above the form card
- **Fraunces italic heading:** "Welcome *back*" (login) / "Join the *jungle*" (register)
- **Form card:** white with mint border, floating on the gradient
- **Focus state:** leaf-green border + 4px soft glow, field icon shifts from ink-soft to emerald
- **Switch links:** "Don't have an account? Sign up" / "Already have an account? Log in" below the card
- **No decorative leaf backgrounds** — clean gradient only (they competed for attention and were removed during brainstorming)
- **No social login in MVP** — custom JWT auth only

### 6.2 Login

- Email input + password input
- "Log in" CTA button (leaf gradient, full-width)
- "Forgot password?" link below password field

### 6.3 Register

- Name input + email input + password input
- **Password strength indicator:** 4-segment horizontal bar below the password field. Fills progressively from leaf to emerald as strength increases.
- "Create account" CTA button (leaf gradient, full-width)

## 7. Screen: Onboarding Wizard

Post-registration, linear dialog-style flow. 5 steps on the same gradient container as auth. Progress bars (not dots) at the top of each card.

### 7.1 Step 1: Welcome

- Plant illustration centred
- Heading: "Let's set up your *garden*" (Fraunces italic)
- Brief intro paragraph
- "Get started" CTA

### 7.2 Step 2: Rooms

- Preset room checkboxes: Living Room / Kitchen / Bedroom / Bathroom / Office
- "Add custom room" dashed row at the bottom
- Must pick at least 1 room to proceed
- "Continue" CTA

### 7.3 Step 3: First plant

- Species search input → selected species card (forest gradient, personality + difficulty pills) + nickname input
- "Skip for now" option — this is the only optional step
- "Continue" CTA

### 7.4 Step 4: Environment

- 3 segmented control groups:
  - **Light:** Low / Medium / Bright
  - **Temperature:** Cool / Average / Warm
  - **Humidity:** Dry / Average / Humid
- Defaults pre-selected (Medium / Average / Average)
- "Not sure? You can update anytime." note below the controls
- "Continue" CTA

### 7.5 Step 5: Done

- Celebration state: thriving plant SVG with sparkle particles
- Heading: "You're *all set*, Robert" (Fraunces italic, personalised)
- Monty's first voice in a speech card (white card, leaf left-border 3px, Fraunces italic 15px)
- "Enter your jungle" CTA

### 7.6 Post-wizard

After wizard completion, user lands on Today with their first plant visible (if they added one in step 3). A driver.js tour runs once on first visit, highlighting key Today elements: greeting header, hero card, since ribbon, a task row, the dock nav, the FAB. Tour completion is stored in localStorage. Manual replay available from the Me screen.

## 8. Screen: House

### 8.1 House (mobile) — Rooms view (MVP)

- Header: "House · Rooms" label pill + "Four *rooms*, twelve plants." heading + meta line "All in good health — except 3 need water"
- View toggle pill (mint background, 4px padding, pill-shaped buttons inside): [Rooms] / [List] / [Greenhouse]
- 2×2 grid of room cards (`grid-template-columns: 1fr 1fr; gap: 12px`)
  - Each card: 20px radius, mint border, 16px 14px padding, min-height 130px, white background
  - Room icon tile at the top (36×36 mint-filled, emerald icon)
  - Room name (15px 800 ink)
  - Plant count (11px 600 ink-soft)
  - Stacked plant avatar dots at the bottom (small circles with `margin-left: -6px` overlap), "+N" text for overflow
  - **Attention state:** if any plant in the room is overdue, the card gets coral border tint and a "2 THIRSTY" badge in the top-right corner in coral
- Glass dock with House active

### 8.2 House (mobile) — List view

Not mocked. Principles:
- Inherits the same header style and view toggle
- Each plant row resembles a Today task row: plant avatar, name, species, care status, overdue indicator
- Sortable (by room, by urgency, by name, by date added)
- Searchable via a search input at the top

### 8.3 House (mobile) — Greenhouse view (Phase 3)

- Header identical to Rooms view but with "Greenhouse" label
- **Large isometric house illustration** (320px tall) occupying most of the screen
- 2.5D SVG rendering with four rooms visible (Bedroom / Bathroom upstairs, Living Room / Kitchen downstairs)
- Each room contains small plant dots/icons at their approximate locations
- **Pokemon habitat interaction:** tap a plant → that plant enlarges, the containing room gets a coral focus glow, other rooms dim to `opacity: 0.65`, and a speech bubble pops out above the house with the plant's personality voice. Gold sparkle particles around the focused plant.
- Room labels in small white pills ("LIVING · 5") above each room in the illustration
- Attention badges: rooms with overdue plants get a coral pin on their label ("LIVING · 2" becomes coral-bordered)
- Below the house: compact "attention list" showing specific overdue plant names with "→" links to detail
- Mini room legend at the bottom: small cards showing Living / Kitchen / Bed / Bath with status

**Phase 3 implementation options:**
- SVG-based (parallax, no 3D library) — simpler, MVP-friendly
- Three.js with orbit controls — richer, desktop-primary

### 8.4 House (desktop)

Principles (not mocked in this brainstorm session):
- Rooms view: grid is wider, maybe 3×2 or 4×2 depending on user's house size
- List view: table-style with columns (name, species, room, last cared, next care, status)
- Greenhouse view: becomes a full-screen 3D scene with Three.js, orbit controls, click-to-focus rooms. This is the Phase 3 hero moment of the entire product.

## 9. Screen: Plant Detail

### 9.1 Layout (top to bottom)

1. **Portrait hero card** — forest gradient background, plant SVG on the right with gentle sway animation
   - Plant name: Fraunces italic, 34px
   - Species: italic, below name
   - Pills: personality tag + state tag
   - Voice quote card: white, leaf left-border 3px, Fraunces italic 15px
2. **Care rings** — 4 rings in a row: Light / Water / Mood / Feed
   - Mobile: 54px diameter
   - Desktop: 88px diameter
   - Leaf green for healthy, coral for low
3. **Quick actions**
   - Mobile: 4 horizontal buttons below rings — Water (primary) + Feed / Photo / Diagnose
   - Desktop: dedicated toolbar row below portrait hero (not inside care card)
4. **Tabbed section card** — white card on the gradient background with segmented control tabs: History / Photos / Care / Species
5. **Glass sticky header** — appears when portrait scrolls off-screen. Compact avatar + name + "Water" CTA. `backdrop-filter: blur` matching dock treatment.
6. **Scroll-to-top button** — 46px white glass circle, bottom-right above dock, appears alongside sticky header

### 9.2 Care tab content

- **Room section:** house icon, "Monty lives in Living Room", "Change" affordance
- **Schedule section:** watering row (icon + "Every 7 days" + "Next: In 2 days"), feeding row (same pattern)
- **Environment section:** 3 segmented controls (Light / Temperature / Humidity) showing current values
- **Recalculate button:** triggers schedule recalculation from current environment values

### 9.3 Species tab content

- **Scientific name card:** forest gradient, Fraunces italic species name, common name + family + origin below
- **At-a-glance stat grid:** 3 cards — Difficulty, Growth, Toxicity. Toxicity card uses coral if present.
- **Care requirements rows:** Light, Water, Temperature, Humidity — label + value per row
- **Personality description card:** personality tag pill + Fraunces italic description paragraph

### 9.4 Room change behaviour

When changing a plant's room via the Care tab: a prompt-to-update modal appears showing the new room's default environment values with three options:

- **Update** — apply the new room's defaults
- **Review manually** — open the environment segmented controls for manual adjustment
- **Keep current** — retain the plant's existing environment settings

Data model addition for room defaults:

```ruby
add_column :rooms, :default_light, :string
add_column :rooms, :default_temperature, :string
add_column :rooms, :default_humidity, :string
```

## 10. Screen: Add Plant Flow

### 10.1 FAB entry

FAB tap opens a bottom sheet (Vaul) with two options:

- **"Add a new plant"** (primary, camera icon)
- **"Check a plant's health"** (secondary, diagnose icon)

### 10.2 Camera view

- Live camera preview
- Focus frame corners overlay
- "DETECTING" badge while AI processes

### 10.3 AI result card

- Species name in Fraunces italic
- Common name below
- Personality tag pill
- Confidence bar with percentage (e.g. "96% confident")

### 10.4 Confirm details sheet

- **Species mini-card:** forest gradient, showing identified species
- **Nickname input:** "What should we call them?"
- **Room picker:** chip-style buttons with room icons, active chip = leaf green fill
- **Environment segmented controls:** Light / Temperature / Humidity (defaults from selected room)
- **"Add to garden" CTA**

**Fallback (no AI match or user prefers manual):** Search species database directly, skip camera step.

## 11. Screens: Discover + Me (principles)

**Discover** — not mocked:
- Species library (searchable grid of species cards with hero images, scientific names, difficulty, personality tags)
- "Identify any plant" camera button (same component as Add Plant, but doesn't save to collection)
- Care guides section (seasonal tips, troubleshooting, pest identification)
- Recommendations: "Plants that would love your environment" based on the user's rooms and conditions
- Phase 2+: community, shared care journals

**Me** — not mocked:
- Profile header (avatar, name, email, streak counter)
- Settings sections: Notifications / Theme / Units / Language / Privacy
- Account actions: Change password / Export data / Delete account / Logout
- Quiet, utilitarian. No hero cards, no personality voices. This screen is not for delight; it's for control.

## 12. Personality System

### 12.1 The five archetypes

These match the existing `Species.personality` field values in the technical spec.

| Type | Voice tone | Animation character |
|---|---|---|
| **🎭 Dramatic** | Overwrought, theatrical, prone to soliloquy. Finds the extreme in everything. | Big bounce on care, dramatic droop when neglected, full-amplitude animation |
| **🌵 Prickly** | Gruff, sarcastic, would rather not make a fuss but absolutely will if pushed. | Minimal animation, grudging straighten on care, slow reactions |
| **😎 Chill** | Laid back, zero urgency, will die politely without complaining until it's too late. | Subtle animation, gentle lean, always looks relaxed |
| **🥺 Needy** | Affectionate, wants attention, catastrophises mild inconvenience. | Heart particles on care, excited wiggle, biggest emotional amplitude |
| **🗿 Stoic** | Formal, minimal words, treats life as a series of procedures. | Small confident moves, no particles, fast settles |

### 12.2 Voice library

The voice system is **templated in MVP**, **LLM-generated in Phase 3**.

**MVP storage:** voices are stored as config on the `Species` model (or a separate `PersonalityVoice` model keyed by personality type + care state). Each personality has roughly 5–10 variants per care state:

```
personality: dramatic
state: overdue (100-150% interval)
variants:
  - "I'm wilting. This is, I fear, my villain origin story."
  - "Quickly! Time is a flat circle and I'm crumbling."
  - "Eight days without water. Remember me fondly."
  - "This is how it ends. In a pot. Unwatered. Forsaken."
```

Selection: random from the variant pool for the plant's current personality × state combination. Cache the selected variant for the session so it doesn't shuffle on re-render.

**Phase 3 LLM generation:** same structure, but variants are generated on-the-fly by an LLM given the plant's name, species, personality, care state, and recent history. Premium feature.

### 12.3 Example voices at each state

Monty the Monstera (dramatic):

| State | Voice |
|---|---|
| Thriving | "I'm having the best day. Every day is the best day." |
| Content | "All is well in my little pot. Carry on." |
| Thirsty | "I could use a drink. Take your time. I'll be here. Suffering quietly." |
| Wilting | "I'm wilting. This is, I fear, my villain origin story." |
| Parched | "Goodbye, cruel world. Actually no — water. I need water." |
| Just watered (reward) | "Oh. OH. I feel it coursing through me. A REDEMPTION ARC." |

Spike the Cactus (prickly):

| State | Voice |
|---|---|
| Content | "I'm fine. I'm always fine. Don't ask." |
| Thirsty | "Not thirsty. I'm literally a cactus. Move along." |
| Wilting | "Fine. If you must. One drop." |
| Just watered | "Fine. Thanks. Obviously I would have survived either way." |

Fernie the Boston Fern (needy):

| State | Voice |
|---|---|
| Thriving | "YOU'RE the best. I'm the best. WE'RE the best." |
| Content | "I miss you. Not in a weird way. Maybe a little weird." |
| Thirsty | "It's been 3 days... not that I'm counting... I am definitely counting." |
| Just watered | "YOU REMEMBERED. I LOVE YOU. Is this forever? Are you leaving?" |

## 13. Plant Visual State System

Each plant has **five visual states**, computed from the elapsed fraction of its watering interval:

| State | Threshold | Illustration changes |
|---|---|---|
| **Thriving** | 0–20% elapsed | Perky pose, sparkle particles, gradient leaves bright, optional water droplet |
| **Content** | 20–70% elapsed | Normal upright pose, no decoration, saturated but not sparkly |
| **Thirsty** | 70–100% elapsed | Slight leaf droop, slightly muted saturation |
| **Wilting** | 100–150% overdue | Visible leaf droop (paths rotate downward), sad water droplet, reduced saturation |
| **Parched** | 150%+ critically overdue | Heavy droop, yellow-tinged leaves, cracked soil, coral SOS indicator |

**Implementation approach:**

1. Each species has **five SVG path sets** — one per state — stored as React components or JSON path strings
2. The component picks the appropriate SVG based on `plant.state` (computed server-side)
3. Transition between states uses Framer Motion path interpolation (`animate` on the `d` attribute)
4. Decorations (sparkles, droplets, SOS badges) are separate `<motion.div>` elements with conditional rendering + presence animations

**Implementation alternative (simpler):** Instead of five distinct SVGs, use **one base SVG per species** with CSS classes / props that control:
- Stem rotation (drooping angle)
- Leaf colour saturation (filter: saturate(...))
- Decoration presence (sparkles, droplets)
- Overall opacity / tint

This is what the mockups use and is fine for MVP. Distinct SVGs are a Phase 2 upgrade if the simple version feels anaemic.

## 14. Interaction Patterns

### 14.1 Care logging

**Primary (MVP):** Tap the check circle on a Today task row, OR tap the "Water now" CTA on the hero / plant card. Creates a `CareLog` row with `source: "manual"` (or `"task"` if from the task list specifically). Triggers the care animation (§15).

**Secondary (MVP+):** Swipe a Today task right → mark complete. Left → snooze. Uses Framer Motion drag with velocity thresholds.

**Tertiary (Phase 1.5):** iOS widget with "Water Monty" quick action. Siri shortcut. Both hit the same API endpoint with `source: "widget"` or `"siri"`.

**Later (Phase 2+):** Home Assistant automation webhook, soil moisture sensor auto-logging. Writes CareLog with `source: "sensor"` or `"automation"`.

### 14.2 Bottom sheets (Vaul)

All modal flows use bottom sheets instead of full-screen overlays. Vaul is the chosen library (purpose-built for iOS-style drag-to-dismiss).

**Used for:**
- Add Plant flow
- Diagnose plant flow (AI first aid)
- Log care manually (non-task actions)
- Filter / sort in House
- Settings subpages from Me
- Plant detail (optional — could be a full page too; decide per use case)

**Behaviour:**
- Slide up from the bottom with spring
- Drag handle at the top (4px × 40px rounded bar)
- Dismiss on swipe-down, tap backdrop, or explicit close button
- Backdrop: `rgba(0,0,0,0.4)` with `backdrop-filter: blur(8px)`
- Sheet top corners rounded 28px
- Content can scroll inside the sheet; drag-to-dismiss is disabled when scrolled past top

### 14.3 Glass effects

Used on:
- **Bottom dock** (mobile): `background: rgba(255,255,255,0.78); backdrop-filter: blur(24px) saturate(1.5)`
- **Status bar overlay** (mobile): same treatment when content scrolls underneath
- **Sheet backdrop** (when sheets are open)

Not used on: hero cards (solid forest), task rows (solid white), sidebar (solid white). Over-use of glass flattens the visual hierarchy.

**Graceful degradation:** browsers without `backdrop-filter` support get a solid white fallback (`background: var(--card)`). Currently this affects only very old Firefox; most users get the full effect.

## 15. Animation System

### 15.1 Care animation sequence (the "Water Monty" reward)

Total duration ~1.8s. Implemented in Framer Motion.

| Phase | Timing | Effect |
|---|---|---|
| **1. Tap** | 0.0s | Button scales to 0.95 (80ms spring), light haptic (`navigator.vibrate(10)`), ripple effect from touch point |
| **2. Pour** | 0.2s | 4–6 water droplet `<motion.div>` elements fall from the top of the hero with staggered delays (50ms each), cubic ease-in, land on the plant and fade |
| **3. Morph** | 0.6s | Plant SVG path `d` attributes tween from wilting variant to upright variant using `animate()` with spring physics (`stiffness: 180, damping: 22`). Takes 600ms. |
| **4. Reward** | 1.2s | Gold sparkle particles burst outward from the plant in a radial pattern (8 `<motion.div>` with random angles). Plant does a small scale bounce (1 → 1.05 → 1). Speech quote cross-fades to the "just watered" variant. |
| **5. Settle** | 1.6s | Progress ring tweens from 1/3 → 2/3 (stroke-dasharray animation). Task row collapses to done state with strikethrough + check-circle fill. CTA button changes to "Watered" with a leaf tint. |

### 15.2 Fade + sweep to default state

After the care animation completes and the plant sits in the thriving state for ~600ms (payoff pause), the hero card exits and the content below sweeps up.

| Phase | Timing | Effect |
|---|---|---|
| **Payoff pause** | 1.8–2.4s | Hero stays visible in thriving state so the user sees the reward |
| **Hero exits** | 2.4–2.7s | Hero card fades (`opacity: 0`) and slightly scales (`scale: 0.96`) over 300ms ease-out. `AnimatePresence` exit animation. |
| **Sweep up** | 2.7–3.1s | Content below (since ribbon, tasks header, tasks) slides up into the vacated space. 400ms spring. Handled automatically by Framer Motion's `layout` prop. |
| **Default** | 3.1s+ | New equilibrium. No hero. User is in the default state of Today. |

**Total time from tap to default:** ~3.1 seconds.

**Edge cases:**
- If another overdue plant exists, the hero cross-fades instead of exiting. Key the hero on `plant.id` so AnimatePresence treats the change as a key swap.
- If watering completes all tasks, reveal the all-caught-up celebration card in place of the hero exit.

### 15.3 Personality-specific care reactions

Same framework, different *parameters*:

| Personality | Bounce amplitude | Particles | Animation speed | Copy tone |
|---|---|---|---|---|
| Dramatic | 1.0 → 1.08 | Full gold sparkles | Normal | Theatrical |
| Prickly | 1.0 → 1.02 | 1–2 small sparks | Slow | Grudging |
| Chill | 1.0 → 1.01 | None | Slow | Unbothered |
| Needy | 1.0 → 1.10 | Heart particles | Fast | Overexcited |
| Stoic | 1.0 → 1.03 | One droplet | Fast | Minimal |

Stored as a config object keyed by personality type. The animation component reads the config and passes the parameters to Framer Motion.

### 15.4 Framer Motion implementation sketch

```jsx
import { motion, AnimatePresence, LayoutGroup } from "motion/react";

export function Today() {
  const { data: dashboard } = useDashboard();
  const urgent = dashboard?.most_urgent_plant;

  return (
    <LayoutGroup>
      <TodayHeader user={dashboard.user} />

      <AnimatePresence>
        {urgent && (
          <motion.div
            key={urgent.id}               // cross-fade on change
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3 }}
          >
            <HeroCard plant={urgent} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout>
        <SinceRibbon data={dashboard.since} />
        <TasksHeader progress={dashboard.progress} />
        <TaskList tasks={dashboard.tasks} />
      </motion.div>
    </LayoutGroup>
  );
}
```

The `layout` prop is the key piece — it lets Framer Motion handle the sweep-up automatically when the hero unmounts. No positioning math in the component.

## 16. Data Model Additions

Minimal additions to the existing technical spec. Single field and one future model.

### 16.1 CareLog.source (add now, MVP)

Add a `source` enum column to the existing `care_logs` table:

```ruby
# db/migrate/xxxx_add_source_to_care_logs.rb
class AddSourceToCareLogs < ActiveRecord::Migration[8.1]
  def change
    add_column :care_logs, :source, :string, default: "manual", null: false
  end
end
```

```ruby
# app/models/care_log.rb
class CareLog < ApplicationRecord
  SOURCES = %w[manual task swipe widget siri sensor automation].freeze
  validates :source, inclusion: { in: SOURCES }
end
```

MVP only writes `manual` and `task`. The other values are reserved for future automation.

### 16.2 Room default environment fields (add now, MVP)

```ruby
# db/migrate/xxxx_add_default_environment_to_rooms.rb
class AddDefaultEnvironmentToRooms < ActiveRecord::Migration[8.1]
  def change
    add_column :rooms, :default_light, :string
    add_column :rooms, :default_temperature, :string
    add_column :rooms, :default_humidity, :string
  end
end
```

Used by the room-change prompt (§9.4) to suggest environment values when a plant moves rooms.

### 16.3 Device model (Phase 2, not now)

Future model for sensor/smart device integration. Documented here for forward compatibility.

```ruby
class Device < ApplicationRecord
  belongs_to :plant
  # fields: id, plant_id, device_type, device_id_external, battery_pct,
  #         last_reading_at, last_reading_value, created_at
end
```

One plant can have zero-or-one or zero-or-many devices. Devices push CareLog entries with `source: "sensor"` via a webhook endpoint `POST /api/v1/devices/:id/readings`.

## 17. Layout System

### 17.1 Mobile (iPhone 15 Pro reference)

| Dimension | Value |
|---|---|
| Viewport | 393 × 852 pt |
| Screen corner radius | 47 pt |
| Dynamic Island | 124 × 37 pt, 11pt from top |
| Status bar | 54 pt tall, padding 18px 32px |
| Home indicator safe area | 34 pt |
| Content padding | 22 pt (horizontal), 14 pt (top) |
| Dock bottom inset (from content edge) | 10 pt |
| Dock side inset | 12 pt |

### 17.2 Desktop

| Dimension | Value |
|---|---|
| Min viewport | 1280 px (breakpoint: anything smaller uses mobile layout) |
| Max content width | 1360 px |
| Sidebar | 260 px fixed |
| Main content padding | 40 px vertical, 56 px horizontal |
| Main content inner columns | `grid-template-columns: 2fr 1fr` with 24px gap |

### 17.3 Tablet (stretch)

Single column centred, max-width 780 px, no sidebar. Uses mobile dock. This is a stretch target, not MVP. Test via `@media (min-width: 768px) and (max-width: 1279px)`.

### 17.4 Breakpoints

```css
/* Mobile-first default: anything below 768px */
/* Tablet */
@media (min-width: 768px) { ... }
/* Desktop */
@media (min-width: 1280px) { ... }
```

## 18. Tech Stack Additions

Additions to the existing client stack:

| Library | Purpose | Notes |
|---|---|---|
| `motion/react` (Framer Motion v11+) | Animation, gestures, layout transitions | Primary animation library. Used for care animation, fade+sweep, task swipes, personality reactions. |
| `vaul` | Bottom sheet modals | iOS-style drag-dismiss sheet. Used for Add Plant, Diagnose, Log Care, Settings subpages. |
| `@fontsource/plus-jakarta-sans` | Self-hosted display font | Avoid Google Fonts at runtime for privacy + performance. |
| `@fontsource/fraunces` | Self-hosted editorial font | Same reason. Only loaded on desktop routes to save mobile bundle size. |
| `driver.js` | Post-registration tutorial tour | Lightweight, step-by-step highlight overlays. Runs once after onboarding wizard on first visit to Today. Completion stored in localStorage. Manual replay from Me screen. |

**Not added (explicit rejection):**
- No icon library (lucide, heroicons, etc.) — custom SVG icons maintained inline. Keeps bundle small and ensures visual consistency.
- No UI component library (Radix, Shadcn, etc.) — every component is built in this project's style. The design system is specific enough that generic primitives don't fit.
- No CSS-in-JS runtime (styled-components, emotion) — Tailwind + CSS variables handle all styling.

## 19. Accessibility

- **Colour contrast:** all text meets WCAG AA (4.5:1 for normal text, 3:1 for large text). Verify with tooling during development.
- **Touch targets:** minimum 44×44 pt for interactive elements per Apple HIG. Task check circles are visually 30 pt but have invisible hit targets extended to 44×44.
- **Focus states:** every interactive element has a visible focus outline. Use `outline: 2px solid var(--leaf); outline-offset: 2px`.
- **Reduced motion:** respect `prefers-reduced-motion: reduce`. Replace care animation with a simple cross-fade. Disable layout sweep — instant transition.
- **Screen readers:** plant state changes are announced via `aria-live` regions. "Monty is now wilting" / "Monty has been watered."
- **Keyboard navigation:** Tab order follows visual flow. Enter on task check circle logs care. Arrow keys navigate task list.
- **Plant voice content:** marked as decorative (`aria-hidden` on italic quotes) because they're flavour. The care state itself is exposed via `aria-label` on the task row.

## 20. Open Questions (for later)

Deferred from this spec. Decide before or during implementation of the relevant screen.

- **Tablet layout** — does it get its own dedicated layout or adapt mobile/desktop? Probably adapts, but need to test real devices.
- **Dark mode** — not in MVP. If added, the palette needs a dark variant. Forest becomes background, mint becomes dim text, leaf stays leaf.
- **Offline support** — PWA service worker strategy. Cache strategy for plant photos, task list, species search.
- **Push notifications** — already scoped in the April 3rd spec (Phase 2). UI for enabling / managing notification preferences needs design.
- **Streak gamification** — is the 7-day streak a serious mechanic with rewards, or just a vanity number? Lean: vanity number for MVP, mechanic if analytics show it drives retention.
- **Plant portraits vs photos** — MVP uses SVG illustrations (per species, not per individual plant). Phase 2 could allow user-uploaded photos to replace the SVG in plant avatars. Decide based on PlantPhoto feature traction.

## 21. Summary of Decisions Locked In

For quick reference when implementing Task 12+:

- [x] **Aesthetic:** light/airy modern botanical, warm-neutral greens, not yellow
- [x] **Primary font:** Plus Jakarta Sans (everything except desktop display)
- [x] **Display font:** Fraunces italic (desktop only, page titles + hero quote)
- [x] **Palette:** `--base / --mint / --lime / --leaf / --emerald / --forest / --ink / --coral` tokens defined
- [x] **Mobile-first, iPhone 15 Pro reference** (393 × 852)
- [x] **Information architecture:** Today / House / [FAB: Add Plant] / Discover / Me
- [x] **Today screen:** header → hero (if urgent) → since ribbon → tasks with progress ring → glass dock
- [x] **Hero card:** plant peeks from bottom-right corner, text on left, rotated -4deg, wilt animation
- [x] **Overdue indicator:** inline coral text with clock icon, NOT a boxed pill
- [x] **Dock:** glass-effect floating pill, 10px from safe area bottom, 4 labelled icons + elevated FAB
- [x] **Personality voices:** inline italic quotes throughout, never labelled with type names
- [x] **5 visual states** per plant: thriving/content/thirsty/wilting/parched, computed from care interval
- [x] **Care animation:** 1.8s sequence (tap → pour → morph → reward → settle)
- [x] **Fade + sweep:** Framer Motion `LayoutGroup` + `AnimatePresence` + `layout` prop
- [x] **5 personality archetypes** with per-personality animation parameters
- [x] **Vaul** for bottom sheets (Add Plant, Diagnose, etc.)
- [x] **Framer Motion** for all animation
- [x] **CareLog.source** field added in migration (manual/task/swipe/widget/siri/sensor/automation)
- [x] **Device model** reserved for Phase 2 automation
- [x] **Desktop:** sidebar + main content + 2-column below hero + Fraunces display titles
- [x] **Phase 3 Greenhouse:** House's Greenhouse view, replaces room grid, Three.js or SVG parallax, Pokemon-habitat interaction
- [x] **AI recognition:** dual purpose — "add a plant" (FAB) + "diagnose a plant" (plant detail)
- [x] **Garden renamed to House** throughout
- [x] **Isometric view mode renamed to Greenhouse** (not Dollhouse)
- [x] **All authenticated screens use mint gradient background** (mobile + desktop)
- [x] **Auth screens** (login + register) are single-screen forms with Fraunces italic headings
- [x] **Onboarding wizard:** 5-step dialog-style post-registration flow
- [x] **Plant Detail:** portrait hero + voice quote + rings + toolbar + tabbed section card
- [x] **Care tab:** Room section + Schedule + Environment + Recalculate
- [x] **Species tab:** Scientific name + At-a-glance + Requirements + Personality
- [x] **Add Plant:** FAB → Vaul sheet → camera → AI identify → confirm details
- [x] **Sticky header + scroll-to-top** on Plant Detail scroll (glass treatment)
- [x] **Room change triggers prompt-to-update environment**
- [x] **`Room.default_light/temperature/humidity` fields** added
- [x] **driver.js** for post-registration tutorial tour
- [x] **Quick actions on desktop:** dedicated toolbar row below portrait (not inside care card)

## 22. Next Steps

1. User review of this spec.
2. Fold `CareLog.source` addition into a migration (can be done alongside Task 12 setup).
3. Invoke the writing-plans skill to produce a detailed implementation plan for Tasks 12–21 of the existing MVP plan, updated against this design spec. Expect re-scoping: the old plan's file structure is still mostly valid, but component naming and responsibilities change (e.g. `PlantCard.jsx` → `HeroCard.jsx` + `TaskRow.jsx`; new components like `PlantSvg.jsx`, `CareAnimation.jsx`, `PersonalityVoice.jsx`, etc.).
4. Begin Task 12 implementation.
