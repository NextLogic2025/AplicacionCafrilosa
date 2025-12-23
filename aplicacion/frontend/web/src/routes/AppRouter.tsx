import * as React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '../pages/app/AppLayout'
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage'
import { LoginPage } from '../pages/auth/LoginPage'
import { SplashPage } from '../pages/SplashPage'

import { RequireAuth } from './RequireAuth'

const AppIndexPage = React.lazy(() => import('../pages/app/AppIndexPage'))
const ClientePage = React.lazy(() => import('../features/cliente/ClientePage'))
const SupervisorPage = React.lazy(() => import('../features/supervisor/SupervisorPage'))
const VendedorPage = React.lazy(() => import('../features/vendedor/VendedorPage'))
const TransportistaPage = React.lazy(() => import('../features/transportista/TransportistaPage'))
const BodegueroPage = React.lazy(() => import('../features/bodeguero/BodegueroPage'))

export default function AppRouter() {
  return (
    <React.Suspense fallback={<SplashPage />}>
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AppIndexPage />} />
          <Route path="cliente" element={<ClientePage />} />
          <Route path="supervisor" element={<SupervisorPage />} />
          <Route path="vendedor" element={<VendedorPage />} />
          <Route path="transportista" element={<TransportistaPage />} />
          <Route path="bodeguero" element={<BodegueroPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  )
}
