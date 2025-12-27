import * as React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '../pages/app/AppLayout'
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage'
import { LoginPage } from '../pages/auth/LoginPage'
import { SplashPage } from '../pages/SplashPage'

import { RequireAuth } from './RequireAuth'

const AppIndexPage = React.lazy(() => import('../pages/app/AppIndexPage'))
const ClienteLayout = React.lazy(() => import('../features/cliente/ClientePage'))
const PaginaPanelCliente = React.lazy(() => import('../features/cliente/pages/dashboard'))
const PaginaPedidos = React.lazy(() => import('../features/cliente/pages/pedidos'))
const PaginaProductos = React.lazy(() => import('../features/cliente/pages/productos'))
const PaginaFacturas = React.lazy(() => import('../features/cliente/pages/facturas'))
const PaginaCarrito = React.lazy(() => import('../features/cliente/pages/carrito'))
const PaginaEntregas = React.lazy(() => import('../features/cliente/pages/entregas'))
const PaginaSoporte = React.lazy(() => import('../features/cliente/pages/soporte'))
const PaginaNotificaciones = React.lazy(() => import('../features/cliente/pages/notificaciones'))
const PaginaPerfilCliente = React.lazy(() => import('../features/cliente/pages/perfil'))
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
          path="/cliente"
          element={
            <RequireAuth>
              <ClienteLayout />
            </RequireAuth>
          }
        >
          <Route index element={<PaginaPanelCliente />} />
          <Route path="pedidos" element={<PaginaPedidos />} />
          <Route path="productos" element={<PaginaProductos />} />
          <Route path="facturas" element={<PaginaFacturas />} />
          <Route path="carrito" element={<PaginaCarrito />} />
          <Route path="entregas" element={<PaginaEntregas />} />
          <Route path="soporte" element={<PaginaSoporte />} />
          <Route path="notificaciones" element={<PaginaNotificaciones />} />
          <Route path="perfil" element={<PaginaPerfilCliente />} />
        </Route>

        <Route path="/app/cliente/*" element={<Navigate to="/cliente" replace />} />

        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AppIndexPage />} />
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
