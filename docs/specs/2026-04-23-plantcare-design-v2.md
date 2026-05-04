# PlantCare — Design Baseline v2 (Web-First)

**Date:** 2026-04-23
**Status:** Draft in progress — sections 1–3 complete, sections 4–8 pending.
**Supersedes:** `2026-04-09-plantcare-ui-design.md` (mobile-first). That spec's palette, type, personality system, voice library, care animation, and data-model additions still apply. Its layout assumptions (mobile iPhone 15 Pro anchor, floating glass dock, 22–37px corner radii, desktop-as-afterthought) do not.

---

## 1. Direction Shift — Mobile-First → Web-First

### 1.1 Why we're inverting

The v1 spec drew every screen for iPhone 15 Pro first and treated desktop as an adaptation. In practice that meant:

- Desktop views were mocked for only 2 of 7 screens (Today, Plant Detail, partial House).
- Live implementation kept stretching mobile layouts across the viewport because no desktop grammar existed.
- Every ticket re-negotiated the desktop shape mid-PR (see TICKET-019 scope balloon, the iOS-glass exploration, this ticket's House pause).

Inverting to web-first means desktop becomes the **canonical design anchor**, mobile becomes the **adaptation**. One source of truth, one direction of compromise.

### 1.2 What that unlocks

- **Phase 3 Dollhouse is natively a web experience.** A 3D isometric scene wants a large canvas and pointer input. Designing for it second is why the mobile spec punted.
- **Plant management has real space to breathe.** Watering, feeding, health, photos, environment, history, schedule — the full surface fits a two-pane desktop layout without compression.
- **Encyclopedia becomes a first-class reference.** Article-reader on desktop; card-stream on mobile. PictureThis proves the SEO value of a real web encyclopedia; the rivals that don't publish one lose that traffic entirely.
- **The tamagotchi feel amplifies on web.** A browser tab left open all day = ambient presence. A plant idling in the corner you glance at, speaking up on a threshold. Mobile remains the quick-action tool; web is where the relationship lives.

### 1.2a Project stance — long indie project, all phases before launch

v2 resets the project stance entirely.

**Origin.** PlantCare exists because the author loves his plant and keeps forgetting it needs him. The app is built for people like him — attached to their plants, terrible at remembering. That's the audience. Not "forgetful millennials" as a marketing segment. Not "plant enthusiasts" as a persona. Real people who love a specific green thing and keep failing it.

**Not a product launch — a long indie build.** Phase 1 isn't the shippable MVP. All phases (1 through 3) plus a React Native mobile build complete before the app goes public. No rush. Timeline is years, not months.

**Consequences for the work:**

- **No Phase 1 scope cutting for shippability.** Full ambition stays on the table.
- **Small, product-outcome-framed tickets** for cognitive manageability, not release deadlines. Merged to `main`, iterated, refined.
- **Phases are checkpoints, not releases.** Phase 1 complete = "web app does care + personality + journal + encyclopedia + onboarding". Phase 2 = "+ AI + weather + calendar + push". Phase 3 = "+ sensors + 3D + community". Mobile = "RN app ships, feature-parity with web". Then public.
- **Competition not a factor.** Planta + Greg + PictureThis exist. PlantCare isn't trying to beat them. It's the app the author wants for himself. Audience of people-like-him is the real customer, not market share.
- **Learning stance relaxed.** v1-era concept-per-ticket React teaching is retired. Tickets assume competence. Learning happens organically through the work.

Consequence for planning: the `2026-04-10-plantcare-frontend.md` plan is **superseded** once this spec lands. New plan doc (`2026-04-23-plantcare-web-v1.md` or similar) replaces it, with tasks derived from v2's regions, jobs, game primitives, and journal system. Backend gets retasked alongside — Journal model, spaces rename, encyclopedia content pipeline, eventual Phase 2.5 LLM plumbing.

### 1.3 What stays from v1

Unchanged by the flip:

- Full colour palette (`--mint / --leaf / --emerald / --forest / --coral / --ink`, etc.) — §3.2 of v1 still authoritative.
- Typography (Plus Jakarta Sans for UI, Fraunces italic for display) — §3.3 of v1.
- Personality system — 5 archetypes (§12 of v1), per-personality animation parameters (§15.3). **All voice / scripted-copy systems retired** — personality is visual only (see §1.4 + memory `project_voice_removed_from_plan.md`).
- Plant visual states (thriving / content / thirsty / wilting / parched) — §13 of v1.
- Care animation (tap → pour → morph → reward → settle) — §15 of v1.
- Data model additions (`CareLog.source`, `Room.default_*`) — §16 of v1.

### 1.4 What gets retired or reshaped

- **All voice / scripted plant-copy systems** — retired (originally tested during TICKET-009, scrubbed across the plan 2026-05-03 per memory `project_voice_removed_from_plan.md`). **Personality shows through visuals only — across every phase.** Emoji, colour, motion, mood-coded decoration on state-change rows — never scripted lines or per-plant voice. Two surviving text moments: Step 5 welcome quote (one-off static picker) and CareConfirm dialog (already shipped). Both are *moments*, not streams. No future plant-voiced surface is planned — Phase 2.5 helper is TBD with no per-plant voice assumption.
- **Glass floating dock** (v1 §5.1 step 7) — abandoned. Mobile now uses edge-to-edge flush chrome (shipped TICKET-019). v2 codifies flush as canonical; no going back to glass.
- **22–37px corner radii on surfaces** — swept to `rounded-md` (12px) app-wide. v1 §3.4 radius table stays for decoration; surfaces default to `--radius-md`.
- **Page-canvas-over-gradient pattern** (invented TICKET-019) — stays for mobile, re-evaluated on desktop where a different container shape likely fits better.
- **iPhone 15 Pro as reference frame** — still fine for mobile callouts but stops being the starting point.
- **Terminology — locked.**
  - **"Greenhouse"** = the user's collection, the app-wide noun for "everything you care for". Replaces "jungle". Uses: `Greenhouse vitality`, "Enter your greenhouse", `your greenhouse is thriving`, etc.
  - **"Spaces"** = user's locations for plants. Replaces `Rooms` in both UI and backend model. Includes indoor (Living Room, Kitchen, Bedroom, Bathroom, Office) + outdoor (Patio, Balcony, Greenhouse the structure, Garden bed, Front yard). Backend rename requires migration.
  - **Phase 3 3D view** — name TBD. Not "Dollhouse". Candidates: Habitat / Diorama / Scene / Live view. Picked in §6.

---

## 2. Competitor Landscape

Quick audit of three adjacent products. None go web-first; per-plant personality is unclaimed.

### 2.1 Planta (`getplanta.com`)

- **Platform:** mobile-only (iOS + Android).
- **Flagship:** comprehensive management + **"Dr Planta"** diagnostic character. Watering/fertilising reminders, plant journal, light-meter tool, community sharing.
- **Personality:** app-level mascot (Dr Planta) but individual plants stay utilitarian. No per-plant voice.
- **Style:** playful-editorial hybrid; warm copy; subscription-driven.
- **What we take from it:** diagnostic tool as a distinct entry point (ties to our Phase 2 AI diagnose). Their Dr-Planta-style named helper proves character-helpers work — Phase 2.5 helper layer is TBD on our side (no per-plant voice — see memory `project_voice_removed_from_plan.md`).
- **What we avoid:** mobile-only ceiling. No real web presence.

### 2.2 Greg (`greg.app`)

- **Platform:** mobile-only.
- **Flagship:** identification → personalised care. Mascot plant character + community feed.
- **Personality:** app-level again ("Greg" the mascot), purple accent, approachable. Not per-plant.
- **Style:** playful, purple, pastel. Closest to PlantCare's lane emotionally.
- **What we take:** community-as-Phase-3 is validated; identification-as-Phase-2 is validated.
- **What we avoid:** single-mascot flattens personality. Per-plant differentiation comes through visuals (motion + colour + emoji) — never scripted voice. See memory `project_voice_removed_from_plan.md`.

### 2.3 PictureThis (`picturethisai.com`)

- **Platform:** mobile-first + **substantial web encyclopedia** (Plants A-Z, toxic plants, weeds, regional lists).
- **Flagship:** identification from photo. Encyclopedia drives SEO.
- **Personality:** none — clinical/functional interface.
- **Style:** clean, text-heavy, mobile-usability-first.
- **What we take:** web encyclopedia is table-stakes for SEO. Our Discover needs real content, not a thin library.
- **What we avoid:** clinical tone; zero emotional connection to plants.

### 2.4 Positioning

PlantCare isn't trying to win against Planta. It's an indie project with a specific audience: **people who love a plant and keep forgetting it exists**. Differentiators are what make the app *different*, not what wins a comparison table.

1. **Made for me (and people like me).** Authored from personal need. The copy reflects it. Honest about plant-parent failings. Conversational, self-aware, slightly irreverent. Not corporate.
2. **Web-first.** Every rival is mobile-first or mobile-only. A real desktop plant-management app is open ground. (RN mobile follows later; all phases ship together before going public.)
3. **Per-plant personality through visuals.** Every plant has visible mood via motion + colour + emoji. Rivals have app-mascots; ours is per-character. Personality is visual-only — never scripted lines (memory `project_voice_removed_from_plan.md`).
4. **Game loop with stakes.** Care consistently or decline sets in. Streak, mood, per-plant health, greenhouse vitality, rescue missions. Retention through genuine attachment, not push-notification guilt.
5. **3D Habitat-style view (Phase 3, name TBD).** Nobody else is doing isometric room-aware rendering of your collection. The north-star moment.
6. **Journal as the long arc.** Your relationship with your plants, recorded over time. User writes; system marks events visually. Nobody else has this. (No plant-voiced journal entries — see memory `project_voice_removed_from_plan.md`.)

---

## 3. Product Surface — Six Regions

Renaming + phasing locked now so layout work has fixed targets.

### 3.1 The seven regions

| # | Name | Primary job | Mental model |
|---|---|---|---|
| 1 | **Today** | Care mode. What needs me right now? | Dashboard — ambient, personality-forward. Hero when urgent, calm when caught up. |
| 2 | **House** | Plant management. Browse, organise, add, move, retire. | Two-pane browser — list on left (or grid), detail on right. Dollhouse in Phase 3. |
| 3 | **Plant Detail** | Single-plant deep dive. | Portrait + timeline + tabs (incl. Journal). Reached from House or Today, not a top-level nav item. |
| 4 | **Journal** | Interleaved user + plant entries. The tamagotchi spine. | Chronological feed, filterable by plant / mood / author. Archive + reader + composer. |
| 5 | **Encyclopedia** | Species library + care guides + troubleshooting + tips. | Reference reader. Article-style on desktop, card-stream on mobile. Renamed from "Discover" for clarity. |
| 6 | **Me** | Profile + settings + billing + devices. | Quiet admin. No personality chrome. |
| 7 | **Add Plant** | Creation flow. | FAB / keyboard-shortcut entry on web; bottom sheet on mobile. Onboarding is a longer cousin of this flow. |

**Supporting flows** (not top-level nav): Auth, Onboarding, Add Plant dialog, Care Confirm dialog, Diagnose flow (Phase 2).

**Personality** is cross-cutting, not a region. Surfaces visually on Today (hero mood + decoration), Plant Detail (mood + motion), Add Plant Step 5 welcome quote (one-off static moment), Encyclopedia species pages (personality paragraph), Dollhouse mood signals. No plant-voiced copy anywhere — see memory `project_voice_removed_from_plan.md`.

### 3.1a Active framing — the governing principle

Planta's homepage offers jobs: "Get help with a sick plant", "Get water and care reminders", "Identify a plant". Each entry is a named user goal. The app presents itself as *offering* things. Ours currently *displays* things — a dashboard of data that monologues at the user. That's why v1 feels flat.

**v2 rule:** every screen offers jobs, not data. Entry points are named verbs with visual personality decoration (no scripted voice copy — see memory `project_voice_removed_from_plan.md`). "Here's what I can help with right now" beats "here's what you own". Data still exists — it's the reward of picking a job, not the main content.

**Consequences that propagate through §§4–5:**

- Today gains a **jobs rail** above the rituals list. Each card is a named-verb action with mood-coded visuals — "Water Monty · 3 days overdue" (factual copy + coral ring + droop animation), never voice-lined.
- **FAB = "Add a plant" only.** Single dedicated action, not a menu. Tap = opens Add Plant bottom-sheet (mobile) / modal (desktop). Keyboard shortcut `N`. Present on every screen for muscle-memory access. The `+` icon reads "add" unambiguously. Jobs rail handles multi-action breadth; radial wheel handles per-plant rich actions; FAB handles the one primary universal action.
- **Onboarding asks intent first.** New Step 0: "What brings you here?" — forgetful waterer / plant-parent / sick-plant saver / learning-as-I-go. Answer seeds Today's default jobs rail + tip prompts. Lightweight segmentation, no feature gates.
- **Sidebar grows shortcut jobs** beneath the region nav — not another nav layer, but one-tap entries to common verbs (Water something / Log care / Take a photo).
- **Plant Detail gains per-plant job shortcuts** — Feed · Check mood · Take photo. Mood decoration via personality visuals (motion + colour + emoji). No plant-voiced copy.

### 3.1b Canonical jobs-to-be-done

Pinning the list now so jobs-rail content is a vocabulary, not ad-hoc copy per screen. Grouped by verb-family.

**Copy rule:** job-card copy is factual + user-focused. Personality shows through visual decoration (mood emoji, colour, micro-motion). Never voice-lined — we don't write "Monty's begging for water" on a button. Factual framing is fine to include the plant's name ("Water Monty"), the fact state ("3 days overdue"), and optional mood-coded decoration (coral ring, droop animation).

| Group | Job | Card copy | Visual decoration | Phase |
|---|---|---|---|---|
| Care | Water a plant | "Water Monty · 3 days overdue" | Coral ring if overdue, mood emoji, droop if dramatic | 1 |
| Care | Feed a plant | "Feed Fernie · due today" | Mint ring, mood emoji | 1 |
| Care | Log care manually | "Log something you did" | Neutral | 1 |
| Care | Move a plant to a new room | "Move a plant" | Neutral | 1 |
| Care | Retire a plant | "Say goodbye" | Neutral | 1 |
| Create | Add a plant | "Meet a new plant" | Leaf accent | 1 |
| Create | Take a photo | "Take a photo" | Neutral | 1 |
| Create | Identify a plant | "What's this plant?" | Neutral | 2 |
| Diagnose | Diagnose a sick plant | "Something's wrong" | Coral accent | 2 |
| Learn | Browse species | "Browse the library" | Neutral | 1 |
| Learn | Find a care tip | "Look up a care tip" | Neutral | 1 |
| Learn | Find similar plants | "Plants like this one" | Neutral | 1 |
| Reflect | Review streak | "See your streak · 7 days" | Sunshine accent | 1 |
| Reflect | Write in the journal | "Write a journal entry" | Neutral | 1 |
| Reflect | Read the journal | "Catch up on the jungle" | Neutral | 1 |
| Reflect | Ask a plant (bot) | "Ask a plant" | Personality emoji of active plant | 2.5 |
| Reflect | Weekly recap | "Weekly recap" | Neutral | 2 |

**Rule:** never invent a new job in a screen without adding it here first. Jobs are a closed vocabulary; free-form actions lose the active-framing cohesion.

### 3.1c Tone north stars

Five adjectives anchoring every design decision. If a choice doesn't serve at least two, it's not PlantCare.

1. **Big.** Ambitious surface, not a lean MVP attitude. More room, more content, more moments than the rivals offer. Don't shrink to fit.
2. **Fluid.** Motion-rich, reactive, layout responds to user. Animations are intentional (care payoff, state changes, personality reactions) — not decorative garnish, but not absent either.
3. **Customisable.** User shapes Today. Widget column reorderable. Intent-driven defaults. Theme variants (Phase 2+). Not a rigid template.
4. **Personal.** Intent-routed onboarding. Per-plant *visual* personality. Greeting adapts to time, streak, collection size. Feels like your jungle, not PlantCare's demo.
5. **Funny & entertaining.** Plants are characters — expressed through **visuals, motion, and state reactions**, not scripted copy. A dramatic Monstera droops harder, a stoic snake plant barely moves, a needy fern wiggles excitedly on watering. Empty states carry mild humour in the UI copy (not voiced-by-plant). Errors are clear, not voiced. Comedic timing lives in animation, not text streams.

**What these collectively mean:** PlantCare is closer to a Wes Anderson film about plants than a to-do list app — but the film is in the camera work, not dialogue. Lean into it.

### 3.1d Companion + game — the dual positioning

Two halves, one app.

**Companion half — Planta-adjacent, helpful + warm.** Modular entry points. Reminders, diagnostics, species library, care tips, light meter. Tone is never scolding. A missed week reframes as "Monty had a rough stretch, here's how to rebuild" — not "you failed". Utility breadth matches Planta feature-for-feature by Phase 2.

**Game half — tamagotchi loop with stakes.** Neglect has visible consequences; care has visible payoff. Users return daily to maintain progress. Stakes without cruelty — no permadeath, no plants lost, just decline and recovery. Closer to Duolingo streak mechanics than Tamagotchi death. Hooks: daily streak, per-plant health score, jungle-vitality aggregate, rescue missions for critically-overdue plants, weekly recap.

**Why both work together.** The companion half makes the utility real — user trusts the app with actual plant lives. The game half makes interaction consistent — user returns daily because progress slips without them. Fun + serious, not fun-over-serious.

### 3.1e Game primitives

Lock the mechanics now so layouts reserve slots for them.

| Primitive | What it is | Degradation | Recovery | Phase |
|---|---|---|---|---|
| **Per-plant mood** | 5-state (thriving → parched). Already built in v1 §13. | Time since last care. | Care action. | 1 |
| **Per-plant health score** | 0–100 per plant. Rolls up mood history + photo cadence + overdue incidents. Surfaced as a ring on Plant Detail. | Slow decay on neglect, sharp drop on missed thresholds. | Consistent care over weeks. | 1 |
| **Streak** | "Days attended to jungle". Anything logged counts (care / photo / journal / note). | Resets after a full day of zero activity. One grace day per rolling week. | Rebuild from zero. | 1 |
| **Jungle vitality** | Aggregate health across collection. Big number + ring on Today. | Average of per-plant health. | Collective care. | 1 |
| **Rescue mission** | Auto-created ritual when a plant hits parched. Multi-step: water + log + schedule + optional photo + optional journal entry. Marked "rescue" on Today. | — (degradation triggers creation) | Complete all steps → plant back to content, streak tick if eligible, celebratory animation. | 1 |
| **Milestones** | 7 / 30 / 100 / 365 day anniversaries per plant. Anniversary per-collection. | — | Auto-created journal system event + subtle on-screen moment. | 1 |
| **Weekly recap** | Summary of the week: care actions, mood changes, best/worst day, trending plants. | — | Auto-generated Sunday evening. Appears as a Today widget slot. | 2 |

**No permadeath in Phase 1.** "Parched" is the worst state. Parched plants trigger a rescue mission rather than being removed. Only user-initiated "retire" removes a plant.

**Streak grace rule.** One skip-day per rolling 7 days. Prevents single-bad-day from punishing a multi-month streak holder. Mobile notification on grace-day-burned.

**Customisation hook.** Power users in Phase 2+ can tune difficulty — toggle grace days, pause mode during holidays, strict mode for "real stakes". Default is forgiving.

### 3.1f Scope — indoor + outdoor plants

PlantCare supports both house plants and outdoor plants. Phased rollout:

**Phase 1 (lite outdoor support):**

- Space model expanded. Presets cover indoor + outdoor. User can have plants anywhere.
- Species model gets `habitat` tag: `indoor | outdoor | both`. Seeded from Perenual + manual overrides.
- Care scheduling identical for outdoor plants (watering + feeding intervals). No weather awareness yet — user applies their own judgement about rain.
- UI surfaces handle both without fuss. Plant Detail environment section shows the same three controls (light / temperature / humidity).

**Phase 2 (weather-driven outdoor):**

- Weather API integration (Open-Meteo free-tier candidate; OpenWeatherMap if reliability demands).
- **Rain-aware watering** — outdoor plants skip scheduled water if local rain in last 24h or forecast in next 24h. Task row renders as "Skipping — rain expected" with an option to override.
- **Frost alerts** — tender outdoor species get push nudges when forecast drops below their tolerance threshold.
- **Seasonal intensity** — care frequency shifts with season (less water in winter, more in summer heat).
- **Calendar widget on Today** — upcoming week's care plan, weather-aware. Becomes a signature Phase 2 feature.
- Species gets expanded fields: `min_temp_c`, `max_temp_c`, `frost_tender` boolean.

**Phase 3 (sensors + full outdoor):**

- Soil moisture probes wire into outdoor plants first-class.
- Weather + sensor combined decisions: "your Patio soil read 28% moisture yesterday and it rained last night, skipping today's watering".
- Diorama/Habitat view (name TBD §6) extends beyond the house — outdoor plants appear in their actual space.

**Terminology consequence.** "Greenhouse" as collection noun covers both indoor and outdoor plants — it's metaphor, not literal architecture. "Spaces" covers both literal rooms and outdoor areas — the noun stays uniform.

### 3.1g Today = collection-first, not hero-first

v1 framed Today around a single urgent plant (hero card dominates). v2 pivots:

- **Default Today = "your greenhouse is alive".** All plants visible at once. Desktop = horizontal strip / grid. Mobile = scrollable row. Each plant rendered with its current mood (motion, colour, emoji).
- **Urgent plants get a coral ring around the avatar**, not a massive hero card pushing everything down.
- **Hero card still exists for emergencies** — rescue mission triggered, critical plant — but as one surface among several, not the whole header.
- **Nintendo-pets feel** — many characters on one screen, each alive with personality. Bigger the collection, richer the view.
- Interactions scale — 3 plants all visible, 30 plants grouped by space with scroll, 300 plants paginated with a "browse" deep-link.

Implications for layout grammar (§4):

- Today desktop has a wide plant-strip or plant-grid slot near the top.
- Today mobile top section becomes a horizontal scrollable row of plant chips.
- Hero-card slot is conditional + secondary, not primary.

### 3.1h Intent-adaptive onboarding

Onboarding is one wizard with per-intent adaptation. `User.onboarding_intent` is captured at Step 1 and drives copy / emphasis / optional skips through the rest of the flow.

**Four intent paths:**

| Intent | User profile | Onboarding emphasis |
|---|---|---|
| **Forgetful waterer** | Has plants, forgets to care | Fast setup. Multi-add plants. Stakes promoted — "reminders + streak are your friend". |
| **New plant parent** | Just getting started | Handholding. Slow, educational. Walks through each space. Explains every primitive. |
| **Sick plant saver** | One ailing plant, urgent | Skip or single-add. Primary post-onboarding action = Diagnose, not Today dashboard. Stakes demoted. |
| **Learning as I go** | Curious browser, may not own plants | Gallery-first. Optional add. Encyclopedia-forward. Stakes demoted. |

**Base 8-step shell:**

| # | Step | Notes |
|---|---|---|
| 0 | Welcome | Shared. Brand moment. |
| 1 | Intent | Four cards. Shared. |
| 2 | Spaces | Presets + custom. Shared (copy varies). |
| 3 | Plants | Multi-add loop. Content + copy varies per intent. Sick-saver may single-add. |
| 4 | Environment | Per-space. Copy varies. |
| 5 | Stakes | Promoted / demoted depending on intent. May be skipped. |
| 6 | Journal seed | System events created. Varies in emphasis. |
| 7 | Welcome home | Payoff. CTA routes vary: Enter greenhouse / Diagnose / Explore library. |

**Per-intent step matrix (copy + skips):**

| Step | Forgetful | New parent | Sick plant | Learning |
|---|---|---|---|---|
| 2 Spaces | Fast preset grid | Walk-through w/ explanatory copy | Fast preset grid | Skippable or minimal |
| 3 Plants | "Add the plants you already have" — multi-add default | "Pick your first plant(s)" — easy-care gallery surfaces | **Skip or single-add** — we're here to diagnose | "Meet some species" — gallery-first, multi-add optional |
| 4 Environment | Batch-set, default-pre-filled | Walk through each space explaining why we ask | Batch-set or skip | Same as new parent |
| 5 Stakes | **Promoted** — streak + vitality as core | Soft — "here's what we track" | **Skipped** — focus on recovery | **Skipped** — focus on browsing |
| 6 Journal seed | Quick create + nudge | Explains what journal is | Skip or auto-create w/ rescue framing | Quick create |
| 7 Welcome home | "Enter your greenhouse" | "Enter your greenhouse · take your time" | "Let's check on that plant" → diagnose flow | "Enter your greenhouse" + "Explore the library" |

**Implementation.** One wizard component. Per-intent config object drives content + skips + CTA targets. No branching routes; `User.onboarding_intent` persists for future in-app use (suggested defaults, prompts, widget priority order).

### 3.1i React Native parity — portability rules

All phases complete + RN mobile shipped before public launch. Design decisions now must translate to an eventual RN build without re-architecting.

**Portability constraints to build under:**

- **No hover-required states.** Touch-first affordances. Web can layer hover enrichment on top but core interaction works on tap.
- **Animation via `motion/react` → `motion/react-native`.** Framer Motion's RN port. Patterns translate directly. Avoid pure-CSS keyframes (those don't port); prefer JS-driven animation via Motion.
- **Flex over grid for portable layouts.** Flexbox is RN-native. CSS grid is web-only. Reserve grid for desktop-exclusive views (widget rail, multi-column Encyclopedia) that won't have RN equivalents.
- **No `dvh` / `lvh` / `100vh`.** Web-only units. Use flex containers sized to their parent instead.
- **Abstract font tokens.** Web uses `@fontsource` imports; RN embeds font files. Tokens (`--font-sans`, `--font-display`) + a platform-specific loader keeps the API uniform.
- **No inline SVG for plant illustrations.** Web can render inline SVG; RN needs `react-native-svg` or raster assets. Plant portraits should be CDN-delivered raster (WebP on web, PNG on RN) with SVG-compatible library fallback if we want crispness.
- **Portals with care.** Dialog, Toast, LandscapeLock use `position: fixed` + z-index stacking. RN equivalents exist (`react-native-modal`, `react-native-reanimated` for sheets) but they don't share DOM rules. Design these primitives with a portable API — props-in, render-out — and swap internals per platform.
- **Navigation: routes ↔ tabs.** Web uses `react-router`. RN uses `@react-navigation/native` + bottom tabs + stack. The seven regions (Today / House / Journal / Encyclopedia / Me + Plant Detail / Add Plant as pushed screens) map cleanly to both. Keep the URL structure and the tab structure isomorphic.
- **FAB on web, bottom-tab centre-button on RN.** Add-plant entry is a FAB on web; becomes a raised centre tab button on RN. Behaviour identical (opens dialog/sheet).
- **Gesture support.** Drag-to-dismiss on Dialog sheets is Framer Motion drag on web, `react-native-gesture-handler` on RN. API from consumer side: `draggable` prop. Internals differ.

**Rule:** if a web pattern can't port, justify it as desktop-exclusive (wide rail, multi-column article reader, FAB) or don't build it. The constraint forces cleaner abstractions.

### 3.1j Plant Doctor + Care Tips

Entry-point feature, not a region. Two related but distinct surfaces: **Doctor** (reactive — something's wrong) + **Tips** (proactive — how to do better).

**Plant Doctor — symptom → tailored summary**

User has a sick plant. Opens Doctor flow. Picks symptoms. Gets a **concise summary of care adjustments** — not a wall of articles.

Entry points:

- **Radial wheel spoke** — new spoke on the action wheel, replaces one of the less-used spokes (e.g. swap "Move" to a context menu; "Doctor" takes that slot). Long-press plant → wheel → 🩺 Doctor.
- **Today job card** — "Something's wrong" jobs-rail card opens the flow, plant picker first.
- **Plant Detail CTA** — "Not looking good?" link near the care rings, scoped to that plant.
- **Encyclopedia nav** — "Doctor" section listed alongside species library for browse-first users.

The flow:

1. **Pick symptoms** — multi-select checklist: *yellow leaves*, *drooping*, *brown tips*, *soggy soil*, *pests*, *slow growth*, *root issues*, *something else*. Mobile = bottom sheet. Desktop = modal.
2. **Generate summary** — app produces a **short, tailored care-tips list** (5–8 bullets max) combining symptom analysis + plant's current care state + species-specific guidance. Surface looks like a Journal entry — small paper card with bullets, not a scroll-through article.
3. **Action buttons**:
   - **Apply to schedule** — auto-adjusts watering / feeding intervals based on recommendations (optional, user confirms)
   - **Log this** — creates a Journal system event: "Doctor visit: yellow leaves + soggy soil — reduced watering to 10-day interval"
   - **Dismiss** — close without changes
4. **Phase 2 AI extension** — same shell, but LLM can take a photo + generate richer/more contextual summary. Falls back to templated summary when offline or free-tier.

Design rule: **summary over archive.** User came because their plant is sick; don't make them scroll through three Encyclopedia articles. Give them the condensed answer.

**Care Tips — proactive guidance**

Lives alongside the plant, not behind a dedicated flow:

- **Plant Detail → Species tab** — species-specific care tips (light, water, humidity, common issues, watch-outs). Shown as a card stack, one tip per card.
- **Today → jobs rail** — "Find a care tip" card opens a random/contextual tip relevant to user's collection.
- **Journal milestone trigger** — 30-day/100-day anniversaries auto-surface a "level up" tip via a system journal entry.
- **Weekly recap** (Phase 2) — bundled with the weekly summary.
- **Doctor flow output** — the summary IS a set of care tips, contextualised to the symptoms picked.

**Content model addition:**

```
CareTip
  id
  scope       enum { species, issue, milestone, general }
  species_id  (nullable — when scope = species)
  issue_key   (nullable — yellow_leaves, root_rot, etc.; when scope = issue)
  title       string
  body        text (markdown, <= ~200 words)
  apply       jsonb (optional — schedule adjustments this tip can auto-apply)
```

Tips are authored + reviewed content (not user-generated in Phase 1). Phase 3 opens community tips with moderation.

**Phase placement:**

| Phase | Doctor | Care Tips |
|---|---|---|
| 1 | Symptom picker → templated summary (combines symptom + plant state + static tips) | Species-tab stack + job-rail entry + milestone-triggered |
| 2 | AI photo diagnosis + richer summary | Weekly recap bundling + contextual prompts |
| 2.5 | (TBD — Phase 2.5 helper layer scope removed; redesign needed — see memory `project_voice_removed_from_plan.md`) | LLM-personalised per user's collection |
| 3 | Community-shared recovery stories | Community-contributed tips |

**Action-wheel update.** The radial wheel's 6 spokes are now: 💧 Water · 🌱 Feed · 📷 Photo · ✎ Note · 🩺 Doctor · ⌂ Move. Dropped "Open" (tap-without-long-press = open plant). Doctor spoke slots in.

### 3.1k First-run arc — onboarding + driver.js + first care-log as one continuous journey

Onboarding is not isolated. It's one stage of a continuous first-run arc that ends when the user closes their first care loop. Design all three stages together.

**The arc (total ~4 minutes):**

| Stage | Surface | Job | Duration | Emotional beat |
|---|---|---|---|---|
| Register | Auth page | Create account | ~30s | Signing up |
| Onboarding 0–7 | Full-page wizard (desktop) / full-screen (mobile) | Capture intent · gather data · introduce concepts | ~2–3 min | "It's listening" |
| Today landing | Dashboard | Show the greenhouse alive | ~2s | "Here's my jungle" |
| **Driver.js tour** | Today + spotlight overlay | Guide first actions | ~30s | "Now I know what to do" |
| First care-log | Tap ritual → swipe → commit | Close the loop | ~3s | "Oh, I get it" |
| **First-run celebration** | One-shot overlay | "That's how it works" | ~2s | Loop locked |

**Rule:** every stage hands off to the next with continuity. User's intent from step 1 shapes the driver.js tour. User's first-logged plant shapes the post-tour message.

**Driver.js tour — intent-adaptive spotlight sequence:**

| Intent | Tour length | Spotlights |
|---|---|---|
| 🌵 Forgetful | 5 stops | greeting → today's rituals → swipe hint → FAB → bell (organiser) |
| 🌱 Just starting | 7 stops | greeting → jobs rail → rituals → swipe hint → collection strip → calendar → bell |
| 🤒 Sick plant | Skips Today tour | Redirects directly to Doctor flow; 2-stop tour inside Doctor: symptom picker → summary |
| 📚 Browsing | 3 stops | greeting → Encyclopedia link → greenhouse strip |

Each spotlight: dimmed background + bright hole at target element + tooltip card (title + one-line explanation + Next / Skip / Done).

**Dismissable.** User can Esc/tap-outside to skip at any time. Progress within tour tracked on `User.onboarding_tour_completed_at`. Manual replay from Me region.

**First care-log completion overlay:**

When user completes their first ritual (first swipe-to-complete or first wheel-water), show a one-shot Vaul-style bottom-sheet / centred modal celebrating:

- Plant name: "Monty's watered."
- Streak tick: "Streak · Day 1" with ring filling animation
- Vitality sparkle: collection vitality ticks upward
- One-line: "That's how the rest of it works. The app's yours now."
- Single CTA: "Back to Today"

This is the moment first-run is *complete*. Everything after is normal app use. `User.first_care_logged_at` is set; celebration only shows once.

**Micro-tip pattern (threaded throughout onboarding):**

Each onboarding step has one Fraunces-italic aside at the card bottom — educational without preachy. One sentence, ≤20 words.

| Step | Sample tip |
|---|---|
| 2 Spaces | *"Plants like staying put. Moving them stresses them out."* |
| 3 Plants | *"Start small. Three plants well-kept beats ten forgotten."* |
| 4 Environment | *"Rough is fine. We'll refine the schedule as you care."* |
| 5 Stakes | *"A streak isn't a ball and chain. Miss a day, nothing breaks."* |
| 6 Journal | *"The plants notice. You'll want to record what you notice back."* |

**Payoff moments across onboarding:**

Every step produces visible feedback for the user's actions:

- Step 3 Plants: added plants appear as chips with stagger animation. On desktop, a mini "greenhouse preview" strip shows the collection growing.
- Step 4 Environment: schedule auto-calculates + displays as user picks values. "Water every 7 days · Feed every 30 days" updates live.
- Step 5 Stakes: streak ring fills to Day 1 with ease-out animation on step load. Vitality ring fills 0→100%.
- Step 7 Welcome home: added plants orbit the centre hero as floating avatars, staggered reveal.

**Persistence — commit per advance:**

Onboarding state persists server-side as the user advances through steps. Refresh lands on the last unfinished step with state intact.

| Step | Commits on advance | Server record |
|---|---|---|
| 1 Intent | `User.onboarding_intent` | user scalar |
| 2 Spaces | Array of Space records | one per chip |
| 3 Plants | Array of Plant records | one per chip (inline on add/remove, not batched on Continue) |
| 4 Environment | `Space.default_light/temperature/humidity` | updates spaces |
| 5 Stakes | (info-only, nothing committed) | — |
| 6 Journal | (explanatory — entries already auto-created for plants) | — |
| 7 Welcome home | `User.onboarded_at` | completion flag |

**Track progress:** `User.onboarding_step_reached` (integer). On `/welcome/:step?` load, client reads the flag → redirects if direct URL mismatches.

**Search query doesn't persist.** Step 3's search input resets to empty on reload. Only the added chips (Plant records) restore.

**Edge cases:**

- User leaves mid-step, returns next day → resumes at `onboarding_step_reached`.
- User abandons onboarding entirely → `User.onboarded_at IS NULL` → next login redirects to `/welcome`.
- User back-buttons mid-wizard → browser history works per-route.
- Network fails on chip add → optimistic UI with rollback on failure.

**Intent affects downstream rendering:**

After Step 1 selection, app shows a preview line explaining what changes. This isn't cosmetic — `User.onboarding_intent` actually shapes:

- Onboarding subsequent step copy + skips (per §3.1h intent matrix)
- Driver.js tour length + focus (per §3.1k tour variants)
- Post-onboarding landing destination (Today / Diagnose / Encyclopedia)
- In-app defaults (widget priority order, notification cadence, suggested jobs)

The preview makes this visible to the user at decision time — no buried mechanics.

**Per-intent app behaviour — concrete mechanics:**

| Behaviour | 🌵 Forgetful | 🌱 Just starting | 🤒 Sick plant | 📚 Browsing |
|---|---|---|---|---|
| Post-onboarding landing | Today | Today | **Doctor flow** | **Encyclopedia** |
| Driver.js tour | 5 stops | 7 stops (longer handholding) | 2 stops (inside Doctor) | 3 stops (Encyclopedia-first) |
| Push notifications | **Prompt on first visit** — sign user up for daily nudges | Prompt after ~3 days of use, soft ask | Skip — user's focus is diagnosing | Don't prompt — not invested yet |
| Today widget priority | Rituals > Greenhouse > Calendar > Journal | Jobs rail > Rituals > Greenhouse > Calendar > Journal | N/A (redirected) | Encyclopedia featured · Greenhouse minimal |
| Streak ring prominence | **Large + always visible** | Small · tooltip explains what it is | Hidden until first care-log | Hidden |
| Species suggestions on Step 3 | Popular mix | **Easy-care only** (Pothos, Snake, ZZ — Perenual difficulty ≤ 2) | Single-plant add — their worried plant | Gallery-first, big variety |
| Schedule intervals | Default | **More conservative** (+2 days on intervals — "less water than you think") | Default for the one plant | N/A until plants added |
| First-7-day tooltips | Minimal | **"Did you know" tips on Today** — rotating micro-education | No | No |
| Rescue mission trigger | Normal threshold | Normal threshold | **Auto-raised on Day 1** for the worried plant | N/A |
| Jobs rail default order | Water · Feed · Photo · Add · Journal · Doctor | Diagnose hidden initially · Feed · Water · Photo · Journal · Browse | Doctor first · Water · Add | Browse first · Add · Photo |

**Implementation notes:**

- Behaviours compile from a single `INTENT_PROFILES` config object on the backend (hash of intent → settings), applied via `current_user.intent_profile.widget_priority` etc.
- User can change intent at any time from Me → Preferences. Triggers a re-render of Today widget order.
- Per-intent config is overlay, not override — user manual preferences (widget order, notification settings) take precedence once set.

**Copy for intent-preview line (per selection):**

| Intent | Preview line |
|---|---|
| Forgetful | *"We'll nudge you daily and route you straight to rituals."* |
| Just starting | *"We'll walk you through slowly and start with easy-care plants."* |
| Sick plant | *"We'll drop you at the Doctor after setup to check on that plant."* |
| Browsing | *"We'll bring you to the Encyclopedia first. Add plants any time."* |

Short, Fraunces italic, appears below grid as user selects. Updates dynamically per choice.

**Copy tone — warm + caring across all stages:**

- Not corporate. Conversational.
- Honest about plant-parent failings ("Forget sometimes — it's allowed").
- Respect user choices ("Skip for now", not "You should really do this").
- Never guilt.
- Humour lands in empty states + unexpected moments, not in instructions.

### 3.2 Phase × Region matrix

What each region holds at each product maturity. Locks slot allocation now so we don't retrofit later.

| Region | Phase 1 (MVP) | Phase 2 (push + AI) | Phase 2.5 (AI helper layer — TBD, no plant voice) | Phase 3 (sensors + Dollhouse) |
|---|---|---|---|---|
| **Today** | Hero + since-ribbon + jobs rail + rituals + progress + latest-journal widget | Adaptive scheduling tweaks task timings · push nudges surface here | TBD helper layer surface (no plant-voiced copy) | Weather band under header · sensor-logged care lands in since-ribbon automatically |
| **House** | Rooms grid + flat list + search + filter + customisable grid density | — | — | **Dollhouse 3D view** as third toggle · room-aware plant rendering |
| **Plant Detail** | Portrait + rings + care/species/journal/history tabs + photos + per-plant job shortcuts | AI diagnose CTA (camera → result → optional CareLog + journal entry) | TBD helper layer surface (no plant-voiced speech bubbles) | Sensor readings inline · weather-adjusted next-due · device pairing card |
| **Journal** | User-composed entries + system events (visual decoration only, no plant-voiced copy) · archive feed · per-plant filter · mood filter | Auto-entries on AI diagnose · auto-entries on AI identification (global / system entries) | TBD helper layer surface (no LLM-generated plant entries) | Sensor-triggered entries (system marker, no plant voice) · automation-triggered entries |
| **Encyclopedia** | Species library + care guides + tips articles · card-grid + article reader | AI identification (no add) · camera entry | TBD helper layer | Community care journals · shared tips · trending species |
| **Me** | Profile + password + logout + basic prefs + streak | Notification preferences · push subscription management | **Billing** (bot + LLM journal is paid) · subscription tier · usage meter | **Devices hub** — paired soil probes, weather hooks, automation webhooks |
| **Add Plant** | Species search → env questions → save · seeds first journal entry ("Day 1. Interesting pot.") | Camera-first AI identification · confidence bar · fallback to search | Bot nudges on stuck fields ("not sure which room? ask your Monstera") | — |

**Key phasing decisions locked by this matrix:**

- **Journal is Phase 1.** Templated plant-authored entries from day one. Without it, v2's tamagotchi framing falls flat — plants need to speak over time, not only on the hero card. LLM upgrade in 2.5 is upgrade-path, not prerequisite.
- **Jobs rail on Today is Phase 1.** Active framing only works if users see named jobs from first visit.
- Me grows the most across phases — billing in 2.5, devices hub in 3. Its layout must accommodate a settings-navigation pattern from Phase 1 even if Phase 1 only uses two sections.
- Today gets the most cross-phase additions. Its layout needs a **widget-rail slot** from Phase 1 that's empty or sparse initially, filled progressively. User-customisable widget order is a Phase 1.5 ambition — grammar should anticipate it.
- House gets one big Phase 3 addition (Dollhouse). The **view-mode toggle must be a first-class control from Phase 1**, not bolted on later — it's already built in TICKET-010 w/ Greenhouse as disabled option.
- Plant Detail's **journal tab** is the natural home for Phase 2.5's bot entries. Tab exists Phase 1 with templated content; LLM swaps in without UI churn.
- Encyclopedia Phase 1 needs enough content to feel like a real reference, not a placeholder. This is a **content commitment**, not just a design decision — flag it for the backend roadmap.

### 3.2a The Journal — cross-cutting spine

Journal is the narrative glue that threads personality across time. User writes the story; plants appear in the story via **visual system events** only (timestamped markers with mood-coded decoration). No plant-voice copy — ever — see memory `project_voice_removed_from_plan.md`.

**Phase 1 authorship model:**

- **User entries** — free-form text + optional photo + optional plant-tag. Mood tag optional. This is the primary content.
- **System events** — auto-logged timeline markers at key moments. Not voiced; decorated with mood emoji + colour + plant personality icon. Visual, not spoken.

**System event triggers (Phase 1):**

| Trigger | Fires when | Rendered as |
|---|---|---|
| Care threshold crossed | Plant moves content → thirsty → wilting → parched (or reverse) | Row: personality emoji + plant name + state change badge + timestamp. Coral tint if worsening, leaf tint if recovering. |
| Care logged | Water / feed / photo action saved | Row: icon + "You watered Monty" + timestamp. Neutral decoration. |
| Time elapsed | Day 7 / Day 30 / Day 100 / anniversaries | Row: milestone badge + "Monty has been with you for 30 days". Sunshine accent. |
| Social | New plant joins | Row: "Fernie joined the collection" + thumbnail. |

System events never write voiced copy. They're visual timeline markers. The *user* supplies narrative by writing their own entries alongside.

**Phase 2.5 upgrade — TBD helper layer.** Plant-voiced framing was retired 2026-05-03 (see memory `project_voice_removed_from_plan.md`). Whatever ships in 2.5 must not assume plant-authored entries; redesign needed.

**Shape of a journal entry:**

```
JournalEntry
  id
  plant_id         (nullable — some entries are global/system)
  author_type      enum { user, system, plant }   # plant = Phase 2.5+
  trigger          enum { care_threshold, care_logged, time_elapsed,
                         social, milestone, manual }
  body             text        (null for system events — they render from trigger + metadata)
  mood             enum { thriving, content, thirsty, wilting, parched, neutral }
  image_id         (nullable — can attach a photo)
  created_at       datetime
```

**Surfaces:**

- **Dedicated Journal region** (§5, region 4) — three views:
  - **Entries** (default) — chronological feed of user + system entries
  - **Album** — masonry grid of every photo across the collection, clickable to its entry. Filterable by plant, date range, mood
  - **By plant** — per-plant stream filter
- **Plant Detail Journal tab** — per-plant stream. Care-log rows + journal entries + photos interleave in chronological order.
- **Today widget** — "Latest from your greenhouse" — 2–3 freshest entries or most recent photo.
- **Onboarding Step 6** — first system events ("Monty joined your greenhouse · Day 1") land immediately with optional compose nudge. No templated plant voice.

**Photo / album binding.** Photos are first-class journal citizens. When a user uploads a photo:

- With a note → creates `JournalEntry { author_type: user, body, image_id }`
- Photo-only → creates `JournalEntry { author_type: system, trigger: photo_taken, body: null, image_id }` rendered as "You photographed Monty · Day 47"

Album view = all entries where `image_id IS NOT NULL`. Phase 2+ opens "Before/after" comparisons — pick any two photos for the same plant, see the timeline between them. Photo model (`PlantPhoto`) already exists in backend from Phase 1 v1; Phase 1 v2 merges it into `JournalEntry` or links via FK — implementation detail for new plan doc.

**Community gateway (Phase 3+).** Journal is the natural on-ramp to social features. Once the stream exists and users attach photos + narrative, the following open up without new models:

- **Shareable entries** (opt-in per entry) — public URL, plant/person anonymisable
- **Jungle pen-pals** — find users with overlapping species or local climate
- **Recovery stories** — community thread of parched→thriving rescues
- **Community species tips** — annotated on Encyclopedia pages

Not scoped in Phase 1. Worth design-room now because opt-in sharing affects how entries are stored (privacy flags on `JournalEntry`).

**Tone discipline.** Plant-voiced LLM entries removed from scope (see memory `project_voice_removed_from_plan.md`). Phase 1+ keeps the stream user-authored + system-event-decorated; if Phase 2.5 helper layer eventually ships, it won't speak as the plant.

### 3.3 Cross-region journeys

Desktop-primary user flows to design against. Each row must feel natural in both viewports.

1. **Returning user — calm.** Land on Today → glance at today's rituals → tap one task → CareConfirm → log → progress updates → close laptop.
2. **Returning user — urgent.** Land on Today → hero claims attention → water CTA → care animation + sweep → calm state. Tamagotchi payoff moment.
3. **Browsing.** Today → sidebar House link → rooms grid → click room → filtered list → click plant → Plant Detail → Care tab → update watering interval → back to House. Desktop two-pane removes the "back" step.
4. **Learning.** Today → sidebar Encyclopedia → search "Monstera" → species article → care guide → troubleshooting. Reference reader flow.
5. **Adding.** Anywhere → keyboard shortcut or FAB → Add Plant dialog → species search → env → save → Today refetches → new TaskRow appears. Dialog is modal on desktop, sheet on mobile.
6. **Admin.** Today → sidebar Me → notification settings / billing / devices. Quiet settings-pattern.
7. **Journaling.** Anywhere → sidebar Journal → chronological feed → read plant entries → reply with own entry → mood filter → find an old entry from when Monty was parched last summer.
8. **Plant-in-context story.** Today → click a plant → Plant Detail → Journal tab → scroll own + plant's interleaved history → tap an entry → view care log that triggered it.

---

## 4. Layout Grammar — TODO

Breakpoints, sidebar rules, widget-rail rules, column-collapse rules. Desktop-first anchor. Pending.

## 5. Per-Region Wireframes — TODO

6 regions × 2 viewports. Desktop first, mobile adaptation. Pending.

## 6. Open Decisions — TODO

- Dollhouse vs Greenhouse final name
- AI bot (Phase 2.5) placement rules — floating? per-plant? dedicated region?
- Encyclopedia article format (long-form vs card cluster vs tabbed)
- Widget-rail priority order (since-you-were-gone / jungle stats / Discover picks / weather / bot suggestions)
- Me section navigation pattern (left sub-nav? tab bar? routed sub-pages?)

## 7. Mockup Refresh Plan — TODO

New desktop mockups required:

- `13-desktop-today-v2.html` — supersedes v1 mockup 03
- `14-desktop-house-v2.html` — supersedes partial v1 mockup 12
- `15-desktop-plant-detail-v2.html` — supersedes partial v1 mockup 12
- `16-desktop-encyclopedia.html` — new, never mocked
- `17-desktop-me.html` — new, never mocked
- `18-desktop-add-plant.html` — new, never mocked

Mobile adaptations after desktop set lands.

## 8. Implementation Impact — TODO

Which currently-shipped code survives the flip, which gets reshaped, which gets scrapped. Specifically:

- AppLayout — does the flush dock stay mobile-only? Desktop sidebar stays?
- MobileTopBar — confirmed mobile-only.
- Today.jsx — header-card + canvas-card pattern — desktop equivalent?
- House.jsx (TICKET-010 in-progress) — reshape after grammar lands.
