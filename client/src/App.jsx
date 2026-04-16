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
import { ToastProvider } from './context/ToastContext'
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
                  path="/welcome"
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
    </QueryClientProvider>
  )
}
