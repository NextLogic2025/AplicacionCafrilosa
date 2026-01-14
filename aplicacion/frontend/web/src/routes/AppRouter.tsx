import * as React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage'
import { LoginPage } from '../pages/auth/LoginPage'
import { SplashPage } from '../pages/SplashPage'
import BodegueroLayout from '../features/bodeguero/BodegueroPage'
import {
  DashboardPage,
  InventarioPage,
  LotesPage,
  RecepcionesPage,
  PedidosPage,
  DespachosPage,
  DevolucionesPage,
  TrazabilidadPage,
  ReportesPage,
  PerfilPage,
} from '../features/bodeguero/pages'
const PedidosPendientesPage = React.lazy(() => import('../features/bodeguero/pages/PedidosPendientes'))
const NotificacionesBodegaPage = React.lazy(() => import('../features/bodeguero/pages/Notificaciones'))

import { RequireAuth } from './RequireAuth'

import ClienteLayout from '../features/cliente/ClientePage'
const PaginaPanelCliente = React.lazy(() => import('../features/cliente/pages/dashboard'))
const PaginaPedidos = React.lazy(() => import('../features/cliente/pages/pedidos'))
const PaginaProductos = React.lazy(() => import('../features/cliente/pages/productos'))
const PaginaFacturas = React.lazy(() => import('../features/cliente/pages/facturas'))
const PaginaCarrito = React.lazy(() => import('../features/cliente/pages/carrito'))
const PaginaEntregas = React.lazy(() => import('../features/cliente/pages/entregas'))
import PaginaPromociones from '../features/cliente/pages/promociones'
import PaginaDevolucionesCliente from '../features/cliente/pages/devoluciones'

const PaginaSucursal = React.lazy(() => import('../features/cliente/pages/sucursal'))
const PaginaSoporte = React.lazy(() => import('../features/cliente/pages/soporte'))
const PaginaNotificaciones = React.lazy(() => import('../features/cliente/pages/notificaciones'))
const PaginaPerfilCliente = React.lazy(() => import('../features/cliente/pages/perfil'))
const PaginaMensajesCliente = React.lazy(() => import('../features/cliente/pages/mensajes'))
const SupervisorLayout = React.lazy(() => import('../features/supervisor/SupervisorPage'))
const VendedorLayout = React.lazy(() => import('../features/vendedor/VendedorPage'))
const VendedorDashboard = React.lazy(() => import('../features/vendedor/pages/Dashboard'))
const VendedorClientes = React.lazy(() => import('../features/vendedor/pages/Clientes'))
const VendedorRutas = React.lazy(() => import('../features/vendedor/pages/Rutas'))
const VendedorProductos = React.lazy(() => import('../features/vendedor/pages/Productos'))
const VendedorPromociones = React.lazy(() => import('../features/vendedor/pages/Promociones'))
const VendedorCrearPedido = React.lazy(() => import('../features/vendedor/pages/CrearPedido'))
const VendedorPedidos = React.lazy(() => import('../features/vendedor/pages/Pedidos'))
const VendedorFacturas = React.lazy(() => import('../features/vendedor/pages/Facturas'))
const VendedorEntregas = React.lazy(() => import('../features/vendedor/pages/Entregas'))
const VendedorDevoluciones = React.lazy(() => import('../features/vendedor/pages/Devoluciones'))
const VendedorReportes = React.lazy(() => import('../features/vendedor/pages/Reportes'))
const VendedorNotificaciones = React.lazy(() => import('../features/vendedor/pages/Notificaciones'))
const VendedorPerfil = React.lazy(() => import('../features/vendedor/pages/Perfil'))
const TransportistaPage = React.lazy(() => import('../features/transportista/TransportistaPage'))
const TransportistaInicio = React.lazy(() => import('../features/transportista/pages/Inicio'))
const TransportistaPedidosAsignados = React.lazy(() => import('../features/transportista/pages/PedidosAsignados'))
const TransportistaRutas = React.lazy(() => import('../features/transportista/pages/Rutas'))
const TransportistaEntregas = React.lazy(() => import('../features/transportista/pages/Entregas'))
const TransportistaDevoluciones = React.lazy(() => import('../features/transportista/pages/Devoluciones'))
const TransportistaHistorial = React.lazy(() => import('../features/transportista/pages/Historial'))
const TransportistaNotificaciones = React.lazy(() => import('../features/transportista/pages/Notificaciones'))
const TransportistaPerfil = React.lazy(() => import('../features/transportista/pages/Perfil'))

const SupervisorDashboard = React.lazy(() => import('../features/supervisor/pages/Dashboard'))
const SupervisorClientes = React.lazy(() => import('../features/supervisor/pages/Clientes'))
const SupervisorEquipo = React.lazy(() => import('../features/supervisor/pages/Equipo'))
const SupervisorCatalogo = React.lazy(() => import('../features/supervisor/pages/Catalogo'))
const SupervisorZonas = React.lazy(() => import('../features/supervisor/pages/Zonas'))
const SupervisorRutas = React.lazy(() => import('../features/supervisor/pages/Rutas'))
const SupervisorRouteCreatePage = React.lazy(() => import('../features/supervisor/pages/Rutas/crearRuta'))
const SupervisorRouteCreatePaso2Page = React.lazy(() => import('../features/supervisor/pages/Rutas/crearRutapaso2'))
const SupervisorPedidos = React.lazy(() => import('../features/supervisor/pages/Pedidos'))
const SupervisorBodega = React.lazy(() => import('../features/supervisor/pages/Bodega'))
const SupervisorEntregas = React.lazy(() => import('../features/supervisor/pages/Entregas'))
const SupervisorDevoluciones = React.lazy(() => import('../features/supervisor/pages/Devoluciones'))
const SupervisorReportes = React.lazy(() => import('../features/supervisor/pages/Reportes'))
const SupervisorAlertas = React.lazy(() => import('../features/supervisor/pages/Alertas'))
const SupervisorPerfil = React.lazy(() => import('../features/supervisor/pages/Perfil'))

export default function AppRouter() {
  return (
    <React.Suspense fallback={<SplashPage />}>
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/app/*" element={<Navigate to="/login" replace />} />

        <Route
          path="/cliente/*"
          element={
            <RequireAuth allowedRoles={['cliente']}>
              <ClienteLayout />
            </RequireAuth>
          }
        >
          <Route index element={<PaginaPanelCliente />} />
          <Route path="pedidos" element={<PaginaPedidos />} />
          <Route path="productos" element={<PaginaProductos />} />
          <Route path="promociones" element={<PaginaPromociones />} />
          <Route path="facturas" element={<PaginaFacturas />} />
          <Route path="carrito" element={<PaginaCarrito />} />
          <Route path="entregas" element={<PaginaEntregas />} />
          <Route path="devoluciones" element={<PaginaDevolucionesCliente />} />
          <Route path="soporte" element={<PaginaSoporte />} />
          <Route path="mensajes" element={<PaginaMensajesCliente />} />
          <Route path="notificaciones" element={<PaginaNotificaciones />} />
          <Route path="perfil" element={<PaginaPerfilCliente />} />
          <Route path="sucursal" element={<PaginaSucursal />} />
        </Route>

        <Route path="/app/cliente/*" element={<Navigate to="/cliente" replace />} />

        <Route path="/app/bodeguero/*" element={<Navigate to="/bodeguero" replace />} />

        <Route
          path="/bodeguero/*"
          element={
            <RequireAuth allowedRoles={['bodeguero']}>
              <BodegueroLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="pendientes" element={<PedidosPendientesPage />} />
          <Route path="inventario" element={<InventarioPage />} />
          <Route path="lotes" element={<LotesPage />} />
          <Route path="recepciones" element={<RecepcionesPage />} />
          <Route path="pedidos" element={<PedidosPage />} />
          <Route path="despachos" element={<DespachosPage />} />
          <Route path="devoluciones" element={<DevolucionesPage />} />
          <Route path="trazabilidad" element={<TrazabilidadPage />} />
          <Route path="reportes" element={<ReportesPage />} />
          <Route path="notificaciones" element={<NotificacionesBodegaPage />} />
          <Route path="perfil" element={<PerfilPage />} />
        </Route>

        <Route path="/app/vendedor/*" element={<Navigate to="/vendedor" replace />} />

        <Route
          path="/vendedor/*"
          element={
            <RequireAuth allowedRoles={['vendedor']}>
              <VendedorLayout />
            </RequireAuth>
          }
        >
          <Route index element={<VendedorDashboard />} />
          <Route path="clientes" element={<VendedorClientes />} />
          <Route path="rutas" element={<VendedorRutas />} />
          <Route path="productos" element={<VendedorProductos />} />
          <Route path="promociones" element={<VendedorPromociones />} />
          <Route path="crear-pedido" element={<VendedorCrearPedido />} />
          <Route path="pedidos" element={<VendedorPedidos />} />
          <Route path="facturas" element={<VendedorFacturas />} />
          <Route path="entregas" element={<VendedorEntregas />} />
          <Route path="devoluciones" element={<VendedorDevoluciones />} />
          <Route path="reportes" element={<VendedorReportes />} />
          <Route path="notificaciones" element={<VendedorNotificaciones />} />
          <Route path="perfil" element={<VendedorPerfil />} />
        </Route>

        <Route path="/app/transportista/*" element={<Navigate to="/transportista" replace />} />

        <Route
          path="/transportista/*"
          element={
            <RequireAuth allowedRoles={['transportista']}>
              <TransportistaPage />
            </RequireAuth>
          }
        >
          <Route index element={<TransportistaInicio />} />
          <Route path="pedidos" element={<TransportistaPedidosAsignados />} />
          <Route path="rutas" element={<TransportistaRutas />} />
          <Route path="entregas" element={<TransportistaEntregas />} />
          <Route path="devoluciones" element={<TransportistaDevoluciones />} />
          <Route path="historial" element={<TransportistaHistorial />} />
          <Route path="notificaciones" element={<TransportistaNotificaciones />} />
          <Route path="perfil" element={<TransportistaPerfil />} />
        </Route>

        <Route path="/app/supervisor/*" element={<Navigate to="/supervisor" replace />} />

        <Route
          path="/supervisor/*"
          element={
            <RequireAuth allowedRoles={['supervisor']}>
              <SupervisorLayout />
            </RequireAuth>
          }
        >
          <Route index element={<SupervisorDashboard />} />
          <Route path="clientes" element={<SupervisorClientes />} />
          <Route path="equipo" element={<SupervisorEquipo />} />
          <Route path="catalogo" element={<SupervisorCatalogo />} />
          <Route path="zonas" element={<SupervisorZonas />} />
          <Route path="rutas">
            <Route index element={<SupervisorRutas />} />
            <Route path="crear" >
              <Route index element={<SupervisorRouteCreatePage />} />
              <Route path="paso2" element={<SupervisorRouteCreatePaso2Page />} />
            </Route>
          </Route>
          <Route path="pedidos" element={<SupervisorPedidos />} />
          <Route path="bodega" element={<SupervisorBodega />} />
          <Route path="entregas" element={<SupervisorEntregas />} />
          <Route path="devoluciones" element={<SupervisorDevoluciones />} />
          <Route path="reportes" element={<SupervisorReportes />} />
          <Route path="alertas" element={<SupervisorAlertas />} />
          <Route path="perfil" element={<SupervisorPerfil />} />
        </Route>

        <Route path="/app/*" element={<Navigate to="/login" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  )
}
