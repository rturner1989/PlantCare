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
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Action from './components/ui/Action'
import Spinner from './components/ui/Spinner'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider, useToast } from './context/ToastContext'
import { useAuth } from './hooks/useAuth'
import AppLayout from './layouts/AppLayout'

// Route-level code splitting — each page ships as its own JS chunk, fetched on demand.
// Uncomment pages as they're built in tickets 5+.
const NotFound = lazy(() => import('./pages/NotFound'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Welcome = lazy(() => import('./pages/Welcome'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
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
      <Spinner />
    </div>
  )
}

function PlaceholderPage({ title }) {
  const { logout } = useAuth()
  const toast = useToast()

  // Temporary mobile logout affordance — desktop already has one in the
  // Sidebar. Delete when the Me profile page lands in ticket 14 and gets
  // its proper logout button.
  //
  // No explicit navigate: clearing `user` makes ProtectedRoute bounce to
  // /login on its own. Login always lands on '/' after re-auth.
  async function handleLogout() {
    await logout()
    toast.success('Logged out')
  }

  return (
    <div className="p-6 lg:p-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-ink">{title}</h1>
          <p className="text-ink-soft mt-2">Coming soon.</p>
        </div>
        <Action
          variant="unstyled"
          onClick={handleLogout}
          className="lg:hidden text-sm font-bold text-ink-soft hover:text-coral-deep active:text-coral-deep transition-colors p-0"
        >
          Log out
        </Action>
      </div>
    </div>
  )
}

function ProtectedAppLayout() {
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
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                {/* Public + Onboarding routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                {/* /welcome requires auth but NOT onboarded — it's the route
                    a user is sent to *because* they're not yet onboarded. */}
                <Route
                  path="/welcome/:step?"
                  element={
                    <ProtectedRoute requireOnboarded={false}>
                      <Welcome />
                    </ProtectedRoute>
                  }
                />

                {/* Protected routes */}
                <Route element={<ProtectedAppLayout />}>
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
        </ToastProvider>
      </AuthProvider>
      {/* Vite strips this branch from production builds — devtools ship only in dev. */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" />}
    </QueryClientProvider>
  )
}
