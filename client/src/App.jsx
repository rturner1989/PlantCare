/*
 * src/
 * ├── layouts/       route wrappers that pages render inside
 * │   ├── AppLayout.jsx    authenticated shell (dock + sidebar)
 * │   ├── AuthLayout.jsx   login/register card
 * │   └── SiteLayout.jsx   marketing nav + footer
 * ├── pages/         leaf route components
 * └── components/    shared building blocks used by layouts AND pages
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import AppLayout from './layouts/AppLayout'
import NotFound from './pages/NotFound'

// const Login = lazy(() => import('./pages/Login'))
// const Register = lazy(() => import('./pages/Register'))
// const Welcome = lazy(() => import('./pages/Welcome'))
// const Today = lazy(() => import('./pages/Today'))
// const House = lazy(() => import('./pages/House'))
// const PlantDetail = lazy(() => import('./pages/PlantDetail'))
// const Discover = lazy(() => import('./pages/Discover'))
// const Me = lazy(() => import('./pages/Me'))
// const AddPlant = lazy(() => import('./pages/AddPlant'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2, retry: 1 },
  },
})

function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-dvh">
      <div className="w-8 h-8 border-3 border-leaf border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function PlaceholderPage({ title }) {
  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-3xl font-extrabold text-ink">{title}</h1>
      <p className="text-ink-soft mt-2">Coming soon.</p>
    </div>
  )
}

// TODO: remove `bypass` once real auth is wired up.
function ProtectedAppLayout({ bypass = false }) {
  if (bypass && import.meta.env.DEV) {
    console.warn('[ProtectedAppLayout] auth bypass active — DEV build only')
    return <AppLayout />
  }

  return (
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public + Onboarding routes */}
              <Route path="/login" element={<PlaceholderPage title="Login" />} />
              <Route path="/register" element={<PlaceholderPage title="Register" />} />
              <Route path="/welcome" element={<PlaceholderPage title="Welcome" />} />

              {/* Protected routes */}
              <Route element={<ProtectedAppLayout bypass={false} />}>
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
