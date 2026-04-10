# PlantCare UI Mockups

Canonical reference mockups for the PlantCare frontend. Open any `.html` file in a browser to view — they're self-contained with inline CSS and SVG, and fetch Google Fonts at runtime (Plus Jakarta Sans + Fraunces).

These are the output of the 2026-04-09 brainstorming session. The design decisions they represent are documented in full at `docs/superpowers/specs/2026-04-09-plantcare-ui-design.md` (gitignored — working spec). These HTML files are committed so you can open them at any point during implementation without re-running a brainstorming session.

## Files

### `00-aesthetic-direction-exploration.html`
**Historical — the first aesthetic selection screen.** Four direction cards (Cozy Whimsical / Modern Botanical / Playful Vibrant / Dark Terrarium) that were offered at the start of brainstorming. "Modern Botanical" was selected and became the root of everything else. Keep for context; not a design reference.

### `01-today-mobile-urgent-and-care-animation.html`
**Two iPhone 15 Pro phones side-by-side: Today screen BEFORE and AFTER tapping "Water Monty".** Plus the 5-frame care animation sequence timeline (tap → pour → morph → reward → settle) and the five personality-specific care reaction variants (dramatic / prickly / chill / needy / stoic) in a dark callout card. This is the canonical reference for:
- Today screen in urgent state (hero card visible)
- Hero card structure with Monty peeking from bottom-right corner
- Plant visual state change (wilting → thriving)
- Care animation sequence with explicit timings
- Per-personality choreography parameters

### `02-today-mobile-default-and-sweep.html`
**iPhone 15 Pro phone showing the Today screen in DEFAULT state** (no hero card — it's been swept away) plus a 3-frame transition diagram showing the fade-and-sweep sequence, edge case callouts (multi-overdue cross-fade, all-caught-up celebration, task-level care), and a Framer Motion code block showing the actual React/LayoutGroup implementation. Canonical reference for:
- Today screen in default state
- The fade-and-sweep transition choreography
- Framer Motion implementation pattern

### `03-today-desktop.html`
**Desktop Today screen inside a browser chrome frame.** Full layout with 260px sidebar (logo, nav, add-plant CTA, user avatar), main content with Fraunces italic page title, horizontal hero card (Monty at 340px with real presence), hand-drawn dashed arrow flourish, and 2-column below-hero layout (tasks left, widgets right: since-you-were-gone / jungle stats / discover picks). Canonical reference for:
- Desktop layout system
- Sidebar structure
- Fraunces display typography usage
- Widget column composition
- Editorial flourish placement

### `04-plant-states-and-care-logging-flow.html`
**Five-state plant progression strip** showing Monty at Thriving / Content / Thirsty / Wilting / Parched states with distinct SVG variants and in-character quotes for each. Plus a 4-step care-logging flow diagram (tap → API → recompute → UI) and a strip of care source chips showing MVP vs Phase 1.5 vs Phase 2 entry points (tap checkbox → iOS widget → Siri → soil sensor). Canonical reference for:
- Plant visual state system (five states, thresholds, SVG variants)
- Care logging data flow
- Multi-source care logging (CareLog.source field)

### `05-ia-and-rooms-grid-vs-isometric.html`
**Information architecture proposal** (5-slot nav: Today / House / [FAB: Add Plant] / Discover / Me) with full explanations of each slot, plus two iPhone phones comparing **Rooms Grid (MVP)** vs **Isometric House (Phase 3)**, plus a pros-and-cons comparison (grid now, Greenhouse view later as a toggle). Note: this mockup still uses "Garden" naming; the canonical name is now **House** (see spec).

### `06-auth-login-register.html`
**Login + Register single-screen forms** (two iPhone 15 Pro phones side-by-side). Same soft mint gradient background. Fraunces italic headings ("Welcome *back*" / "Join the *jungle*"). Email + password + name fields, password strength indicator on register, focus states with leaf-green border glow. No decorative leaf backgrounds — clean gradient only.

### `07-onboarding-wizard.html`
**Post-registration onboarding wizard** (five iPhone 15 Pro phones showing all 5 steps): Welcome / Rooms (preset + custom) / First plant (species selected + nickname) / Environment (3 segmented controls) / Done (celebration + Monty's first voice). Dialog-style cards on the same gradient container as auth. Progress bars at top of each card. "Skip" option on step 3 only.

### `08-plant-detail-mobile.html`
**Plant Detail mobile** — full page with portrait hero card (Monty in thriving state, Fraunces italic name), voice quote card (Fraunces italic pull-quote with leaf border-left), 4 care rings (Light/Water/Mood/Feed at 54px), 4 quick action buttons (Water primary + Feed/Photo/Diagnose), tabbed section card (History/Photos/Care/Species) with care log entries. Uses mint gradient background. **Note:** tabs + care log are wrapped in a white section card for contrast against the gradient.

### `09-care-species-tabs.html`
**Care tab + Species tab content** (two iPhone 15 Pro phones side-by-side showing different tabs active). Care tab: Room section (with "Change" affordance), Schedule rows (watering/feeding with interval + next-due), Environment segmented controls, Recalculate button. Species tab: Scientific name card (forest gradient, Fraunces italic), At-a-glance stats (Difficulty/Growth/Toxicity), Care requirements rows, Personality description card.

### `10-add-plant-sheet.html`
**Add Plant bottom sheet flow** (three iPhone 15 Pro phones). Phone 1: FAB choice sheet ("What can I help with?" — Add plant primary / Diagnose secondary) sliding over dimmed Today. Phone 2: Camera view with focus frame + AI identification result card (Monstera, 94% confidence). Phone 3: Confirm details (species mini-card, nickname input, room picker chips, environment segmented controls, "Add to garden" CTA). All using Vaul-style bottom sheets with drag handles.

### `11-sticky-header-scroll-to-top.html`
**Plant Detail scrolled state** with glass sticky header visible at top (compact plant avatar + name + "Water" quick action, backdrop-filter blur matching the dock) and scroll-to-top floating button in bottom-right (46px white glass circle with up-arrow). Portrait card has fully scrolled off; content shows voice card, rings, tabs. Demonstrates the Framer Motion `useScroll` pattern for both elements.

### `12-plant-detail-house-desktop.html`
**Two desktop browser views stacked.** Plant Detail desktop: sidebar (House active), breadcrumbs, horizontal portrait hero (Fraunces 68px "Monty" + voice quote + 380px plant SVG), quick action toolbar (primary Water + Feed/Photo/Diagnose), 2-column below (rings-only care card left, schedule card with Fraunces countdowns + recent care right), tabbed section with 2-column care log grid. House desktop: sidebar, Fraunces "Your *house*" title, Rooms/List/Greenhouse view toggle, 3×2 room cards with attention badges. Both use mint gradient on main content area.

## How to view these

Open them in any modern browser:

```bash
xdg-open docs/mockups/plantcare-ui/01-today-mobile-urgent-and-care-animation.html
```

Or serve the folder with a simple HTTP server if you want to navigate between them:

```bash
cd docs/mockups/plantcare-ui
python3 -m http.server 8080
# then open http://localhost:8080
```

## Caveats

- **CSS animations work** (drop shadow hover, the plant wilt rotation, sparkle pulses).
- **`backdrop-filter` glass blur** works in modern Chrome, Safari, and Firefox. The glass dock will render as a solid near-white fallback in older browsers.
- **SVG illustrations are inline** — no external dependencies beyond Google Fonts.
- **These are static HTML mockups, not React components.** They exist to anchor design decisions visually. The actual implementation will be React + Framer Motion + Tailwind — see the design spec for the real stack.
- **If Google Fonts fails to load**, the mockups fall back to system fonts which will look different. Use the mockups online or make sure you have network access.

## Relationship to the design spec

These mockups illustrate decisions. The **design spec is authoritative**:

`docs/superpowers/specs/2026-04-09-plantcare-ui-design.md`

If a mockup contradicts the spec, trust the spec. The spec was written after the mockups and captures the considered decisions.
