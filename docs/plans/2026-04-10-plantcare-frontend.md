# PlantCare Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete React frontend for PlantCare — auth, onboarding, Today dashboard, House (rooms), Plant Detail, Add Plant flow, and the care interaction system.

**Architecture:** SPA with React Router for client-side routing, TanStack Query for server state, custom fetch wrapper for API calls with JWT auth + automatic token refresh. Mobile-first responsive design using Tailwind CSS with a glass-effect floating dock (mobile) and sidebar nav (desktop).

**Tech Stack:** React 19, React Router 7, TanStack Query 5, Tailwind CSS 4, Framer Motion (motion/react), Vaul (bottom sheets), Playwright (E2E testing)

**Performance guidelines:** This plan follows the Vercel React best-practices rules (`~/.claude/skills/react-best-practices`). The most load-bearing ones baked in:
- **`bundle-dynamic-imports`** — Task 4 splits every page into its own chunk via `React.lazy` + `<Suspense>`
- **`async-parallel`** — Task 6 fires room creations in parallel with `Promise.all`
- **`rerender-use-deferred-value`** — Tasks 6 and 12 use `useDeferredValue` on species-search input
- **`rerender-simple-expression-in-memo`** — Task 11 avoids `useMemo` for trivial arithmetic
- `useCallback` is used only when the callback crosses a memoization boundary (e.g. feeds into a `useMemo`'d context value), not as a reflex

---

## File Structure

The complete set of files to create during this plan:

```
client/src/
├── main.jsx                      # Update: wrap with providers
├── App.jsx                       # Rewrite: router + provider tree
├── index.css                     # Rewrite: Tailwind theme + fonts + gradient
├── api/
│   └── client.js                 # Custom fetch wrapper, JWT refresh
├── context/
│   └── AuthContext.jsx            # Auth state, login/register/logout
├── hooks/
│   ├── useAuth.js                 # Re-export from AuthContext
│   ├── useDashboard.js            # TanStack: GET /dashboard
│   ├── usePlants.js               # TanStack: plants + care logs
│   ├── useRooms.js                # TanStack: rooms CRUD
│   └── useSpecies.js              # TanStack: species search
├── components/
│   ├── ProtectedRoute.jsx         # Redirects to /login if not authed
│   ├── Layout.jsx                 # App shell (dock on mobile, sidebar on desktop)
│   ├── Dock.jsx                   # Glass floating bottom dock
│   ├── Sidebar.jsx                # Desktop sidebar nav
│   ├── ProgressRing.jsx           # Reusable SVG circular progress
│   ├── PlantAvatar.jsx            # Small plant illustration tile
│   ├── TaskRow.jsx                # Today ritual task row
│   ├── HeroCard.jsx               # Urgent plant hero card
│   ├── SinceRibbon.jsx            # "Since you were gone" ribbon
│   └── RoomCard.jsx               # Room card for House grid
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Welcome.jsx                # Onboarding wizard (5 steps)
│   ├── Today.jsx                  # Today dashboard
│   ├── House.jsx                  # Rooms grid + list view
│   ├── PlantDetail.jsx            # Full plant detail page
│   ├── Discover.jsx               # Placeholder
│   ├── Me.jsx                     # Profile + settings
│   └── NotFound.jsx               # 404 page
├── personality/
│   ├── voices.js                  # Voice template library by personality x state
│   └── states.js                  # Care state thresholds + mapping
└── utils/
    └── careStatus.js              # Compute care state from plant data
```

---

## Existing Setup Reference

**Already installed (package.json):**
- React 19.2.4, React DOM 19.2.4
- React Router DOM 7.14.0
- TanStack React Query 5.96.2
- Tailwind CSS 4.2.2 + @tailwindcss/vite
- Biome 2.4.10 (lint/format)
- Playwright 1.59.1 (E2E tests)
- Vite 8.0.4 + @vitejs/plugin-react 6.0.1

**Already configured:**
- Vite proxy: `/api/*` -> `http://api:3000`
- Biome: single quotes, no semicolons (`asNeeded`), 2-space indent, 120 char line width
- Playwright: chromium project, `./tests/` dir, existing `app.spec.js` placeholder test

**Existing files to modify:**
- `client/src/main.jsx` — currently renders `<App />` in StrictMode
- `client/src/App.jsx` — currently returns `<div>PlantCare</div>`
- `client/src/index.css` — currently has Vite default styles (purple theme)
- `client/tests/app.spec.js` — currently just checks body is visible

---

## API Reference

All endpoints use the `/api/v1/` prefix. The Vite proxy handles routing to the API container.

**Auth (no Authorization header needed):**
- `POST /api/v1/registration` — body: `{ user: { name, email, password, password_confirmation } }` — returns: `{ access_token, user: { id, email, name, timezone } }`
- `POST /api/v1/session` — body: `{ session: { email, password } }` — returns: `{ access_token, user: { id, email, name, timezone } }`
- `DELETE /api/v1/session` — no body — returns: 204
- `POST /api/v1/token` — no body (refresh cookie sent automatically) — returns: `{ access_token }`

**Protected (requires `Authorization: Bearer <access_token>`):**
- `GET /api/v1/rooms` — returns: `[{ id, name, icon, plants_count, created_at }]`
- `GET /api/v1/rooms/:id` — returns: `{ id, name, icon, plants_count, created_at }`
- `POST /api/v1/rooms` — body: `{ room: { name, icon } }` — returns: room object
- `PATCH /api/v1/rooms/:id` — body: `{ room: { name, icon } }` — returns: room object
- `DELETE /api/v1/rooms/:id` — returns: 204
- `GET /api/v1/plants` — optional `?room_id=N` — returns: array of plant objects
- `GET /api/v1/plants/:id` — returns: plant object (includes nested room + species)
- `POST /api/v1/plants` — body: `{ plant: { species_id, room_id, nickname, notes, light_level, temperature_level, humidity_level, acquired_at } }` — returns: plant object
- `PATCH /api/v1/plants/:id` — same fields as create — returns: plant object
- `DELETE /api/v1/plants/:id` — returns: 204
- `GET /api/v1/plants/:id/care_logs` — optional `?care_type=watering` — returns: array of care log objects
- `POST /api/v1/plants/:id/care_logs` — body: `{ care_log: { care_type, performed_at, notes } }` — care_type is `"watering"` or `"feeding"` — returns: care log object
- `GET /api/v1/plants/:id/plant_photos` — returns: array of photo objects
- `POST /api/v1/plants/:id/plant_photos` — multipart form with `plant_photo[image]` — returns: photo object
- `DELETE /api/v1/plants/:id/plant_photos/:photo_id` — returns: 204
- `GET /api/v1/species` — query param `?q=monstera` — returns: array of species objects
- `GET /api/v1/species/:id` — returns: species object
- `GET /api/v1/dashboard` — returns: `{ plants_needing_water: [...], plants_needing_feeding: [...], upcoming_care: [...], stats: { total_plants, total_rooms } }`
- `GET /api/v1/profile` — returns: `{ id, email, name, timezone }`
- `PATCH /api/v1/profile` — body: `{ user: { name, email, timezone } }` — returns: user object
- `PATCH /api/v1/profile/password` — body: `{ current_password, user: { password, password_confirmation } }` — returns: `{ message: 'Password updated' }`

**Plant object shape:**
```json
{
  "id": 1,
  "nickname": "Monty",
  "notes": null,
  "room": { "id": 1, "name": "Living Room", "icon": "couch", "plants_count": 3, "created_at": "..." },
  "species": { "id": 1, "common_name": "Monstera Deliciosa", "scientific_name": "Monstera deliciosa", "personality": "dramatic", "difficulty": "easy", ... },
  "light_level": "medium",
  "temperature_level": "average",
  "humidity_level": "average",
  "calculated_watering_days": 7,
  "calculated_feeding_days": 14,
  "water_status": "overdue",
  "feed_status": "healthy",
  "days_until_water": -2,
  "days_until_feed": 5,
  "last_watered_at": "2026-04-02T10:00:00Z",
  "last_fed_at": "2026-04-05T10:00:00Z",
  "acquired_at": "2026-03-01",
  "created_at": "2026-03-01T10:00:00Z"
}
```

---

## Task 1: Install Dependencies + Design Tokens

**Files modified:** `client/src/index.css`
**Files created:** none (packages installed via npm)

### Steps

- [ ] 1.1 — Install new npm packages inside Docker:

```bash
docker compose exec client npm install motion vaul @fontsource/plus-jakarta-sans @fontsource/fraunces driver.js
```

- [ ] 1.2 — Rewrite `client/src/index.css` with Tailwind 4 theme, CSS custom properties, font imports, and the mint gradient base:

```css
@import 'tailwindcss';
@import '@fontsource/plus-jakarta-sans/300.css';
@import '@fontsource/plus-jakarta-sans/400.css';
@import '@fontsource/plus-jakarta-sans/500.css';
@import '@fontsource/plus-jakarta-sans/600.css';
@import '@fontsource/plus-jakarta-sans/700.css';
@import '@fontsource/plus-jakarta-sans/800.css';
@import '@fontsource/plus-jakarta-sans/500-italic.css';
@import '@fontsource/plus-jakarta-sans/700-italic.css';
@import '@fontsource/fraunces/400.css';
@import '@fontsource/fraunces/400-italic.css';
@import '@fontsource/fraunces/500.css';
@import '@fontsource/fraunces/500-italic.css';
@import '@fontsource/fraunces/600.css';
@import '@fontsource/fraunces/600-italic.css';
@import '@fontsource/fraunces/800.css';
@import '@fontsource/fraunces/800-italic.css';

@theme {
  --color-base: #F6FBF4;
  --color-mint: #DFF2E2;
  --color-lime: #86DB65;
  --color-leaf: #32C456;
  --color-emerald: #14902F;
  --color-forest: #0B3A1A;
  --color-forest-2: #124626;
  --color-ink: #0A1D0E;
  --color-ink-soft: #4A6A51;
  --color-coral: #FF6B3D;
  --color-sunshine: #FFB83D;
  --color-card: #FFFFFF;

  --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-display: 'Fraunces', Georgia, serif;

  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-xl: 22px;
  --radius-2xl: 28px;
  --radius-3xl: 37px;
  --radius-full: 100px;

  --shadow-sm: 0 2px 8px rgba(11, 58, 26, 0.06);
  --shadow-md: 0 10px 30px rgba(11, 58, 26, 0.10);
  --shadow-lg: 0 24px 60px rgba(11, 58, 26, 0.14);
  --shadow-xl: 0 40px 100px -20px rgba(11, 58, 26, 0.30);
}

:root {
  --base: #F6FBF4;
  --mint: #DFF2E2;
  --lime: #86DB65;
  --leaf: #32C456;
  --emerald: #14902F;
  --forest: #0B3A1A;
  --forest-2: #124626;
  --ink: #0A1D0E;
  --ink-soft: #4A6A51;
  --coral: #FF6B3D;
  --sunshine: #FFB83D;
  --card: #FFFFFF;

  --shadow-fab: 0 0 0 4px var(--card), 0 10px 24px rgba(20, 144, 47, 0.4), 0 4px 10px rgba(11, 58, 26, 0.22);
  --shadow-dock: 0 12px 32px rgba(11, 58, 26, 0.14), 0 4px 12px rgba(11, 58, 26, 0.08);

  --gradient-mint: linear-gradient(180deg, #F6FBF4 0%, #DFF2E2 50%, #C7ECCA 100%);
  --gradient-forest: linear-gradient(135deg, var(--forest), var(--forest-2));

  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  color: var(--ink);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  background: var(--gradient-mint);
  min-height: 100dvh;
}

#root {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
```

- [ ] 1.3 — Verify fonts load by temporarily updating `App.jsx` to render sample text with both font families:

```jsx
export default function App() {
  return (
    <div className="p-8">
      <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '30px' }}>
        Plus Jakarta Sans 800
      </h1>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 800, fontStyle: 'italic', fontSize: '48px' }}>
        Fraunces 800 Italic
      </h2>
      <p className="text-ink-soft mt-4">Design tokens loaded successfully</p>
    </div>
  )
}
```

- [ ] 1.4 — Start the dev server and visually confirm both fonts render:

```bash
docker compose up
# Visit http://localhost:5173 — verify Plus Jakarta Sans heading and Fraunces italic heading
```

- [ ] 1.5 — Run lint to confirm no issues:

```bash
./scripts/lint.sh
```

- [ ] 1.6 — Commit:

```bash
git add client/src/index.css client/package.json client/package-lock.json
git commit -m "feat: install frontend dependencies and configure design tokens

Install motion, vaul, fontsource fonts, and driver.js. Rewrite index.css
with Tailwind 4 theme tokens matching the PlantCare design spec — palette,
typography, radii, shadows, and mint gradient background.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

**Expected outcome:** Dev server runs, both fonts visible, mint gradient background applied, all Tailwind color/shadow/radius tokens available via `bg-leaf`, `shadow-sm`, `rounded-2xl` etc.

---

## Task 2: API Client (fetch wrapper)

**Files created:** `client/src/api/client.js`

### Steps

- [ ] 2.1 — Create `client/src/api/client.js` with the custom fetch wrapper:

```javascript
let accessToken = null

export function setAccessToken(token) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

let isRefreshing = false
let refreshQueue = []

function processRefreshQueue(error, token) {
  for (const { resolve, reject } of refreshQueue) {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  }
  refreshQueue = []
}

async function refreshAccessToken() {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      refreshQueue.push({ resolve, reject })
    })
  }

  isRefreshing = true

  try {
    const response = await fetch('/api/v1/token', {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Refresh failed')
    }

    const data = await response.json()
    setAccessToken(data.access_token)
    processRefreshQueue(null, data.access_token)
    return data.access_token
  } catch (error) {
    setAccessToken(null)
    processRefreshQueue(error, null)
    throw error
  } finally {
    isRefreshing = false
  }
}

export async function apiFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  // Remove Content-Type for FormData (browser sets boundary automatically)
  if (options.body instanceof FormData) {
    delete headers['Content-Type']
  }

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })

  // On 401, attempt token refresh and retry once
  if (response.status === 401 && !options._retried) {
    try {
      const newToken = await refreshAccessToken()
      headers.Authorization = `Bearer ${newToken}`
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
        _retried: true,
      })
    } catch {
      // Refresh failed — caller handles the 401
      throw new Error('Session expired')
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const error = new Error(body.error || body.errors?.[0] || `Request failed: ${response.status}`)
    error.status = response.status
    error.body = body
    throw error
  }

  // 204 No Content
  if (response.status === 204) {
    return null
  }

  return response.json()
}

export function apiGet(url) {
  return apiFetch(url, { method: 'GET' })
}

export function apiPost(url, body) {
  if (body instanceof FormData) {
    return apiFetch(url, { method: 'POST', body })
  }
  return apiFetch(url, { method: 'POST', body: JSON.stringify(body) })
}

export function apiPatch(url, body) {
  return apiFetch(url, { method: 'PATCH', body: JSON.stringify(body) })
}

export function apiDelete(url) {
  return apiFetch(url, { method: 'DELETE' })
}
```

- [ ] 2.2 — Create a Playwright test verifying the client module exports exist. Add to `client/tests/api-client.spec.js`:

```javascript
import { expect, test } from '@playwright/test'

test('api client module loads on the page', async ({ page }) => {
  await page.goto('/')
  // Verify the app loads without import errors from the api client
  await expect(page.locator('#root')).toBeVisible()
})
```

- [ ] 2.3 — Run lint:

```bash
./scripts/lint.sh
```

- [ ] 2.4 — Run tests:

```bash
./scripts/run_tests.sh client
```

- [ ] 2.5 — Commit:

```bash
git add client/src/api/client.js client/tests/api-client.spec.js
git commit -m "feat: add custom fetch wrapper with JWT refresh logic

Closure-scoped access token (never in localStorage), automatic 401 ->
refresh -> retry, queued concurrent refresh requests, FormData support
for photo uploads. Convenience helpers: apiGet, apiPost, apiPatch, apiDelete.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

**Expected outcome:** `client/src/api/client.js` exports `apiFetch`, `apiGet`, `apiPost`, `apiPatch`, `apiDelete`, `setAccessToken`, `getAccessToken`. Token stored in a JS closure. 401 responses trigger automatic refresh via `POST /api/v1/token` and retry.

---

## Task 3: Auth Context

**Files created:** `client/src/context/AuthContext.jsx`, `client/src/hooks/useAuth.js`

### Steps

- [ ] 3.1 — Create `client/src/context/AuthContext.jsx`:

```jsx
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { apiPost, apiDelete, setAccessToken } from '../api/client'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/token', {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        setUser(null)
        setAccessToken(null)
        return false
      }

      const data = await response.json()
      setAccessToken(data.access_token)

      // Fetch user profile with the new token
      const profileResponse = await fetch('/api/v1/profile', {
        headers: { Authorization: `Bearer ${data.access_token}` },
        credentials: 'include',
      })

      if (profileResponse.ok) {
        const userData = await profileResponse.json()
        setUser(userData)
        return true
      }

      return false
    } catch {
      setUser(null)
      setAccessToken(null)
      return false
    }
  }, [])

  // On mount: attempt to restore session from refresh cookie
  useEffect(() => {
    refreshToken().finally(() => setLoading(false))
  }, [refreshToken])

  const login = useCallback(async (email, password) => {
    setError(null)
    try {
      const data = await apiPost('/api/v1/session', { session: { email, password } })
      setAccessToken(data.access_token)
      setUser(data.user)
      return data.user
    } catch (err) {
      setError(err.message || 'Login failed')
      throw err
    }
  }, [])

  const register = useCallback(async (name, email, password, passwordConfirmation) => {
    setError(null)
    try {
      const data = await apiPost('/api/v1/registration', {
        user: { name, email, password, password_confirmation: passwordConfirmation },
      })
      setAccessToken(data.access_token)
      setUser(data.user)
      return data.user
    } catch (err) {
      setError(err.message || 'Registration failed')
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiDelete('/api/v1/session')
    } catch {
      // Logout endpoint may fail if token is already expired — that is fine
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, error, login, register, logout, refreshToken, setError }),
    [user, loading, error, login, register, logout, refreshToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
```

- [ ] 3.2 — Create `client/src/hooks/useAuth.js`:

```javascript
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

- [ ] 3.3 — Run lint:

```bash
./scripts/lint.sh
```

- [ ] 3.4 — Commit:

```bash
git add client/src/context/AuthContext.jsx client/src/hooks/useAuth.js
git commit -m "feat: add AuthContext with login, register, logout, and session restore

AuthProvider attempts token refresh on mount to restore sessions from the
httpOnly refresh cookie. Access token stored in memory via the API client
closure. User state available via useAuth() hook.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

**Expected outcome:** `AuthProvider` provides `user`, `loading`, `error`, `login()`, `register()`, `logout()`, `refreshToken()`. On mount, attempts `POST /api/v1/token` to restore session. `useAuth()` hook available for all components.

---

## Task 4: Router + App Shell

**Files modified:** `client/src/App.jsx`, `client/src/main.jsx`
**Files created:** `client/src/components/ProtectedRoute.jsx`, `client/src/components/Layout.jsx`, `client/src/components/Dock.jsx`, `client/src/components/Sidebar.jsx`, `client/src/pages/NotFound.jsx`

### Steps

- [ ] 4.1 — Create `client/src/components/ProtectedRoute.jsx`:

```jsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="w-8 h-8 border-3 border-leaf border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
```

- [ ] 4.2 — Create `client/src/components/Dock.jsx`:

The glass floating bottom dock for mobile. Four nav items + centre FAB.

```jsx
import { NavLink, useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Today', icon: 'sun' },
  { to: '/house', label: 'House', icon: 'home' },
  { to: '/discover', label: 'Discover', icon: 'search' },
  { to: '/me', label: 'Me', icon: 'user' },
]

// Simple SVG icons — replace with proper icon set later
function NavIcon({ name, active }) {
  const color = active ? 'var(--forest)' : 'var(--ink-soft)'
  const icons = {
    sun: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
    home: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    search: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    user: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  }
  return icons[name] || null
}

export default function Dock() {
  const navigate = useNavigate()

  const leftItems = navItems.slice(0, 2)
  const rightItems = navItems.slice(2)

  return (
    <nav
      className="fixed bottom-[10px] left-3 right-3 h-[74px] z-50 flex items-center justify-around px-4 lg:hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.78)',
        backdropFilter: 'blur(24px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
        borderRadius: '37px',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        boxShadow: 'var(--shadow-dock)',
      }}
    >
      {leftItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className="flex flex-col items-center gap-1 py-2 px-3"
        >
          {({ isActive }) => (
            <>
              <NavIcon name={item.icon} active={isActive} />
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: isActive ? 'var(--forest)' : 'var(--ink-soft)' }}
              >
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}

      {/* FAB */}
      <button
        type="button"
        onClick={() => navigate('/add-plant')}
        className="relative -top-3.5 flex items-center justify-center w-[54px] h-[54px] rounded-full text-white cursor-pointer border-0"
        style={{
          background: 'linear-gradient(135deg, var(--leaf), var(--emerald))',
          boxShadow: 'var(--shadow-fab)',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {rightItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className="flex flex-col items-center gap-1 py-2 px-3"
        >
          {({ isActive }) => (
            <>
              <NavIcon name={item.icon} active={isActive} />
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: isActive ? 'var(--forest)' : 'var(--ink-soft)' }}
              >
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
```

- [ ] 4.3 — Create `client/src/components/Sidebar.jsx`:

```jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { to: '/', label: 'Today', icon: '☀️' },
  { to: '/house', label: 'House', icon: '🏠' },
  { to: '/discover', label: 'Discover', icon: '🔍' },
  { to: '/me', label: 'Me', icon: '👤' },
]

export default function Sidebar() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="hidden lg:flex flex-col w-[260px] h-dvh bg-card border-r border-mint fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-[38px] h-[38px] rounded-xl flex items-center justify-center text-white text-lg font-extrabold"
            style={{ background: 'linear-gradient(135deg, var(--leaf), var(--emerald))' }}
          >
            P
          </div>
          <span className="text-lg font-extrabold text-ink">
            Plant<span className="font-extrabold">Care</span>
          </span>
        </div>
      </div>

      {/* Nav label */}
      <div className="px-6 pt-4 pb-2">
        <span className="text-[10px] font-extrabold text-ink-soft uppercase tracking-[0.12em]">Navigate</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                isActive ? 'bg-mint text-forest border-l-4 border-leaf' : 'text-ink-soft hover:bg-mint/50'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Add plant CTA */}
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={() => navigate('/add-plant')}
          className="w-full p-4 rounded-2xl text-white cursor-pointer border-0"
          style={{ background: 'var(--gradient-forest)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">+</span>
            <span className="text-sm font-extrabold text-lime">New plant</span>
          </div>
          <p className="text-xs text-lime/70 mt-1 text-left">Add a new plant to your collection</p>
        </button>
      </div>

      {/* User footer */}
      {user && (
        <div className="px-4 pb-6 border-t border-mint pt-4">
          <div className="flex items-center gap-3">
            <div className="w-[38px] h-[38px] rounded-full bg-mint flex items-center justify-center text-emerald font-bold text-sm">
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-sm font-bold text-ink">{user.name}</p>
              <p className="text-xs text-ink-soft">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
```

- [ ] 4.4 — Create `client/src/components/Layout.jsx`:

```jsx
import { Outlet } from 'react-router-dom'
import Dock from './Dock'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="min-h-dvh">
      <Sidebar />

      {/* Main content area — offset on desktop for sidebar */}
      <main className="lg:ml-[260px] pb-24 lg:pb-0 min-h-dvh">
        <Outlet />
      </main>

      <Dock />
    </div>
  )
}
```

- [ ] 4.5 — Create `client/src/pages/NotFound.jsx`:

```jsx
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 text-center">
      <h1 className="text-6xl font-extrabold text-ink mb-4">404</h1>
      <p className="text-lg text-ink-soft mb-8">This page has wilted away.</p>
      <Link
        to="/"
        className="px-6 py-3 rounded-full text-white font-extrabold text-sm no-underline"
        style={{ background: 'linear-gradient(135deg, var(--leaf), var(--emerald))' }}
      >
        Back to Today
      </Link>
    </div>
  )
}
```

- [ ] 4.6 — Rewrite `client/src/App.jsx` with the router, provider tree, and route-level code splitting:

Pages are loaded with `React.lazy()` so each screen becomes its own chunk — the initial bundle only contains the router, providers, layout, and whichever page the user lands on. Subsequent pages are fetched on navigation. `<Suspense>` wraps `<Routes>` to show a fallback while a chunk loads.

```jsx
import { lazy, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import NotFound from './pages/NotFound'

// Route-level code splitting: each page ships as its own chunk
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Welcome = lazy(() => import('./pages/Welcome'))
const Today = lazy(() => import('./pages/Today'))
const House = lazy(() => import('./pages/House'))
const PlantDetail = lazy(() => import('./pages/PlantDetail'))
const Discover = lazy(() => import('./pages/Discover'))
const Me = lazy(() => import('./pages/Me'))
const AddPlant = lazy(() => import('./pages/AddPlant'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
})

function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-dvh">
      <div className="w-8 h-8 border-3 border-leaf border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// Placeholder used until each page is built in later tasks. Remove once all
// pages exist.
function PlaceholderPage({ title }) {
  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-3xl font-extrabold text-ink">{title}</h1>
      <p className="text-ink-soft mt-2">Coming soon.</p>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<PlaceholderPage title="Login" />} />
              <Route path="/register" element={<PlaceholderPage title="Register" />} />
              <Route path="/welcome" element={<PlaceholderPage title="Welcome" />} />

              {/* Protected routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<PlaceholderPage title="Today" />} />
                <Route path="house" element={<PlaceholderPage title="House" />} />
                <Route path="plants/:id" element={<PlaceholderPage title="Plant Detail" />} />
                <Route path="discover" element={<PlaceholderPage title="Discover" />} />
                <Route path="me" element={<PlaceholderPage title="Me" />} />
                <Route path="add-plant" element={<PlaceholderPage title="Add Plant" />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
```

> **Note on later tasks:** as each page is built in Tasks 5, 6, 9, 10, 11, 12, 14, replace the matching `<PlaceholderPage .../>` element with the lazy-imported component (e.g. `element={<Login />}`). The `lazy()` imports above are declared up front so you only add one line per task.

> **React best-practices applied:** `bundle-dynamic-imports` — heavy route components are deferred so the landing screen doesn't download the entire app.

- [ ] 4.7 — Update `client/src/main.jsx` (minor cleanup, keep StrictMode):

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] 4.8 — Update the existing Playwright test to verify routing:

Replace `client/tests/app.spec.js` with:

```javascript
import { expect, test } from '@playwright/test'

test('app loads and shows login or content', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#root')).toBeVisible()
})

test('404 page shows for unknown routes', async ({ page }) => {
  await page.goto('/this-does-not-exist')
  await expect(page.locator('text=404')).toBeVisible()
})
```

- [ ] 4.9 — Run lint + tests:

```bash
./scripts/lint.sh
./scripts/run_tests.sh client
```

- [ ] 4.10 — Commit:

```bash
git add client/src/App.jsx client/src/main.jsx \
  client/src/components/ProtectedRoute.jsx \
  client/src/components/Layout.jsx \
  client/src/components/Dock.jsx \
  client/src/components/Sidebar.jsx \
  client/src/pages/NotFound.jsx \
  client/tests/app.spec.js
git commit -m "feat: add router, app shell with glass dock and desktop sidebar

BrowserRouter with protected routes, Layout component with responsive
navigation (glass bottom dock on mobile, fixed sidebar on desktop),
FAB placeholder, 404 page, and QueryClient + AuthProvider wrappers.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

**Expected outcome:** Routes work (`/login`, `/register`, `/`, `/house`, `/plants/:id`, `/discover`, `/me`, `/add-plant`). Unauthenticated users redirect to `/login`. Mobile shows glass dock with FAB. Desktop shows sidebar. 404 page renders for unknown routes.

---

## Task 5: Auth Screens

**Files created:** `client/src/pages/Login.jsx`, `client/src/pages/Register.jsx`
**Files modified:** `client/src/App.jsx` (replace placeholder imports)

### Steps

- [ ] 5.1 — Create `client/src/pages/Login.jsx`:

```jsx
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login, error, setError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch {
      // error is set in AuthContext
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xl font-extrabold"
          style={{ background: 'linear-gradient(135deg, var(--leaf), var(--emerald))' }}
        >
          P
        </div>
        <span className="text-xl font-extrabold text-ink">PlantCare</span>
      </div>

      {/* Heading */}
      <h1 className="font-display text-4xl lg:text-5xl font-extrabold italic text-ink mb-8 text-center tracking-tight">
        Welcome <em className="text-leaf">back</em>
      </h1>

      {/* Form card */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-card rounded-2xl p-6 border border-mint"
        style={{ boxShadow: 'var(--shadow-md)' }}
      >
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-coral/10 border border-coral/30 text-coral text-sm font-semibold">
            {error}
          </div>
        )}

        <label className="block mb-4">
          <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError(null)
            }}
            required
            className="mt-1 w-full px-4 py-3 rounded-xl bg-mint/50 border border-mint text-ink text-sm font-semibold outline-none transition-all focus:border-leaf focus:shadow-[0_0_0_4px_rgba(50,196,86,0.15)]"
            placeholder="you@example.com"
          />
        </label>

        <label className="block mb-2">
          <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError(null)
            }}
            required
            className="mt-1 w-full px-4 py-3 rounded-xl bg-mint/50 border border-mint text-ink text-sm font-semibold outline-none transition-all focus:border-leaf focus:shadow-[0_0_0_4px_rgba(50,196,86,0.15)]"
            placeholder="Your password"
          />
        </label>

        <div className="text-right mb-6">
          <span className="text-xs text-ink-soft cursor-pointer hover:text-leaf">Forgot password?</span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-full text-white font-extrabold text-sm cursor-pointer border-0 transition-transform active:scale-[0.97] disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, var(--leaf), var(--emerald))' }}
        >
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      {/* Switch link */}
      <p className="mt-6 text-sm text-ink-soft">
        {"Don't have an account? "}
        <Link to="/register" className="text-leaf font-bold no-underline hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
```

- [ ] 5.2 — Create `client/src/pages/Register.jsx`:

```jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function getPasswordStrength(password) {
  if (!password) return 0

  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}

const strengthColors = ['var(--coral)', 'var(--coral)', 'var(--sunshine)', 'var(--leaf)', 'var(--emerald)']

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { register, error, setError } = useAuth()
  const navigate = useNavigate()

  const strength = getPasswordStrength(password)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await register(name, email, password, passwordConfirmation)
      navigate('/welcome', { replace: true })
    } catch {
      // error is set in AuthContext
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xl font-extrabold"
          style={{ background: 'linear-gradient(135deg, var(--leaf), var(--emerald))' }}
        >
          P
        </div>
        <span className="text-xl font-extrabold text-ink">PlantCare</span>
      </div>

      {/* Heading */}
      <h1 className="font-display text-4xl lg:text-5xl font-extrabold italic text-ink mb-8 text-center tracking-tight">
        Join the <em className="text-leaf">jungle</em>
      </h1>

      {/* Form card */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-card rounded-2xl p-6 border border-mint"
        style={{ boxShadow: 'var(--shadow-md)' }}
      >
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-coral/10 border border-coral/30 text-coral text-sm font-semibold">
            {error}
          </div>
        )}

        <label className="block mb-4">
          <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
            required
            className="mt-1 w-full px-4 py-3 rounded-xl bg-mint/50 border border-mint text-ink text-sm font-semibold outline-none transition-all focus:border-leaf focus:shadow-[0_0_0_4px_rgba(50,196,86,0.15)]"
            placeholder="Your name"
          />
        </label>

        <label className="block mb-4">
          <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError(null)
            }}
            required
            className="mt-1 w-full px-4 py-3 rounded-xl bg-mint/50 border border-mint text-ink text-sm font-semibold outline-none transition-all focus:border-leaf focus:shadow-[0_0_0_4px_rgba(50,196,86,0.15)]"
            placeholder="you@example.com"
          />
        </label>

        <label className="block mb-1">
          <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError(null)
            }}
            required
            minLength={8}
            className="mt-1 w-full px-4 py-3 rounded-xl bg-mint/50 border border-mint text-ink text-sm font-semibold outline-none transition-all focus:border-leaf focus:shadow-[0_0_0_4px_rgba(50,196,86,0.15)]"
            placeholder="At least 8 characters"
          />
        </label>

        {/* Password strength bar */}
        {password.length > 0 && (
          <div className="flex gap-1 mb-4 mt-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-colors"
                style={{ background: i < strength ? strengthColors[strength] : 'var(--mint)' }}
              />
            ))}
          </div>
        )}
        {!password.length && <div className="mb-4" />}

        <label className="block mb-6">
          <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">Confirm password</span>
          <input
            type="password"
            value={passwordConfirmation}
            onChange={(e) => {
              setPasswordConfirmation(e.target.value)
              setError(null)
            }}
            required
            className="mt-1 w-full px-4 py-3 rounded-xl bg-mint/50 border border-mint text-ink text-sm font-semibold outline-none transition-all focus:border-leaf focus:shadow-[0_0_0_4px_rgba(50,196,86,0.15)]"
            placeholder="Confirm your password"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-full text-white font-extrabold text-sm cursor-pointer border-0 transition-transform active:scale-[0.97] disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, var(--leaf), var(--emerald))' }}
        >
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      {/* Switch link */}
      <p className="mt-6 text-sm text-ink-soft">
        Already have an account?{' '}
        <Link to="/login" className="text-leaf font-bold no-underline hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
```

- [ ] 5.3 — Update `client/src/App.jsx` to import real auth pages instead of placeholders:

Replace the login and register route elements:
```jsx
import Login from './pages/Login'
import Register from './pages/Register'

// In the Routes:
<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />
```

- [ ] 5.4 — Add Playwright test for the login flow. Create `client/tests/auth.spec.js`:

```javascript
import { expect, test } from '@playwright/test'

test('login page renders with form', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('text=Welcome')).toBeVisible()
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toBeVisible()
  await expect(page.locator('button[type="submit"]')).toBeVisible()
})

test('register page renders with form', async ({ page }) => {
  await page.goto('/register')
  await expect(page.locator('text=jungle')).toBeVisible()
  await expect(page.locator('input[type="text"]')).toBeVisible()
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('button[type="submit"]')).toBeVisible()
})

test('login page links to register', async ({ page }) => {
  await page.goto('/login')
  await page.click('text=Sign up')
  await expect(page).toHaveURL('/register')
})

test('register page links to login', async ({ page }) => {
  await page.goto('/register')
  await page.click('text=Log in')
  await expect(page).toHaveURL('/login')
})

test('login shows error on invalid credentials', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'wrong@example.com')
  await page.fill('input[type="password"]', 'wrongpassword')
  await page.click('button[type="submit"]')
  // Should show an error message (from API or network error)
  await expect(page.locator('[class*="coral"]')).toBeVisible({ timeout: 10000 })
})
```

- [ ] 5.5 — Run lint + tests:

```bash
./scripts/lint.sh
./scripts/run_tests.sh client
```

- [ ] 5.6 — Commit:

```bash
git add client/src/pages/Login.jsx client/src/pages/Register.jsx \
  client/src/App.jsx client/tests/auth.spec.js
git commit -m "feat: add login and register screens with Fraunces headings

Login with email/password, Register with name/email/password and 4-segment
password strength indicator. Both use the mint gradient background with
white form cards, leaf-green focus states, and Fraunces italic headings.
Error display from AuthContext.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

**Expected outcome:** `/login` shows "Welcome back" with email/password form. `/register` shows "Join the jungle" with name/email/password + strength indicator. Both redirect on success. Error messages display in coral. Cross-links between the two pages work.

---

## Task 6: Onboarding Wizard

**Files created:** `client/src/pages/Welcome.jsx`
**Files modified:** `client/src/App.jsx` (replace placeholder import)

### Steps

- [ ] 6.1 — Create `client/src/pages/Welcome.jsx` with 5-step wizard:

```jsx
import { useCallback, useDeferredValue, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPost } from '../api/client'
import { useAuth } from '../hooks/useAuth'

const PRESET_ROOMS = [
  { name: 'Living Room', icon: 'couch' },
  { name: 'Kitchen', icon: 'kitchen' },
  { name: 'Bedroom', icon: 'bed' },
  { name: 'Bathroom', icon: 'bath' },
  { name: 'Office', icon: 'desk' },
]

export default function Welcome() {
  const [step, setStep] = useState(1)
  const [selectedRooms, setSelectedRooms] = useState([])
  const [customRoom, setCustomRoom] = useState('')
  const [speciesQuery, setSpeciesQuery] = useState('')
  const [speciesResults, setSpeciesResults] = useState([])
  const [selectedSpecies, setSelectedSpecies] = useState(null)
  const [nickname, setNickname] = useState('')
  const [environment, setEnvironment] = useState({
    light_level: 'medium',
    temperature_level: 'average',
    humidity_level: 'average',
  })
  const [createdRooms, setCreatedRooms] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const totalSteps = 5
  const progressPercent = (step / totalSteps) * 100

  const toggleRoom = useCallback((roomName) => {
    setSelectedRooms((prev) =>
      prev.includes(roomName) ? prev.filter((r) => r !== roomName) : [...prev, roomName],
    )
  }, [])

  const addCustomRoom = useCallback(() => {
    if (customRoom.trim() && !selectedRooms.includes(customRoom.trim())) {
      setSelectedRooms((prev) => [...prev, customRoom.trim()])
      setCustomRoom('')
    }
  }, [customRoom, selectedRooms])

  // Species search: store the raw input separately from the query we actually
  // send to the API, then defer that value so typing stays responsive and we
  // don't fire a request per keystroke. useDeferredValue is React's built-in
  // way to say "this downstream work is non-urgent".
  const deferredSpeciesQuery = useDeferredValue(speciesQuery)

  useEffect(() => {
    if (deferredSpeciesQuery.length < 2) {
      setSpeciesResults([])
      return
    }

    let cancelled = false
    apiGet(`/api/v1/species?q=${encodeURIComponent(deferredSpeciesQuery)}`)
      .then((results) => {
        if (!cancelled) setSpeciesResults(results)
      })
      .catch(() => {
        if (!cancelled) setSpeciesResults([])
      })

    return () => {
      cancelled = true
    }
  }, [deferredSpeciesQuery])

  const handleCreateRooms = useCallback(async () => {
    setSubmitting(true)
    try {
      // Room creations are independent — fire them in parallel with Promise.all
      // instead of awaiting each one sequentially. Applies React best-practice
      // rule: async-parallel.
      const rooms = await Promise.all(
        selectedRooms.map((roomName) => {
          const preset = PRESET_ROOMS.find((r) => r.name === roomName)
          return apiPost('/api/v1/rooms', {
            room: { name: roomName, icon: preset?.icon || null },
          })
        }),
      )
      setCreatedRooms(rooms)
      setStep(3)
    } catch {
      // Handle error — could show toast
    } finally {
      setSubmitting(false)
    }
  }, [selectedRooms])

  const handleCreatePlant = useCallback(async () => {
    if (!selectedSpecies || !createdRooms.length) return

    setSubmitting(true)
    try {
      await apiPost('/api/v1/plants', {
        plant: {
          species_id: selectedSpecies.id,
          room_id: createdRooms[0].id,
          nickname: nickname || selectedSpecies.common_name,
          ...environment,
        },
      })
      setStep(5)
    } catch {
      // Handle error
    } finally {
      setSubmitting(false)
    }
  }, [selectedSpecies, createdRooms, nickname, environment])

  const handleFinish = useCallback(() => {
    localStorage.setItem('plantcare_tour_pending', 'true')
    navigate('/', { replace: true })
  }, [navigate])

  return (
    <div className="min-h-dvh flex flex-col items-center px-6 py-12">
      {/* Progress bar */}
      <div className="w-full max-w-sm mb-8">
        <div className="h-1.5 bg-mint rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, var(--leaf), var(--emerald))' }}
          />
        </div>
        <p className="text-xs text-ink-soft mt-2 text-right font-semibold">
          {step} / {totalSteps}
        </p>
      </div>

      {/* Step 1: Welcome */}
      {step === 1 && (
        <div className="w-full max-w-sm text-center">
          <div className="text-6xl mb-6">🌿</div>
          <h1 className="font-display text-4xl font-extrabold italic text-ink mb-4 tracking-tight">
            {"Let's set up your "}
            <em className="text-leaf">garden</em>
          </h1>
          <p className="text-ink-soft mb-8">
            {"We'll get your rooms ready and add your first plant. It only takes a minute."}
          </p>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="px-8 py-3 rounded-full text-white font-extrabold text-sm cursor-pointer border-0"
            style={{ background: 'linear-gradient(135deg, var(--leaf), var(--emerald))' }}
          >
            Get started
          </button>
        </div>
      )}

      {/* Step 2: Rooms */}
      {step === 2 && (
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-extrabold text-ink mb-2 tracking-tight">Where do your plants live?</h2>
          <p className="text-sm text-ink-soft mb-6">Pick the rooms in your home that have plants.</p>

          <div className="space-y-2 mb-4">
            {PRESET_ROOMS.map((room) => (
              <button
                key={room.name}
                type="button"
                onClick={() => toggleRoom(room.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left cursor-pointer transition-all ${
                  selectedRooms.includes(room.name)
                    ? 'bg-leaf/10 border-leaf text-ink'
                    : 'bg-card border-mint text-ink hover:border-leaf/50'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    selectedRooms.includes(room.name) ? 'bg-leaf border-leaf' : 'border-mint'
                  }`}
                >
                  {selectedRooms.includes(room.name) && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-bold">{room.name}</span>
              </button>
            ))}

            {/* Custom rooms already added */}
            {selectedRooms
              .filter((r) => !PRESET_ROOMS.find((p) => p.name === r))
              .map((room) => (
                <button
                  key={room}
                  type="button"
                  onClick={() => toggleRoom(room)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border bg-leaf/10 border-leaf text-ink text-left cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-md border-2 bg-leaf border-leaf flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold">{room}</span>
                </button>
              ))}

            {/* Add custom room */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customRoom}
                onChange={(e) => setCustomRoom(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomRoom()}
                className="flex-1 px-4 py-3 rounded-xl bg-card border border-dashed border-ink-soft/30 text-ink text-sm outline-none focus:border-leaf"
                placeholder="Add custom room..."
              />
              {customRoom.trim() && (
                <button
                  type="button"
                  onClick={addCustomRoom}
                  className="px-4 py-3 rounded-xl bg-mint text-emerald font-bold text-sm cursor-pointer border-0"
                >
                  Add
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateRooms}
            disabled={selectedRooms.length === 0 || submitting}
            className="w-full mt-4 py-3 rounded-full text-white font-extrabold text-sm cursor-pointer border-0 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, var(--leaf), var(--emerald))' }}
          >
            {submitting ? 'Creating rooms...' : 'Continue'}
          </button>
        </div>
      )}

      {/* Step 3: First plant */}
      {step === 3 && (
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-extrabold text-ink mb-2 tracking-tight">Add your first plant</h2>
          <p className="text-sm text-ink-soft mb-6">Search for a species or skip for now.</p>

          <input
            type="text"
            value={speciesQuery}
            onChange={(e) => setSpeciesQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-card border border-mint text-ink text-sm outline-none focus:border-leaf mb-3"
            placeholder="Search species (e.g. Monstera, Snake Plant...)"
          />

          {speciesResults.length > 0 && !selectedSpecies && (
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {speciesResults.map((species) => (
                <button
                  key={species.id || species.common_name}
                  type="button"
                  onClick={() => {
                    setSelectedSpecies(species)
                    setNickname('')
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-mint text-left cursor-pointer hover:border-leaf transition-colors"
                >
                  <div>
                    <p className="text-sm font-bold text-ink">{species.common_name}</p>
                    {species.scientific_name && (
                      <p className="text-xs text-ink-soft italic">{species.scientific_name}</p>
                    )}
                  </div>
                  {species.personality && (
                    <span className="text-xs font-bold text-emerald bg-mint px-2 py-1 rounded-full">
                      {species.personality}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {selectedSpecies && (
            <div className="mb-4">
              <div
                className="p-4 rounded-2xl text-white mb-4"
                style={{ background: 'var(--gradient-forest)' }}
              >
                <p className="text-lg font-extrabold">{selectedSpecies.common_name}</p>
                {selectedSpecies.scientific_name && (
                  <p className="text-sm italic opacity-80">{selectedSpecies.scientific_name}</p>
                )}
                <div className="flex gap-2 mt-2">
                  {selectedSpecies.personality && (
                    <span className="text-xs font-bold bg-lime/20 text-lime px-2 py-1 rounded-full">
                      {selectedSpecies.personality}
                    </span>
                  )}
                  {selectedSpecies.difficulty && (
                    <span className="text-xs font-bold bg-white/20 text-white px-2 py-1 rounded-full">
                      {selectedSpecies.difficulty}
                    </span>
                  )}
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">Nickname</span>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="mt-1 w-full px-4 py-3 rounded-xl bg-card border border-mint text-ink text-sm outline-none focus:border-leaf"
                  placeholder={selectedSpecies.common_name}
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  setSelectedSpecies(null)
                  setSpeciesQuery('')
                  setSpeciesResults([])
                }}
                className="mt-2 text-xs text-ink-soft underline cursor-pointer bg-transparent border-0"
              >
                Choose a different species
              </button>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={() => setStep(selectedSpecies ? 4 : 5)}
              className="flex-1 py-3 rounded-full text-ink-soft font-bold text-sm cursor-pointer bg-mint border-0"
            >
              {selectedSpecies ? 'Continue' : 'Skip for now'}
            </button>
            {selectedSpecies && (
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex-1 py-3 rounded-full text-white font-extrabold text-sm cursor-pointer border-0"
                style={{ background: 'linear-gradient(135deg, var(--leaf), var(--emerald))' }}
              >
                Continue
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Environment */}
      {step === 4 && (
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-extrabold text-ink mb-2 tracking-tight">
            {"How's the environment?"}
          </h2>
          <p className="text-sm text-ink-soft mb-6">
            This helps us calculate your plant&apos;s care schedule.
          </p>

          {[
            { key: 'light_level', label: 'Light', options: ['low', 'medium', 'bright'] },
            { key: 'temperature_level', label: 'Temperature', options: ['cool', 'average', 'warm'] },
            { key: 'humidity_level', label: 'Humidity', options: ['dry', 'average', 'humid'] },
          ].map(({ key, label, options }) => (
            <div key={key} className="mb-5">
              <label className="text-xs font-bold text-ink-soft uppercase tracking-wider">{label}</label>
              <div className="flex gap-1 mt-2 bg-mint p-1 rounded-full">
                {options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setEnvironment((prev) => ({ ...prev, [key]: option }))}
                    className={`flex-1 py-2 rounded-full text-xs font-bold cursor-pointer border-0 capitalize transition-all ${
                      environment[key] === option ? 'bg-card text-ink shadow-sm' : 'bg-transparent text-ink-soft'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <p className="text-xs text-ink-soft mb-6">Not sure? You can update anytime.</p>

          <button
            type="button"
            onClick={handleCreatePlant}
            disabled={submitting}
            className="w-full py-3 rounded-full text-white font-extrabold text-sm cursor-pointer border-0 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, var(--leaf), var(--emerald))' }}
          >
            {submitting ? 'Adding plant...' : 'Continue'}
          </button>
        </div>
      )}

      {/* Step 5: Done */}
      {step === 5 && (
        <div className="w-full max-w-sm text-center">
          <div className="text-6xl mb-6">✨</div>
          <h1 className="font-display text-4xl font-extrabold italic text-ink mb-4 tracking-tight">
            {"You're "}
            <em className="text-leaf">all set</em>
            {user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="text-ink-soft mb-6">Your garden is ready. Time to start caring.</p>

          {selectedSpecies && (
            <div
              className="p-4 rounded-2xl bg-card border-l-4 mb-6 text-left"
              style={{ borderLeftColor: 'var(--leaf)' }}
            >
              <p className="text-sm italic text-ink-soft font-display">
                {'"I\'m having the best day. Every day is the best day."'}
              </p>
              <p className="text-xs text-ink-soft mt-2 font-bold">
                {`- ${nickname || selectedSpecies.common_name}`}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleFinish}
            className="px-8 py-3 rounded-full text-white font-extrabold text-sm cursor-pointer border-0"
            style={{ background: 'linear-gradient(135deg, var(--leaf), var(--emerald))' }}
          >
            Enter your jungle
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] 6.2 — Update `client/src/App.jsx` to import the real Welcome page:

```jsx
import Welcome from './pages/Welcome'

// In the Routes:
<Route path="/welcome" element={<Welcome />} />
```

- [ ] 6.3 — Run lint + tests:

```bash
./scripts/lint.sh
./scripts/run_tests.sh client
```

- [ ] 6.4 — Commit:

```bash
git add client/src/pages/Welcome.jsx client/src/App.jsx
git commit -m "feat: add 5-step onboarding wizard with room and plant creation

Welcome -> Rooms (checkbox presets + custom) -> Species search + nickname ->
Environment segmented controls -> Done celebration. Creates rooms and first
plant via API during the flow. Progress bar tracks position.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

**Expected outcome:** After registration, user sees a 5-step wizard. Rooms are created via `POST /api/v1/rooms`, species are searched via `GET /api/v1/species?q=`, and the first plant is created via `POST /api/v1/plants`. Progress bar updates per step. Redirects to `/` on completion.

---

## Task 7: TanStack Query Hooks

**Files created:** `client/src/hooks/useDashboard.js`, `client/src/hooks/usePlants.js`, `client/src/hooks/useRooms.js`, `client/src/hooks/useSpecies.js`

### Steps

- [ ] 7.1 — Create `client/src/hooks/useDashboard.js`:

```javascript
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../api/client'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiGet('/api/v1/dashboard'),
  })
}
```

- [ ] 7.2 — Create `client/src/hooks/useRooms.js`:

```javascript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiDelete, apiGet, apiPatch, apiPost } from '../api/client'

export function useRooms() {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: () => apiGet('/api/v1/rooms'),
  })
}

export function useRoom(id) {
  return useQuery({
    queryKey: ['rooms', id],
    queryFn: () => apiGet(`/api/v1/rooms/${id}`),
    enabled: !!id,
  })
}

export function useCreateRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => apiPost('/api/v1/rooms', { room: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}

export function useUpdateRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => apiPatch(`/api/v1/rooms/${id}`, { room: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}

export function useDeleteRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => apiDelete(`/api/v1/rooms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}
```

- [ ] 7.3 — Create `client/src/hooks/usePlants.js`:

```javascript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiDelete, apiGet, apiPatch, apiPost } from '../api/client'

export function usePlants(roomId) {
  return useQuery({
    queryKey: roomId ? ['plants', { roomId }] : ['plants'],
    queryFn: () => apiGet(`/api/v1/plants${roomId ? `?room_id=${roomId}` : ''}`),
  })
}

export function usePlant(id) {
  return useQuery({
    queryKey: ['plants', id],
    queryFn: () => apiGet(`/api/v1/plants/${id}`),
    enabled: !!id,
  })
}

export function useCreatePlant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => apiPost('/api/v1/plants', { plant: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants'] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdatePlant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => apiPatch(`/api/v1/plants/${id}`, { plant: data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plants'] })
      queryClient.invalidateQueries({ queryKey: ['plants', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeletePlant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => apiDelete(`/api/v1/plants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants'] })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useCareLogs(plantId, params = {}) {
  const queryParams = params.careType ? `?care_type=${params.careType}` : ''
  return useQuery({
    queryKey: ['careLogs', plantId, params],
    queryFn: () => apiGet(`/api/v1/plants/${plantId}/care_logs${queryParams}`),
    enabled: !!plantId,
  })
}

export function useLogCare(plantId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => apiPost(`/api/v1/plants/${plantId}/care_logs`, { care_log: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careLogs', plantId] })
      queryClient.invalidateQueries({ queryKey: ['plants', plantId] })
      queryClient.invalidateQueries({ queryKey: ['plants'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function usePlantPhotos(plantId) {
  return useQuery({
    queryKey: ['plantPhotos', plantId],
    queryFn: () => apiGet(`/api/v1/plants/${plantId}/plant_photos`),
    enabled: !!plantId,
  })
}

export function useUploadPhoto(plantId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file) => {
      const formData = new FormData()
      formData.append('plant_photo[image]', file)
      return apiPost(`/api/v1/plants/${plantId}/plant_photos`, formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantPhotos', plantId] })
    },
  })
}

export function useDeletePhoto(plantId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (photoId) => apiDelete(`/api/v1/plants/${plantId}/plant_photos/${photoId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plantPhotos', plantId] })
    },
  })
}
```

- [ ] 7.4 — Create `client/src/hooks/useSpecies.js`:

```javascript
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../api/client'

export function useSpeciesSearch(query) {
  return useQuery({
    queryKey: ['species', 'search', query],
    queryFn: () => apiGet(`/api/v1/species?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5, // Cache species searches for 5 minutes
  })
}

export function useSpecies(id) {
  return useQuery({
    queryKey: ['species', id],
    queryFn: () => apiGet(`/api/v1/species/${id}`),
    enabled: !!id,
  })
}
```

- [ ] 7.5 — Create `client/src/hooks/useProfile.js`:

```javascript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPatch } from '../api/client'

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => apiGet('/api/v1/profile'),
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => apiPatch('/api/v1/profile', { user: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, password, passwordConfirmation }) =>
      apiPatch('/api/v1/profile/password', {
        current_password: currentPassword,
        user: { password, password_confirmation: passwordConfirmation },
      }),
  })
}
```

- [ ] 7.6 — Run lint:

```bash
./scripts/lint.sh
```

- [ ] 7.7 — Commit:

```bash
git add client/src/hooks/useDashboard.js client/src/hooks/usePlants.js \
  client/src/hooks/useRooms.js client/src/hooks/useSpecies.js \
  client/src/hooks/useProfile.js
git commit -m "feat: add TanStack Query hooks for all API endpoints

Hooks for dashboard, rooms CRUD, plants CRUD, care logs, plant photos,
species search, profile, and password change. All mutations invalidate
relevant query caches for automatic UI updates.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

**Expected outcome:** All hooks wired to the correct API endpoints with proper query keys, cache invalidation on mutations, and conditional enabling. Ready for use in page components.

---

## Task 8: Shared Components

**Files created:** `client/src/components/ProgressRing.jsx`, `client/src/components/PlantAvatar.jsx`, `client/src/components/TaskRow.jsx`, `client/src/components/SinceRibbon.jsx`, `client/src/components/RoomCard.jsx`

### Steps

- [ ] 8.1 — Create `client/src/components/ProgressRing.jsx`:

```jsx
export default function ProgressRing({ value = 0, size = 44, strokeWidth = 3, color = 'var(--leaf)', children }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (Math.min(value, 100) / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--mint)"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-ink">
          {children}
        </div>
      )}
    </div>
  )
}
```

- [ ] 8.2 — Create `client/src/components/PlantAvatar.jsx`:

```jsx
const PERSONALITY_EMOJI = {
  dramatic: '🌿',
  prickly: '🌵',
  chill: '🪴',
  needy: '🌸',
  stoic: '🌲',
}

export default function PlantAvatar({ species, size = 48 }) {
  const emoji = PERSONALITY_EMOJI[species?.personality] || '🌱'

  return (
    <div
      className="flex items-center justify-center bg-mint rounded-xl shrink-0"
      style={{ width: size, height: size, borderRadius: '22px', fontSize: size * 0.45 }}
    >
      {emoji}
    </div>
  )
}
```

- [ ] 8.3 — Create `client/src/components/TaskRow.jsx`:

```jsx
import PlantAvatar from './PlantAvatar'

const CARE_TAG_STYLES = {
  watering: { bg: 'bg-emerald/10', text: 'text-emerald', label: 'Water' },
  feeding: { bg: 'bg-sunshine/10', text: 'text-sunshine', label: 'Feed' },
}

const STATUS_STYLES = {
  overdue: { bg: 'bg-coral/10', text: 'text-coral', label: 'Overdue' },
  due_today: { bg: 'bg-leaf/10', text: 'text-leaf', label: 'Due today' },
  due_soon: { bg: 'bg-ink-soft/10', text: 'text-ink-soft', label: 'Due soon' },
}

export default function TaskRow({ plant, careType, voiceQuote, done, onComplete }) {
  const careTag = CARE_TAG_STYLES[careType] || CARE_TAG_STYLES.watering
  const statusKey = careType === 'watering' ? plant.water_status : plant.feed_status
  const statusTag = STATUS_STYLES[statusKey]
  const isOverdue = statusKey === 'overdue'

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
        done
          ? 'bg-[#F7FDF4] opacity-75'
          : isOverdue
            ? 'bg-[#FFF8F5] border border-coral/30'
            : 'bg-card border border-mint'
      }`}
    >
      <PlantAvatar species={plant.species} size={48} />

      <div className="flex-1 min-w-0">
        <p className={`text-[15px] font-extrabold text-ink ${done ? 'line-through' : ''}`}>
          {plant.nickname}
        </p>
        {voiceQuote && (
          <p className={`text-[13px] italic font-medium text-ink-soft mt-0.5 truncate ${done ? 'line-through' : ''}`}>
            {voiceQuote}
          </p>
        )}
        <div className="flex gap-1.5 mt-1.5">
          <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${careTag.bg} ${careTag.text}`}>
            {careTag.label}
          </span>
          {statusTag && (
            <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusTag.bg} ${statusTag.text}`}>
              {statusTag.label}
            </span>
          )}
        </div>
      </div>

      {/* Check circle */}
      <button
        type="button"
        onClick={onComplete}
        disabled={done}
        className="shrink-0 w-[30px] h-[30px] rounded-full border-[2.5px] flex items-center justify-center cursor-pointer transition-all bg-transparent"
        style={{
          borderColor: done ? 'var(--leaf)' : 'var(--mint)',
          background: done ? 'var(--leaf)' : 'transparent',
        }}
      >
        {done && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
    </div>
  )
}
```

- [ ] 8.4 — Create `client/src/components/SinceRibbon.jsx`:

```jsx
export default function SinceRibbon({ urgent, title, subtitle, time }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-mint">
      <div
        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
        style={{ background: urgent ? 'var(--coral)' : 'var(--leaf)' }}
      >
        {urgent ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M12 9v4" />
            <circle cx="12" cy="17" r="1" fill="white" />
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-ink">{title}</p>
        {subtitle && <p className="text-[11px] font-medium text-ink-soft mt-0.5 truncate">{subtitle}</p>}
      </div>
      {time && <span className="text-[11px] font-semibold text-ink-soft shrink-0">{time}</span>}
    </div>
  )
}
```

- [ ] 8.5 — Create `client/src/components/RoomCard.jsx`:

```jsx
export default function RoomCard({ room, attentionCount = 0, onClick }) {
  const hasAttention = attentionCount > 0

  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 rounded-xl bg-card border text-left cursor-pointer transition-all min-h-[130px] flex flex-col justify-between ${
        hasAttention ? 'border-coral/30' : 'border-mint'
      }`}
    >
      <div className="flex items-start justify-between">
        {/* Room icon tile */}
        <div className="w-9 h-9 rounded-xl bg-mint flex items-center justify-center text-emerald text-sm">
          🏠
        </div>
        {hasAttention && (
          <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-coral/10 text-coral">
            {attentionCount} thirsty
          </span>
        )}
      </div>

      <div>
        <p className="text-[15px] font-extrabold text-ink">{room.name}</p>
        <p className="text-[11px] font-semibold text-ink-soft">
          {room.plants_count} {room.plants_count === 1 ? 'plant' : 'plants'}
        </p>
      </div>
    </button>
  )
}
```

- [ ] 8.6 — Run lint:

```bash
./scripts/lint.sh
```

- [ ] 8.7 — Commit:

```bash
git add client/src/components/ProgressRing.jsx \
  client/src/components/PlantAvatar.jsx \
  client/src/components/TaskRow.jsx \
  client/src/components/SinceRibbon.jsx \
  client/src/components/RoomCard.jsx
git commit -m "feat: add shared UI components for dashboard and house screens

ProgressRing (SVG circular progress), PlantAvatar (personality emoji tiles),
TaskRow (care task with check circle), SinceRibbon (compact alert strip),
RoomCard (room grid card with attention badges).

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

**Expected outcome:** Five reusable components ready for composition in the Today and House pages. Each follows the design spec sizing, radii, and colour conventions.

---

## Task 9: Today Screen

**Files created:** `client/src/components/HeroCard.jsx`, `client/src/pages/Today.jsx`
**Files modified:** `client/src/App.jsx` (replace placeholder import)

### Steps

- [ ] 9.1 — Create `client/src/utils/careStatus.js`:

```javascript
/**
 * Compute the visual care state from a plant's data.
 * States: thriving, content, thirsty, wilting, parched
 */
export function getCareState(plant) {
  if (!plant.calculated_watering_days || !plant.last_watered_at) {
    return 'content'
  }

  const daysSinceWatered = Math.floor(
    (Date.now() - new Date(plant.last_watered_at).getTime()) / (1000 * 60 * 60 * 24),
  )
  const interval = plant.calculated_watering_days
  const elapsed = daysSinceWatered / interval

  if (elapsed <= 0.2) return 'thriving'
  if (elapsed <= 0.7) return 'content'
  if (elapsed <= 1.0) return 'thirsty'
  if (elapsed <= 1.5) return 'wilting'
  return 'parched'
}

/**
 * Get days overdue (negative = overdue, positive = days until due)
 */
export function getDaysDisplay(daysUntil) {
  if (daysUntil === null || daysUntil === undefined) return null

  if (daysUntil < 0) {
    const overdue = Math.abs(daysUntil)
    return `${overdue} day${overdue === 1 ? '' : 's'} overdue`
  }
  if (daysUntil === 0) return 'Due today'
  return `In ${daysUntil} day${daysUntil === 1 ? '' : 's'}`
}
```

- [ ] 9.2 — Create `client/src/personality/states.js`:

```javascript
/**
 * Maps care states to display properties
 */
export const CARE_STATE_CONFIG = {
  thriving: { color: 'var(--leaf)', label: 'Thriving', emoji: '✨' },
  content: { color: 'var(--emerald)', label: 'Content', emoji: '😌' },
  thirsty: { color: 'var(--sunshine)', label: 'Thirsty', emoji: '💧' },
  wilting: { color: 'var(--coral)', label: 'Wilting', emoji: '😰' },
  parched: { color: 'var(--coral)', label: 'Parched', emoji: '🆘' },
}
```

- [ ] 9.3 — Create `client/src/personality/voices.js`:

```javascript
/**
 * Voice lines by personality type and care state.
 * MVP: static variants. Phase 3: LLM-generated.
 */
const VOICES = {
  dramatic: {
    thriving: [
      "I'm having the best day. Every day is the best day.",
      'Look at me. I am MAGNIFICENT.',
      'The sun loves me. I can tell.',
    ],
    content: [
      'All is well in my little pot. Carry on.',
      "I'm doing fine. Don't worry about me. Much.",
      'Life is beautiful. As am I.',
    ],
    thirsty: [
      'I could use a drink. Take your time. I\'ll be here. Suffering quietly.',
      'Is that... dryness I feel? The AUDACITY.',
      "My leaves are drooping. This is a STATEMENT, not a request.",
    ],
    wilting: [
      "I'm wilting. This is, I fear, my villain origin story.",
      'Quickly! Time is a flat circle and I\'m crumbling.',
      'Remember me fondly. Tell my story.',
    ],
    parched: [
      'Goodbye, cruel world. Actually no - water. I need water.',
      'This is how it ends. In a pot. Unwatered. Forsaken.',
      'I see a light... is that the sun or the afterlife?',
    ],
    rewarded: [
      'Oh. OH. I feel it coursing through me. A REDEMPTION ARC.',
      'You SAVED me. This deserves an Oscar.',
      'Water! Glorious water! I am REBORN.',
    ],
  },
  prickly: {
    thriving: ["I'm fine. Stop looking at me.", "Don't touch me. I'm thriving."],
    content: ["I'm fine. I'm always fine. Don't ask.", 'Whatever.'],
    thirsty: ["Not thirsty. I'm literally a cactus. Move along.", "I don't need help. But if you're offering..."],
    wilting: ['Fine. If you must. One drop.', "This is... acceptable levels of concern."],
    parched: ["I'm NOT dying. I'm... resting.", 'Okay. Fine. Maybe one sip.'],
    rewarded: ['Fine. Thanks. Obviously I would have survived either way.', "Don't make this weird."],
  },
  chill: {
    thriving: ['All good vibes here.', 'Living the dream, no rush.'],
    content: ["Chillin'. You should try it.", 'No complaints. Never really have any.'],
    thirsty: ['Could go for a drink, no rush though.', "I'll be here whenever you get to it."],
    wilting: ['Getting a little dry, but no stress.', "It's cool. I'm cool. Everything's cool."],
    parched: ["I mean... eventually would be nice.", "Still chill. Just... very dry chill."],
    rewarded: ['Nice. Thanks.', 'Appreciate it. Back to vibing.'],
  },
  needy: {
    thriving: ["YOU'RE the best. I'm the best. WE'RE the best.", "I love you I love you I love you!"],
    content: ['I miss you. Not in a weird way. Maybe a little weird.', 'Are you there? Just checking.'],
    thirsty: [
      "It's been 3 days... not that I'm counting... I am definitely counting.",
      'Please? Pretty please? With a leaf on top?',
    ],
    wilting: ['You forgot about me, didn\'t you? I KNEW IT.', "I'm fine. I'm FINE. *visibly not fine*"],
    parched: ['DO YOU EVEN CARE ABOUT ME???', 'I thought we had something special...'],
    rewarded: ['YOU REMEMBERED! I LOVE YOU. Is this forever? Are you leaving?', 'BEST. DAY. EVER.'],
  },
  stoic: {
    thriving: ['Status: optimal.', 'All systems nominal.'],
    content: ['Adequate.', 'Proceeding as expected.'],
    thirsty: ['Hydration would be acceptable.', 'Water levels: suboptimal.'],
    wilting: ['Situation: concerning.', 'Intervention recommended.'],
    parched: ['Critical.', 'Immediate attention required.'],
    rewarded: ['Hydration received. Noted.', 'Acknowledged.'],
  },
}

/**
 * Get a random voice line for a plant's personality and state.
 * Caches selection per session to avoid re-render shuffling.
 */
const sessionCache = new Map()

export function getVoiceLine(personality, state, plantId) {
  const cacheKey = `${plantId}-${personality}-${state}`

  if (sessionCache.has(cacheKey)) {
    return sessionCache.get(cacheKey)
  }

  const lines = VOICES[personality]?.[state] || VOICES.chill?.content || ['Hello.']
  const line = lines[Math.floor(Math.random() * lines.length)]
  sessionCache.set(cacheKey, line)
  return line
}

export default VOICES
```

- [ ] 9.4 — Create `client/src/components/HeroCard.jsx`:

```jsx
import PlantAvatar from './PlantAvatar'
import { getCareState, getDaysDisplay } from '../utils/careStatus'
import { getVoiceLine } from '../personality/voices'

export default function HeroCard({ plant, onWater }) {
  const state = getCareState(plant)
  const voice = getVoiceLine(plant.species?.personality || 'chill', state, plant.id)
  const overdueDisplay = getDaysDisplay(plant.days_until_water)
  const isOverdue = plant.days_until_water !== null && plant.days_until_water < 0

  return (
    <div
      className="relative rounded-2xl p-6 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, var(--forest), var(--forest-2))`,
        borderRadius: '28px',
      }}
    >
      {/* Coral radial glow for urgency */}
      {isOverdue && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 80% 100%, rgba(255,107,61,0.25) 0%, transparent 60%)',
          }}
        />
      )}

      <div className="relative z-10 max-w-[220px]">
        {/* Title line */}
        <div className="flex items-center gap-2 mb-3">
          {isOverdue && (
            <div className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
          )}
          <span className="text-[13px] font-extrabold uppercase tracking-[0.04em] text-lime">
            {plant.nickname}
          </span>
        </div>

        {/* Speech quote */}
        <div className="border-l-[3px] border-coral pl-3.5 mb-4">
          <p className="text-[22px] font-bold italic text-white leading-snug lg:font-display lg:text-4xl lg:font-medium">
            {voice}
          </p>
        </div>

        {/* Meta row */}
        <p className="text-[13px] text-white/70 font-semibold mb-4">
          {plant.room?.name}
          {isOverdue && overdueDisplay && (
            <>
              {' · '}
              <span className="text-coral">
                {'⏰ '}
                {overdueDisplay}
              </span>
            </>
          )}
        </p>

        {/* CTA */}
        <button
          type="button"
          onClick={onWater}
          className="px-5 py-2.5 rounded-full font-extrabold text-sm cursor-pointer border-0 transition-transform active:scale-95"
          style={{
            background: 'var(--lime)',
            color: 'var(--forest)',
            boxShadow: '0 4px 12px rgba(134,219,101,0.4)',
          }}
        >
          {`Water ${plant.nickname} →`}
        </button>
      </div>

      {/* Plant avatar (right side) */}
      <div className="absolute bottom-4 right-4 opacity-80">
        <PlantAvatar species={plant.species} size={80} />
      </div>
    </div>
  )
}
```

- [ ] 9.5 — Create `client/src/pages/Today.jsx`:

```jsx
import { useMemo } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import { useLogCare } from '../hooks/usePlants'
import { useAuth } from '../hooks/useAuth'
import HeroCard from '../components/HeroCard'
import SinceRibbon from '../components/SinceRibbon'
import ProgressRing from '../components/ProgressRing'
import TaskRow from '../components/TaskRow'
import { getCareState } from '../utils/careStatus'
import { getVoiceLine } from '../personality/voices'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })
}

export default function Today() {
  const { user } = useAuth()
  const { data, isLoading, error } = useDashboard()

  // Build task list from dashboard data
  const tasks = useMemo(() => {
    if (!data) return []

    const items = []

    // Plants needing water
    for (const plant of data.plants_needing_water || []) {
      items.push({ plant, careType: 'watering', done: false })
    }

    // Plants needing feeding
    for (const plant of data.plants_needing_feeding || []) {
      items.push({ plant, careType: 'feeding', done: false })
    }

    // Sort: overdue first, then due_today
    items.sort((a, b) => {
      const priority = { overdue: 0, due_today: 1, due_soon: 2 }
      const aStatus = a.careType === 'watering' ? a.plant.water_status : a.plant.feed_status
      const bStatus = b.careType === 'watering' ? b.plant.water_status : b.plant.feed_status
      return (priority[aStatus] ?? 3) - (priority[bStatus] ?? 3)
    })

    return items
  }, [data])

  // Find the most urgent plant for the hero card
  const urgentPlant = useMemo(() => {
    if (!data?.plants_needing_water?.length) return null

    const overdue = data.plants_needing_water.filter((p) => p.water_status === 'overdue')
    if (!overdue.length) return null

    // Pick the most overdue
    return overdue.reduce((worst, p) =>
      (p.days_until_water ?? 0) < (worst.days_until_water ?? 0) ? p : worst,
    )
  }, [data])

  const totalTasks = tasks.length
  const doneTasks = tasks.filter((t) => t.done).length
  const progressPercent = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50dvh]">
        <div className="w-8 h-8 border-3 border-leaf border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-coral font-bold">Failed to load dashboard.</p>
      </div>
    )
  }

  return (
    <div className="px-5 pt-3 lg:px-14 lg:pt-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-sm font-semibold text-ink-soft">
            {`${getGreeting()} · ${formatDate()}`}
          </p>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight mt-1 lg:font-display lg:text-5xl lg:italic">
            {'Hi, '}
            <span className="text-leaf">{user?.name || 'there'}</span>
          </h1>
        </div>
        <div className="w-[52px] h-[52px] rounded-full bg-mint flex items-center justify-center text-emerald font-bold text-lg shrink-0">
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>
      </div>

      {/* Hero card (urgent state only) */}
      {urgentPlant && (
        <div className="mb-4">
          <WaterableHeroCard plant={urgentPlant} />
        </div>
      )}

      {/* Since ribbon */}
      <div className="mb-6">
        {urgentPlant ? (
          <SinceRibbon
            urgent
            title={`${tasks.length} thing${tasks.length === 1 ? '' : 's'} need attention`}
            subtitle={tasks.slice(0, 2).map((t) => `${t.plant.nickname} needs ${t.careType === 'watering' ? 'water' : 'feeding'}`).join(', ')}
          />
        ) : (
          <SinceRibbon
            urgent={false}
            title="You're on top of things"
            subtitle={totalTasks > 0 ? `${doneTasks} ritual${doneTasks === 1 ? '' : 's'} done today` : 'No tasks for today'}
          />
        )}
      </div>

      {/* Today's rituals */}
      {totalTasks > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[22px] font-extrabold text-ink tracking-tight">{"Today's rituals"}</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-soft font-semibold">
                <strong className="text-ink">{doneTasks} done</strong>
                {` / ${totalTasks - doneTasks} to go`}
              </span>
              <ProgressRing value={progressPercent} size={44} strokeWidth={3}>
                <span className="text-[11px]">{`${doneTasks}/${totalTasks}`}</span>
              </ProgressRing>
            </div>
          </div>

          <div className="space-y-2 pb-8">
            {tasks.map((task) => (
              <WaterableTaskRow
                key={`${task.plant.id}-${task.careType}`}
                task={task}
              />
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {totalTasks === 0 && !urgentPlant && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🌱</div>
          <h2 className="text-xl font-extrabold text-ink mb-2">No tasks today</h2>
          <p className="text-sm text-ink-soft">
            {data?.stats?.total_plants > 0
              ? 'All your plants are happy. Check back later.'
              : 'Add your first plant to get started.'}
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Wrapper for HeroCard that handles the water mutation
 */
function WaterableHeroCard({ plant }) {
  const logCare = useLogCare(plant.id)

  function handleWater() {
    logCare.mutate({ care_type: 'watering' })
  }

  return <HeroCard plant={plant} onWater={handleWater} />
}

/**
 * Wrapper for TaskRow that handles the care mutation
 */
function WaterableTaskRow({ task }) {
  const logCare = useLogCare(task.plant.id)
  const state = getCareState(task.plant)
  const voice = getVoiceLine(task.plant.species?.personality || 'chill', state, task.plant.id)

  function handleComplete() {
    logCare.mutate({ care_type: task.careType })
  }

  return (
    <TaskRow
      plant={task.plant}
      careType={task.careType}
      voiceQuote={voice}
      done={logCare.isSuccess}
      onComplete={handleComplete}
    />
  )
}
```

- [ ] 9.6 — Update `client/src/App.jsx` to import Today:

```jsx
import Today from './pages/Today'

// In the protected routes:
<Route index element={<Today />} />
```

- [ ] 9.7 — Add Playwright test. Create `client/tests/today.spec.js`:

```javascript
import { expect, test } from '@playwright/test'

test('Today page shows greeting or login redirect', async ({ page }) => {
  await page.goto('/')
  // Either shows Today content (if authenticated) or redirects to login
  const isLoginPage = page.url().includes('/login')
  const hasGreeting = await page.locator('text=/Good (morning|afternoon|evening)/').isVisible().catch(() => false)
  expect(isLoginPage || hasGreeting).toBeTruthy()
})
```

- [ ] 9.8 — Run lint + tests:

```bash
./scripts/lint.sh
./scripts/run_tests.sh client
```

- [ ] 9.9 — Commit:

```bash
git add client/src/pages/Today.jsx client/src/components/HeroCard.jsx \
  client/src/utils/careStatus.js client/src/personality/states.js \
  client/src/personality/voices.js client/src/App.jsx \
  client/tests/today.spec.js
git commit -m "feat: add Today dashboard with hero card and care rituals

Today screen shows greeting, conditional urgent hero card with personality
voice, since ribbon, progress ring, and task rows with care logging.
Includes careStatus utility, personality voice library (5 archetypes x 6
states), and care state configuration.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

**Expected outcome:** `/` (when authenticated) shows time-based greeting, user avatar, optional hero card for most overdue plant, since ribbon, progress ring, and task rows. Tapping check circles or hero CTA logs care via `POST /api/v1/plants/:id/care_logs` and updates the UI via TanStack Query cache invalidation. Voice lines match plant personality and care state.

---

## Task 10: House Screen

**Files created:** `client/src/pages/House.jsx`
**Files modified:** `client/src/App.jsx` (replace placeholder import)

### Steps

- [ ] 10.1 — Create `client/src/pages/House.jsx`:

```jsx
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRooms } from '../hooks/useRooms'
import { usePlants } from '../hooks/usePlants'
import RoomCard from '../components/RoomCard'
import PlantAvatar from '../components/PlantAvatar'

const VIEW_MODES = ['Rooms', 'List']

export default function House() {
  const [viewMode, setViewMode] = useState('Rooms')
  const [searchQuery, setSearchQuery] = useState('')
  const { data: rooms, isLoading: roomsLoading } = useRooms()
  const { data: plants, isLoading: plantsLoading } = usePlants()
  const navigate = useNavigate()

  const isLoading = roomsLoading || plantsLoading

  // Count overdue plants per room
  const roomAttention = useMemo(() => {
    if (!plants) return {}

    const counts = {}
    for (const plant of plants) {
      if (plant.water_status === 'overdue' || plant.feed_status === 'overdue') {
        counts[plant.room?.id] = (counts[plant.room?.id] || 0) + 1
      }
    }
    return counts
  }, [plants])

  // Filtered plants for list view
  const filteredPlants = useMemo(() => {
    if (!plants) return []
    if (!searchQuery) return plants

    const query = searchQuery.toLowerCase()
    return plants.filter(
      (p) =>
        p.nickname.toLowerCase().includes(query) ||
        p.species?.common_name?.toLowerCase().includes(query) ||
        p.room?.name?.toLowerCase().includes(query),
    )
  }, [plants, searchQuery])

  const totalPlants = plants?.length || 0
  const totalRooms = rooms?.length || 0
  const overdueCount = Object.values(roomAttention).reduce((sum, n) => sum + n, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50dvh]">
        <div className="w-8 h-8 border-3 border-leaf border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-5 pt-3 lg:px-14 lg:pt-10">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-ink-soft bg-mint px-2 py-0.5 rounded-full">
            House · {viewMode}
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-ink tracking-tight">
          {totalRooms > 0
            ? `${totalRooms} room${totalRooms === 1 ? '' : 's'}, ${totalPlants} plant${totalPlants === 1 ? '' : 's'}.`
            : 'No rooms yet'}
        </h1>
        {overdueCount > 0 && (
          <p className="text-sm text-ink-soft mt-1">
            {'All in good health - except '}
            <span className="text-coral font-bold">{overdueCount} need water</span>
          </p>
        )}
      </div>

      {/* View toggle */}
      <div className="flex gap-1 bg-mint p-1 rounded-full mb-6 w-fit">
        {VIEW_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer border-0 transition-all ${
              viewMode === mode ? 'bg-card text-ink shadow-sm' : 'bg-transparent text-ink-soft'
            }`}
          >
            {mode}
          </button>
        ))}
        <button
          type="button"
          disabled
          className="px-4 py-1.5 rounded-full text-xs font-bold cursor-not-allowed border-0 bg-transparent text-ink-soft/50"
          title="Coming in Phase 3"
        >
          Greenhouse
        </button>
      </div>

      {/* Rooms view */}
      {viewMode === 'Rooms' && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 pb-8">
          {rooms?.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              attentionCount={roomAttention[room.id] || 0}
              onClick={() => {
                setViewMode('List')
                // Could navigate to a room-filtered list; for now just switch to list view
              }}
            />
          ))}
          {(!rooms || rooms.length === 0) && (
            <div className="col-span-2 text-center py-12">
              <p className="text-ink-soft">No rooms yet. Add one in the onboarding wizard.</p>
            </div>
          )}
        </div>
      )}

      {/* List view */}
      {viewMode === 'List' && (
        <div>
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-card border border-mint text-ink text-sm outline-none focus:border-leaf mb-4"
            placeholder="Search plants..."
          />

          <div className="space-y-2 pb-8">
            {filteredPlants.map((plant) => (
              <button
                key={plant.id}
                type="button"
                onClick={() => navigate(`/plants/${plant.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-mint text-left cursor-pointer hover:border-leaf/50 transition-colors"
              >
                <PlantAvatar species={plant.species} size={48} />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-extrabold text-ink">{plant.nickname}</p>
                  <p className="text-[13px] text-ink-soft truncate">
                    {plant.species?.common_name || 'Unknown species'} · {plant.room?.name}
                  </p>
                </div>
                {(plant.water_status === 'overdue' || plant.feed_status === 'overdue') && (
                  <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-coral/10 text-coral shrink-0">
                    Needs care
                  </span>
                )}
              </button>
            ))}
            {filteredPlants.length === 0 && (
              <div className="text-center py-12">
                <p className="text-ink-soft">
                  {searchQuery ? 'No plants match your search.' : 'No plants yet.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] 10.2 — Update `client/src/App.jsx` to import House:

```jsx
import House from './pages/House'

// In the protected routes:
<Route path="house" element={<House />} />
```

- [ ] 10.3 — Run lint + tests:

```bash
./scripts/lint.sh
./scripts/run_tests.sh client
```

- [ ] 10.4 — Commit:

```bash
git add client/src/pages/House.jsx client/src/App.jsx
git commit -m "feat: add House screen with rooms grid and plant list views

Rooms view shows 2x2 (mobile) / 3xN (desktop) grid of room cards with
attention badges for overdue plants. List view shows all plants with
search, species, room, and care status. Disabled Greenhouse toggle
placeholder for Phase 3.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

**Expected outcome:** `/house` shows rooms grid by default with plant counts and coral attention badges. Toggle to List view shows searchable, clickable plant rows. Clicking a plant navigates to `/plants/:id`.

---

## Task 11: Plant Detail

**Files created:** `client/src/pages/PlantDetail.jsx`
**Files modified:** `client/src/App.jsx` (replace placeholder import)

### Steps

- [ ] 11.1 — Create `client/src/pages/PlantDetail.jsx`:

```jsx
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePlant, useCareLogs, useLogCare, usePlantPhotos } from '../hooks/usePlants'
import PlantAvatar from '../components/PlantAvatar'
import ProgressRing from '../components/ProgressRing'
import { getCareState, getDaysDisplay } from '../utils/careStatus'
import { getVoiceLine } from '../personality/voices'
import { CARE_STATE_CONFIG } from '../personality/states'

const TABS = ['History', 'Photos', 'Care', 'Species']

export default function PlantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('History')
  const { data: plant, isLoading } = usePlant(id)
  const { data: careLogs } = useCareLogs(id)
  const { data: photos } = usePlantPhotos(id)
  const logCare = useLogCare(id)

  // Derived values computed inline — getCareState/getVoiceLine are cheap pure
  // functions and the ring percentages are basic arithmetic, so useMemo would
  // cost more than it saves. React best-practice rule:
  // rerender-simple-expression-in-memo.
  const careState = plant ? getCareState(plant) : 'content'
  const stateConfig = CARE_STATE_CONFIG[careState]
  const voice = plant ? getVoiceLine(plant.species?.personality || 'chill', careState, plant.id) : ''

  const waterPercent =
    plant?.calculated_watering_days && plant?.days_until_water
      ? Math.min(
          100,
          Math.max(0, ((plant.calculated_watering_days - plant.days_until_water) / plant.calculated_watering_days) * 100),
        )
      : 50

  const feedPercent =
    plant?.calculated_feeding_days && plant?.days_until_feed
      ? Math.min(
          100,
          Math.max(0, ((plant.calculated_feeding_days - plant.days_until_feed) / plant.calculated_feeding_days) * 100),
        )
      : 50

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50dvh]">
        <div className="w-8 h-8 border-3 border-leaf border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!plant) {
    return (
      <div className="p-6">
        <p className="text-coral font-bold">Plant not found.</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-4 text-leaf font-bold bg-transparent border-0 cursor-pointer"
        >
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="pb-8">
      {/* Back button */}
      <div className="px-5 pt-3 lg:px-14 lg:pt-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm font-bold text-ink-soft bg-transparent border-0 cursor-pointer mb-4"
        >
          ← Back
        </button>
      </div>

      {/* Portrait hero card */}
      <div
        className="mx-5 lg:mx-14 rounded-2xl p-6 relative overflow-hidden"
        style={{ background: 'var(--gradient-forest)', borderRadius: '28px' }}
      >
        <div className="relative z-10 max-w-[240px] lg:max-w-[440px]">
          <h1 className="font-display text-3xl lg:text-4xl italic text-white font-medium mb-1">
            {plant.nickname}
          </h1>
          {plant.species && (
            <p className="text-sm italic text-white/70 mb-3">{plant.species.common_name}</p>
          )}
          <div className="flex gap-2 mb-4">
            {plant.species?.personality && (
              <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-lime/20 text-lime">
                {plant.species.personality}
              </span>
            )}
            <span
              className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ background: `${stateConfig.color}33`, color: stateConfig.color }}
            >
              {`${stateConfig.emoji} ${stateConfig.label}`}
            </span>
          </div>

          {/* Voice quote card */}
          <div className="bg-white/10 rounded-xl p-3 border-l-[3px] border-lime/60">
            <p className="text-sm italic text-white/90 font-display font-medium">{voice}</p>
          </div>
        </div>
        <div className="absolute bottom-4 right-4">
          <PlantAvatar species={plant.species} size={80} />
        </div>
      </div>

      {/* Care rings row */}
      <div className="flex justify-center gap-6 py-6 px-5">
        <div className="flex flex-col items-center gap-1">
          <ProgressRing
            value={100 - waterPercent}
            size={54}
            strokeWidth={4}
            color={waterPercent > 70 ? 'var(--coral)' : 'var(--leaf)'}
          >
            <span className="text-base">💧</span>
          </ProgressRing>
          <span className="text-[10px] font-bold text-ink-soft">Water</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <ProgressRing
            value={100 - feedPercent}
            size={54}
            strokeWidth={4}
            color={feedPercent > 70 ? 'var(--coral)' : 'var(--leaf)'}
          >
            <span className="text-base">🌱</span>
          </ProgressRing>
          <span className="text-[10px] font-bold text-ink-soft">Feed</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <ProgressRing value={careState === 'thriving' ? 100 : careState === 'content' ? 70 : 30} size={54} strokeWidth={4} color={stateConfig.color}>
            <span className="text-base">{stateConfig.emoji}</span>
          </ProgressRing>
          <span className="text-[10px] font-bold text-ink-soft">Mood</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 px-5 lg:px-14 mb-6">
        <button
          type="button"
          onClick={() => logCare.mutate({ care_type: 'watering' })}
          disabled={logCare.isPending}
          className="flex-1 py-3 rounded-full text-white font-extrabold text-sm cursor-pointer border-0 transition-transform active:scale-95 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, var(--leaf), var(--emerald))' }}
        >
          💧 Water
        </button>
        <button
          type="button"
          onClick={() => logCare.mutate({ care_type: 'feeding' })}
          disabled={logCare.isPending}
          className="flex-1 py-3 rounded-full bg-mint text-emerald font-extrabold text-sm cursor-pointer border-0 transition-transform active:scale-95"
        >
          🌱 Feed
        </button>
        <button
          type="button"
          className="py-3 px-4 rounded-full bg-mint text-emerald font-extrabold text-sm cursor-pointer border-0"
          title="Photo"
        >
          📷
        </button>
      </div>

      {/* Tabbed section */}
      <div className="mx-5 lg:mx-14 bg-card rounded-2xl border border-mint overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-mint">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-bold cursor-pointer border-0 bg-transparent transition-all ${
                activeTab === tab ? 'text-leaf border-b-2 border-leaf' : 'text-ink-soft'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* History tab */}
          {activeTab === 'History' && (
            <div className="space-y-3">
              {careLogs?.length > 0 ? (
                careLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 py-2 border-b border-mint/50 last:border-0">
                    <span className="text-lg">{log.care_type === 'watering' ? '💧' : '🌱'}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-ink capitalize">{log.care_type}</p>
                      {log.notes && <p className="text-xs text-ink-soft">{log.notes}</p>}
                    </div>
                    <span className="text-xs text-ink-soft">
                      {new Date(log.performed_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-ink-soft text-center py-4">No care history yet.</p>
              )}
            </div>
          )}

          {/* Photos tab */}
          {activeTab === 'Photos' && (
            <div>
              {photos?.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo) => (
                    <div key={photo.id} className="aspect-square rounded-xl bg-mint overflow-hidden">
                      {photo.url && (
                        <img src={photo.url} alt="Plant" className="w-full h-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-soft text-center py-4">No photos yet. Tap the camera button to add one.</p>
              )}
            </div>
          )}

          {/* Care tab */}
          {activeTab === 'Care' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-mint/50">
                <span className="text-lg">🏠</span>
                <div>
                  <p className="text-sm font-bold text-ink">{plant.room?.name || 'No room'}</p>
                  <p className="text-xs text-ink-soft">Current room</p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-ink-soft uppercase tracking-wider mb-2">Schedule</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-mint/50">
                    <span className="text-sm font-bold text-ink">
                      💧 Every {plant.calculated_watering_days} days
                    </span>
                    <span className="text-xs font-semibold text-ink-soft">
                      {getDaysDisplay(plant.days_until_water)}
                    </span>
                  </div>
                  {plant.calculated_feeding_days && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-mint/50">
                      <span className="text-sm font-bold text-ink">
                        🌱 Every {plant.calculated_feeding_days} days
                      </span>
                      <span className="text-xs font-semibold text-ink-soft">
                        {getDaysDisplay(plant.days_until_feed)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-ink-soft uppercase tracking-wider mb-2">Environment</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-xl bg-mint/50 text-center">
                    <p className="text-xs text-ink-soft mb-1">Light</p>
                    <p className="text-sm font-bold text-ink capitalize">{plant.light_level}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-mint/50 text-center">
                    <p className="text-xs text-ink-soft mb-1">Temp</p>
                    <p className="text-sm font-bold text-ink capitalize">{plant.temperature_level}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-mint/50 text-center">
                    <p className="text-xs text-ink-soft mb-1">Humidity</p>
                    <p className="text-sm font-bold text-ink capitalize">{plant.humidity_level}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Species tab */}
          {activeTab === 'Species' && plant.species && (
            <div className="space-y-4">
              <div
                className="p-4 rounded-2xl text-white"
                style={{ background: 'var(--gradient-forest)' }}
              >
                <p className="font-display text-xl italic font-medium">{plant.species.scientific_name || plant.species.common_name}</p>
                <p className="text-sm text-white/70 mt-1">{plant.species.common_name}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {plant.species.difficulty && (
                  <div className="p-3 rounded-xl bg-mint/50 text-center">
                    <p className="text-xs text-ink-soft mb-1">Difficulty</p>
                    <p className="text-sm font-bold text-ink capitalize">{plant.species.difficulty}</p>
                  </div>
                )}
                {plant.species.growth_rate && (
                  <div className="p-3 rounded-xl bg-mint/50 text-center">
                    <p className="text-xs text-ink-soft mb-1">Growth</p>
                    <p className="text-sm font-bold text-ink capitalize">{plant.species.growth_rate}</p>
                  </div>
                )}
                {plant.species.toxicity && (
                  <div className="p-3 rounded-xl bg-coral/10 text-center border border-coral/20">
                    <p className="text-xs text-coral mb-1">Toxicity</p>
                    <p className="text-sm font-bold text-coral capitalize">{plant.species.toxicity}</p>
                  </div>
                )}
              </div>

              {plant.species.description && (
                <div>
                  <h3 className="text-xs font-bold text-ink-soft uppercase tracking-wider mb-2">About</h3>
                  <p className="text-sm text-ink leading-relaxed">{plant.species.description}</p>
                </div>
              )}

              {plant.species.care_tips && (
                <div>
                  <h3 className="text-xs font-bold text-ink-soft uppercase tracking-wider mb-2">Care tips</h3>
                  <p className="text-sm text-ink leading-relaxed">{plant.species.care_tips}</p>
                </div>
              )}

              {plant.species.personality && (
                <div className="p-3 rounded-xl bg-mint/50">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald/10 text-emerald">
                    {plant.species.personality}
                  </span>
                  <p className="text-sm text-ink mt-2 italic">
                    {`This plant has a ${plant.species.personality} personality.`}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Species' && !plant.species && (
            <p className="text-sm text-ink-soft text-center py-4">No species information available.</p>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] 11.2 — Update `client/src/App.jsx` to import PlantDetail:

```jsx
import PlantDetail from './pages/PlantDetail'

// In the protected routes:
<Route path="plants/:id" element={<PlantDetail />} />
```

- [ ] 11.3 — Run lint + tests:

```bash
./scripts/lint.sh
./scripts/run_tests.sh client
```

- [ ] 11.4 — Commit:

```bash
git add client/src/pages/PlantDetail.jsx client/src/App.jsx
git commit -m "feat: add Plant Detail page with care rings, quick actions, and tabs

Portrait hero card with personality voice, care rings row (water/feed/mood),
quick action buttons for water and feed, and tabbed section with History,
Photos, Care (room + schedule + environment), and Species (scientific name,
difficulty, toxicity, personality) tabs.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

**Expected outcome:** `/plants/:id` shows full plant detail with forest gradient hero, care rings, water/feed buttons that log care, and four tabs. History shows care log timeline. Care shows room, schedule, and environment. Species shows botanical details and personality.

---

## Task 12: Add Plant Flow

**Files created:** `client/src/pages/AddPlant.jsx`
**Files modified:** `client/src/App.jsx` (replace placeholder import)

### Steps

- [ ] 12.1 — Create `client/src/pages/AddPlant.jsx`:

```jsx
import { useCallback, useDeferredValue, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Drawer } from 'vaul'
import { useRooms } from '../hooks/useRooms'
import { useCreatePlant } from '../hooks/usePlants'
import { useSpeciesSearch } from '../hooks/useSpecies'

export default function AddPlant() {
  const [step, setStep] = useState('search') // search | details
  const [speciesQuery, setSpeciesQuery] = useState('')
  const [selectedSpecies, setSelectedSpecies] = useState(null)
  const [nickname, setNickname] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  const [environment, setEnvironment] = useState({
    light_level: 'medium',
    temperature_level: 'average',
    humidity_level: 'average',
  })
  const navigate = useNavigate()
  const { data: rooms } = useRooms()
  const createPlant = useCreatePlant()
  // Defer the query value fed into TanStack so we don't fire a request per
  // keystroke — React will keep the input responsive and run the search with
  // the latest stable value. Rule: rerender-use-deferred-value.
  const deferredQuery = useDeferredValue(speciesQuery)
  const { data: speciesResults } = useSpeciesSearch(deferredQuery)

  const handleSelectSpecies = useCallback((species) => {
    setSelectedSpecies(species)
    setNickname('')
    setStep('details')
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!selectedSpecies || !selectedRoomId) return

    try {
      const plant = await createPlant.mutateAsync({
        species_id: selectedSpecies.id,
        room_id: selectedRoomId,
        nickname: nickname || selectedSpecies.common_name,
        ...environment,
      })
      navigate(`/plants/${plant.id}`)
    } catch {
      // Error handled by mutation
    }
  }, [selectedSpecies, selectedRoomId, nickname, environment, createPlant, navigate])

  return (
    <Drawer.Root open onOpenChange={(open) => !open && navigate(-1)}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }} />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-[28px] max-h-[85dvh] overflow-y-auto">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-4">
            <div className="w-10 h-1 rounded-full bg-ink-soft/20" />
          </div>

          <div className="px-6 pb-8">
            {/* Search step */}
            {step === 'search' && (
              <>
                <h2 className="text-xl font-extrabold text-ink mb-1">Add a new plant</h2>
                <p className="text-sm text-ink-soft mb-4">Search for a species to get started.</p>

                <input
                  type="text"
                  value={speciesQuery}
                  onChange={(e) => setSpeciesQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-mint/50 border border-mint text-ink text-sm outline-none focus:border-leaf mb-3"
                  placeholder="Search species (e.g. Monstera, Fern...)"
                  autoFocus
                />

                <div className="space-y-2 max-h-[40dvh] overflow-y-auto">
                  {speciesResults?.map((species) => (
                    <button
                      key={species.id || species.common_name}
                      type="button"
                      onClick={() => handleSelectSpecies(species)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-mint text-left cursor-pointer hover:border-leaf transition-colors"
                    >
                      <div>
                        <p className="text-sm font-bold text-ink">{species.common_name}</p>
                        {species.scientific_name && (
                          <p className="text-xs text-ink-soft italic">{species.scientific_name}</p>
                        )}
                      </div>
                      {species.personality && (
                        <span className="text-xs font-bold text-emerald bg-mint px-2 py-1 rounded-full">
                          {species.personality}
                        </span>
                      )}
                    </button>
                  ))}
                  {speciesQuery.length >= 2 && speciesResults?.length === 0 && (
                    <p className="text-sm text-ink-soft text-center py-4">No species found.</p>
                  )}
                </div>
              </>
            )}

            {/* Details step */}
            {step === 'details' && selectedSpecies && (
              <>
                <button
                  type="button"
                  onClick={() => setStep('search')}
                  className="text-sm font-bold text-ink-soft bg-transparent border-0 cursor-pointer mb-4"
                >
                  ← Back to search
                </button>

                {/* Species mini-card */}
                <div
                  className="p-4 rounded-2xl text-white mb-4"
                  style={{ background: 'var(--gradient-forest)' }}
                >
                  <p className="text-lg font-extrabold">{selectedSpecies.common_name}</p>
                  {selectedSpecies.scientific_name && (
                    <p className="text-sm italic opacity-80">{selectedSpecies.scientific_name}</p>
                  )}
                </div>

                {/* Nickname */}
                <label className="block mb-4">
                  <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">
                    What should we call them?
                  </span>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="mt-1 w-full px-4 py-3 rounded-xl bg-mint/50 border border-mint text-ink text-sm outline-none focus:border-leaf"
                    placeholder={selectedSpecies.common_name}
                  />
                </label>

                {/* Room picker */}
                <div className="mb-4">
                  <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">Room</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {rooms?.map((room) => (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => setSelectedRoomId(room.id)}
                        className={`px-4 py-2 rounded-full text-sm font-bold cursor-pointer border transition-all ${
                          selectedRoomId === room.id
                            ? 'bg-leaf text-white border-leaf'
                            : 'bg-card text-ink border-mint hover:border-leaf/50'
                        }`}
                      >
                        {room.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Environment controls */}
                {[
                  { key: 'light_level', label: 'Light', options: ['low', 'medium', 'bright'] },
                  { key: 'temperature_level', label: 'Temperature', options: ['cool', 'average', 'warm'] },
                  { key: 'humidity_level', label: 'Humidity', options: ['dry', 'average', 'humid'] },
                ].map(({ key, label, options }) => (
                  <div key={key} className="mb-4">
                    <label className="text-xs font-bold text-ink-soft uppercase tracking-wider">{label}</label>
                    <div className="flex gap-1 mt-2 bg-mint p-1 rounded-full">
                      {options.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setEnvironment((prev) => ({ ...prev, [key]: option }))}
                          className={`flex-1 py-2 rounded-full text-xs font-bold cursor-pointer border-0 capitalize transition-all ${
                            environment[key] === option ? 'bg-card text-ink shadow-sm' : 'bg-transparent text-ink-soft'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Submit */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!selectedRoomId || createPlant.isPending}
                  className="w-full py-3 rounded-full text-white font-extrabold text-sm cursor-pointer border-0 disabled:opacity-40 transition-transform active:scale-95"
                  style={{ background: 'linear-gradient(135deg, var(--leaf), var(--emerald))' }}
                >
                  {createPlant.isPending ? 'Adding...' : 'Add to garden'}
                </button>

                {createPlant.isError && (
                  <p className="text-sm text-coral font-semibold mt-3 text-center">
                    {createPlant.error?.message || 'Failed to add plant.'}
                  </p>
                )}
              </>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
```

- [ ] 12.2 — Update `client/src/App.jsx` to import AddPlant:

```jsx
import AddPlant from './pages/AddPlant'

// In the protected routes:
<Route path="add-plant" element={<AddPlant />} />
```

- [ ] 12.3 — Run lint + tests:

```bash
./scripts/lint.sh
./scripts/run_tests.sh client
```

- [ ] 12.4 — Commit:

```bash
git add client/src/pages/AddPlant.jsx client/src/App.jsx
git commit -m "feat: add plant flow as Vaul bottom sheet with species search

Two-step bottom sheet: species search with debounced results, then confirm
details with nickname, room picker chips, and environment segmented controls.
Creates plant via API and navigates to plant detail on success.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

**Expected outcome:** Tapping the FAB (or navigating to `/add-plant`) opens a Vaul bottom sheet. Search species, select one, enter nickname, pick room, set environment, and tap "Add to garden". Plant is created and user navigates to the new plant's detail page.

---

## Task 13: Care Logging + Basic Animations

**Files modified:** `client/src/components/HeroCard.jsx`, `client/src/components/TaskRow.jsx`, `client/src/pages/Today.jsx`

### Steps

- [ ] 13.1 — Update `client/src/components/HeroCard.jsx` to wrap with Framer Motion:

Add `motion` import and wrap the root div:

```jsx
import { motion } from 'motion/react'

// Wrap the root div with motion.div:
<motion.div
  layout
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.96 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
  className="relative rounded-2xl p-6 overflow-hidden"
  style={{ ... }}
>
  {/* existing content */}
</motion.div>
```

Add button tap animation:

```jsx
<motion.button
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.08, type: 'spring' }}
  // ... existing button props
>
```

- [ ] 13.2 — Update `client/src/components/TaskRow.jsx` to add check animation:

Add `motion` import and animate the check circle:

```jsx
import { motion } from 'motion/react'

// Replace the check button with:
<motion.button
  type="button"
  onClick={onComplete}
  disabled={done}
  whileTap={{ scale: 0.85 }}
  className="..."
  style={{ ... }}
>
  {done && (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <svg width="14" height="14" ...>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </motion.div>
  )}
</motion.button>
```

- [ ] 13.3 — Update `client/src/pages/Today.jsx` to use AnimatePresence and LayoutGroup:

```jsx
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'

// Wrap the return in LayoutGroup:
<LayoutGroup>
  {/* Header */}
  ...

  {/* Hero card with AnimatePresence */}
  <AnimatePresence mode="wait">
    {urgentPlant && (
      <motion.div
        key={urgentPlant.id}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.3 }}
        className="mb-4"
      >
        <WaterableHeroCard plant={urgentPlant} />
      </motion.div>
    )}
  </AnimatePresence>

  {/* Remaining content with layout prop for sweep-up */}
  <motion.div layout>
    {/* since ribbon, tasks header, tasks */}
  </motion.div>
</LayoutGroup>
```

- [ ] 13.4 — Run lint + tests:

```bash
./scripts/lint.sh
./scripts/run_tests.sh client
```

- [ ] 13.5 — Commit:

```bash
git add client/src/components/HeroCard.jsx client/src/components/TaskRow.jsx \
  client/src/pages/Today.jsx
git commit -m "feat: add Framer Motion animations for care interactions

AnimatePresence on hero card for enter/exit/cross-fade, LayoutGroup for
automatic sweep-up when hero unmounts, spring-based check circle animation
on task completion, and tap scale on buttons.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

**Expected outcome:** When a plant is watered via hero CTA or task row, the hero card fades out (if no more overdue plants) and content below sweeps up smoothly. Check circles animate with a spring scale. Task completion is visually satisfying.

---

## Task 14: Profile + Polish

**Files created:** `client/src/pages/Me.jsx`, `client/src/pages/Discover.jsx`
**Files modified:** `client/src/App.jsx` (replace remaining placeholder imports)

### Steps

- [ ] 14.1 — Create `client/src/pages/Me.jsx`:

```jsx
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProfile, useUpdateProfile, useChangePassword } from '../hooks/useProfile'

export default function Me() {
  const { user, logout } = useAuth()
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const [changingPassword, setChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState(null)

  function handleEditProfile() {
    setName(profile?.name || '')
    setEmail(profile?.email || '')
    setEditing(true)
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    try {
      await updateProfile.mutateAsync({ name, email })
      setEditing(false)
    } catch {
      // Error shown by mutation
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPasswordMessage(null)
    try {
      await changePassword.mutateAsync({
        currentPassword,
        password: newPassword,
        passwordConfirmation: confirmPassword,
      })
      setPasswordMessage({ type: 'success', text: 'Password updated successfully.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setChangingPassword(false)
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to update password.' })
    }
  }

  const displayUser = profile || user

  return (
    <div className="px-5 pt-3 lg:px-14 lg:pt-10 pb-8">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-mint flex items-center justify-center text-emerald font-extrabold text-2xl">
          {displayUser?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{displayUser?.name}</h1>
          <p className="text-sm text-ink-soft">{displayUser?.email}</p>
        </div>
      </div>

      {/* Profile edit */}
      <div className="bg-card rounded-2xl border border-mint p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold text-ink uppercase tracking-wider">Profile</h2>
          {!editing && (
            <button
              type="button"
              onClick={handleEditProfile}
              className="text-xs font-bold text-leaf bg-transparent border-0 cursor-pointer"
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-mint/50 border border-mint text-ink text-sm outline-none focus:border-leaf"
              placeholder="Name"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-mint/50 border border-mint text-ink text-sm outline-none focus:border-leaf"
              placeholder="Email"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="flex-1 py-2.5 rounded-full text-white font-bold text-sm cursor-pointer border-0"
                style={{ background: 'linear-gradient(135deg, var(--leaf), var(--emerald))' }}
              >
                {updateProfile.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 py-2.5 rounded-full bg-mint text-ink-soft font-bold text-sm cursor-pointer border-0"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-mint/50">
              <span className="text-sm text-ink-soft">Name</span>
              <span className="text-sm font-bold text-ink">{displayUser?.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-mint/50">
              <span className="text-sm text-ink-soft">Email</span>
              <span className="text-sm font-bold text-ink">{displayUser?.email}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-ink-soft">Timezone</span>
              <span className="text-sm font-bold text-ink">{displayUser?.timezone || 'UTC'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Password change */}
      <div className="bg-card rounded-2xl border border-mint p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold text-ink uppercase tracking-wider">Password</h2>
          {!changingPassword && (
            <button
              type="button"
              onClick={() => setChangingPassword(true)}
              className="text-xs font-bold text-leaf bg-transparent border-0 cursor-pointer"
            >
              Change
            </button>
          )}
        </div>

        {passwordMessage && (
          <div
            className={`mb-3 p-3 rounded-xl text-sm font-semibold ${
              passwordMessage.type === 'success' ? 'bg-leaf/10 text-leaf' : 'bg-coral/10 text-coral'
            }`}
          >
            {passwordMessage.text}
          </div>
        )}

        {changingPassword && (
          <form onSubmit={handleChangePassword} className="space-y-3">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-mint/50 border border-mint text-ink text-sm outline-none focus:border-leaf"
              placeholder="Current password"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-xl bg-mint/50 border border-mint text-ink text-sm outline-none focus:border-leaf"
              placeholder="New password"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-mint/50 border border-mint text-ink text-sm outline-none focus:border-leaf"
              placeholder="Confirm new password"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={changePassword.isPending}
                className="flex-1 py-2.5 rounded-full text-white font-bold text-sm cursor-pointer border-0"
                style={{ background: 'linear-gradient(135deg, var(--leaf), var(--emerald))' }}
              >
                {changePassword.isPending ? 'Updating...' : 'Update password'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setChangingPassword(false)
                  setPasswordMessage(null)
                }}
                className="flex-1 py-2.5 rounded-full bg-mint text-ink-soft font-bold text-sm cursor-pointer border-0"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Logout */}
      <button
        type="button"
        onClick={logout}
        className="w-full py-3 rounded-full bg-coral/10 text-coral font-bold text-sm cursor-pointer border border-coral/20 mt-4"
      >
        Log out
      </button>
    </div>
  )
}
```

- [ ] 14.2 — Create `client/src/pages/Discover.jsx`:

```jsx
import { useState } from 'react'
import { useSpeciesSearch } from '../hooks/useSpecies'

export default function Discover() {
  const [query, setQuery] = useState('')
  const { data: results, isLoading } = useSpeciesSearch(query)

  return (
    <div className="px-5 pt-3 lg:px-14 lg:pt-10 pb-8">
      <h1 className="text-2xl font-extrabold text-ink tracking-tight mb-2">Discover</h1>
      <p className="text-sm text-ink-soft mb-6">Explore the plant species library.</p>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-card border border-mint text-ink text-sm outline-none focus:border-leaf mb-4"
        placeholder="Search species..."
      />

      {isLoading && query.length >= 2 && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-leaf border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {results?.length > 0 && (
        <div className="space-y-2">
          {results.map((species) => (
            <div
              key={species.id || species.common_name}
              className="p-4 rounded-xl bg-card border border-mint"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-extrabold text-ink">{species.common_name}</p>
                  {species.scientific_name && (
                    <p className="text-xs text-ink-soft italic">{species.scientific_name}</p>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {species.personality && (
                    <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald/10 text-emerald">
                      {species.personality}
                    </span>
                  )}
                  {species.difficulty && (
                    <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-mint text-ink-soft">
                      {species.difficulty}
                    </span>
                  )}
                </div>
              </div>
              {species.description && (
                <p className="text-xs text-ink-soft mt-2 line-clamp-2">{species.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {query.length >= 2 && !isLoading && results?.length === 0 && (
        <p className="text-sm text-ink-soft text-center py-8">No species found for &quot;{query}&quot;.</p>
      )}

      {query.length < 2 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-sm text-ink-soft">Search for a plant species to learn more about it.</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] 14.3 — Update `client/src/App.jsx` to import Me, Discover, and all remaining real pages:

Replace all remaining placeholder usages:

```jsx
import Today from './pages/Today'
import House from './pages/House'
import PlantDetail from './pages/PlantDetail'
import AddPlant from './pages/AddPlant'
import Discover from './pages/Discover'
import Me from './pages/Me'
import Login from './pages/Login'
import Register from './pages/Register'
import Welcome from './pages/Welcome'
import NotFound from './pages/NotFound'

// Remove the PlaceholderPage function entirely
```

Ensure all route elements use real components:

```jsx
<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />
<Route path="/welcome" element={<Welcome />} />

<Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
  <Route index element={<Today />} />
  <Route path="house" element={<House />} />
  <Route path="plants/:id" element={<PlantDetail />} />
  <Route path="discover" element={<Discover />} />
  <Route path="me" element={<Me />} />
  <Route path="add-plant" element={<AddPlant />} />
</Route>

<Route path="*" element={<NotFound />} />
```

- [ ] 14.4 — Add final Playwright E2E test. Create `client/tests/e2e-flow.spec.js`:

```javascript
import { expect, test } from '@playwright/test'

test('unauthenticated user is redirected to login', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
})

test('login page renders correctly', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('text=Welcome')).toBeVisible()
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toBeVisible()
})

test('register page renders correctly', async ({ page }) => {
  await page.goto('/register')
  await expect(page.locator('text=jungle')).toBeVisible()
  await expect(page.locator('input[type="text"]')).toBeVisible()
})

test('404 page renders for unknown routes', async ({ page }) => {
  await page.goto('/nonexistent-page')
  await expect(page.locator('text=404')).toBeVisible()
})

test('navigation between auth pages works', async ({ page }) => {
  await page.goto('/login')
  await page.click('text=Sign up')
  await expect(page).toHaveURL('/register')
  await page.click('text=Log in')
  await expect(page).toHaveURL('/login')
})
```

- [ ] 14.5 — Run lint + tests:

```bash
./scripts/lint.sh
./scripts/run_tests.sh client
```

- [ ] 14.6 — Commit:

```bash
git add client/src/pages/Me.jsx client/src/pages/Discover.jsx \
  client/src/App.jsx client/tests/e2e-flow.spec.js
git commit -m "feat: add Profile, Discover pages and complete frontend routing

Me page with profile display, edit form, password change (requires current
password), and logout. Discover page with species search library. All
placeholder routes replaced with real page components. E2E test suite
covering auth redirects and navigation.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

**Expected outcome:** All routes render real pages. `/me` shows profile with edit and password change. `/discover` shows species search. No placeholder pages remain. Playwright tests pass covering navigation and auth redirect.

---

## Summary

| Task | What it delivers | Key files |
|------|-----------------|-----------|
| 1 | Dependencies + design tokens | `index.css`, `package.json` |
| 2 | API fetch wrapper with JWT refresh | `api/client.js` |
| 3 | Auth context + useAuth hook | `context/AuthContext.jsx`, `hooks/useAuth.js` |
| 4 | Router + Layout + Dock + Sidebar | `App.jsx`, `Layout.jsx`, `Dock.jsx`, `Sidebar.jsx`, `ProtectedRoute.jsx` |
| 5 | Login + Register screens | `pages/Login.jsx`, `pages/Register.jsx` |
| 6 | Onboarding wizard (5 steps) | `pages/Welcome.jsx` |
| 7 | TanStack Query hooks (all endpoints) | `hooks/useDashboard.js`, `useRooms.js`, `usePlants.js`, `useSpecies.js`, `useProfile.js` |
| 8 | Shared components | `ProgressRing.jsx`, `PlantAvatar.jsx`, `TaskRow.jsx`, `SinceRibbon.jsx`, `RoomCard.jsx` |
| 9 | Today dashboard | `pages/Today.jsx`, `HeroCard.jsx`, `careStatus.js`, `voices.js`, `states.js` |
| 10 | House screen | `pages/House.jsx` |
| 11 | Plant Detail | `pages/PlantDetail.jsx` |
| 12 | Add Plant flow (Vaul sheet) | `pages/AddPlant.jsx` |
| 13 | Care animations (Framer Motion) | Updates to `HeroCard.jsx`, `TaskRow.jsx`, `Today.jsx` |
| 14 | Profile + Discover + polish | `pages/Me.jsx`, `pages/Discover.jsx`, E2E tests |

**Total new files:** ~25
**Total Playwright test files:** 4 (`app.spec.js`, `auth.spec.js`, `today.spec.js`, `e2e-flow.spec.js`)
**Dependencies added:** motion, vaul, @fontsource/plus-jakarta-sans, @fontsource/fraunces, driver.js
