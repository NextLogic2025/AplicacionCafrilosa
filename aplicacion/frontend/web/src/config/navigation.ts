import { 
  Home, Package, Boxes, ClipboardList, ListChecks, Truck, RotateCcw, 
  BarChart3, User, Bell, CreditCard, LifeBuoy, ShoppingCart, 
  Percent, MessageCircle, Users, FileText, Map, Calendar, BookOpen
} from 'lucide-react'
import type { SidebarItem } from '../components/ui/SidebarNav'

// ========================================
// CLIENTE
// ========================================
export const CLIENTE_NAV_ITEMS: SidebarItem[] = [
  { id: 'dashboard', label: 'Inicio', to: '/cliente', icon: Home, end: true },
  { id: 'productos', label: 'Productos', to: '/cliente/productos', icon: Boxes },
  { id: 'promociones', label: 'Promociones', to: '/cliente/promociones', icon: Percent },
  { id: 'carrito', label: 'Carrito', to: '/cliente/carrito', icon: ShoppingCart },
  { id: 'pedidos', label: 'Mis Pedidos', to: '/cliente/pedidos', icon: ClipboardList },
  { id: 'facturas', label: 'Facturas', to: '/cliente/facturas', icon: CreditCard },
  { id: 'entregas', label: 'Entregas', to: '/cliente/entregas', icon: Truck },
  { id: 'devoluciones', label: 'Devoluciones', to: '/cliente/devoluciones', icon: RotateCcw },
  { id: 'soporte', label: 'Soporte', to: '/cliente/soporte', icon: LifeBuoy },
  { id: 'mensajes', label: 'Mensajes', to: '/cliente/mensajes', icon: MessageCircle },
  { id: 'notificaciones', label: 'Notificaciones', to: '/cliente/notificaciones', icon: Bell },
  { id: 'perfil', label: 'Mi Perfil', to: '/cliente/perfil', icon: User },
]

// ========================================
// BODEGUERO
// ========================================
export const BODEGUERO_NAV_ITEMS: SidebarItem[] = [
  { id: 'dashboard', label: 'Inicio', to: '/bodeguero', icon: Home, end: true },
  { id: 'pendientes', label: 'Pedidos Pendientes', to: '/bodeguero/pendientes', icon: ClipboardList },
  { id: 'inventario', label: 'Inventario', to: '/bodeguero/inventario', icon: Package },
  { id: 'lotes', label: 'Lotes y Vencimientos', to: '/bodeguero/lotes', icon: Boxes },
  { id: 'pedidos', label: 'Preparación de Pedidos', to: '/bodeguero/pedidos', icon: ListChecks },
  { id: 'despachos', label: 'Despachos', to: '/bodeguero/despachos', icon: Truck },
  { id: 'devoluciones', label: 'Devoluciones', to: '/bodeguero/devoluciones', icon: RotateCcw },
  { id: 'reportes', label: 'Reportes', to: '/bodeguero/reportes', icon: BarChart3 },
  { id: 'notificaciones', label: 'Notificaciones', to: '/bodeguero/notificaciones', icon: Bell },
  { id: 'perfil', label: 'Mi Perfil', to: '/bodeguero/perfil', icon: User },
]

// ========================================
// SUPERVISOR
// ========================================
export const SUPERVISOR_NAV_ITEMS: SidebarItem[] = [
  { id: 'dashboard', label: 'Inicio', to: '/supervisor', icon: Home, end: true },
  { id: 'clientes', label: 'Clientes', to: '/supervisor/clientes', icon: Users },
  { id: 'equipo', label: 'Equipo', to: '/supervisor/equipo', icon: Users },
  { id: 'catalogo', label: 'Catálogo', to: '/supervisor/catalogo', icon: BookOpen },
  { id: 'pedidos', label: 'Pedidos', to: '/supervisor/pedidos', icon: ClipboardList },
  { id: 'bodega', label: 'Bodega', to: '/supervisor/bodega', icon: Package },
  { id: 'entregas', label: 'Entregas', to: '/supervisor/entregas', icon: Truck },
  { id: 'devoluciones', label: 'Devoluciones', to: '/supervisor/devoluciones', icon: RotateCcw },
  { id: 'reportes', label: 'Reportes', to: '/supervisor/reportes', icon: BarChart3 },
  { id: 'alertas', label: 'Alertas', to: '/supervisor/alertas', icon: Bell },
  { id: 'perfil', label: 'Mi Perfil', to: '/supervisor/perfil', icon: User },
]

// ========================================
// VENDEDOR
// ========================================
export const VENDEDOR_NAV_ITEMS: SidebarItem[] = [
  { id: 'dashboard', label: 'Inicio', to: '/vendedor', icon: Home, end: true },
  { id: 'clientes', label: 'Clientes', to: '/vendedor/clientes', icon: Users },
  { id: 'productos', label: 'Productos', to: '/vendedor/productos', icon: Boxes },
  { id: 'promociones', label: 'Promociones', to: '/vendedor/promociones', icon: Percent },
  { id: 'crear-pedido', label: 'Crear Pedido', to: '/vendedor/crear-pedido', icon: ShoppingCart },
  { id: 'pedidos', label: 'Pedidos', to: '/vendedor/pedidos', icon: ClipboardList },
  { id: 'facturas', label: 'Facturas', to: '/vendedor/facturas', icon: CreditCard },
  { id: 'entregas', label: 'Entregas', to: '/vendedor/entregas', icon: Truck },
  { id: 'devoluciones', label: 'Devoluciones', to: '/vendedor/devoluciones', icon: RotateCcw },
  { id: 'reportes', label: 'Reportes', to: '/vendedor/reportes', icon: BarChart3 },
  { id: 'notificaciones', label: 'Notificaciones', to: '/vendedor/notificaciones', icon: Bell },
  { id: 'perfil', label: 'Mi Perfil', to: '/vendedor/perfil', icon: User },
]

// ========================================
// TRANSPORTISTA
// ========================================
export const TRANSPORTISTA_NAV_ITEMS: SidebarItem[] = [
  { id: 'inicio', label: 'Inicio', to: '/transportista', icon: Home, end: true },
  { id: 'pedidos', label: 'Pedidos Asignados', to: '/transportista/pedidos', icon: Package },
  { id: 'rutas', label: 'Rutas', to: '/transportista/rutas', icon: Map },
  { id: 'entregas', label: 'Entregas', to: '/transportista/entregas', icon: Truck },
  { id: 'devoluciones', label: 'Devoluciones', to: '/transportista/devoluciones', icon: RotateCcw },
  { id: 'historial', label: 'Historial', to: '/transportista/historial', icon: Calendar },
  { id: 'notificaciones', label: 'Notificaciones', to: '/transportista/notificaciones', icon: Bell },
  { id: 'perfil', label: 'Mi Perfil', to: '/transportista/perfil', icon: User },
]
