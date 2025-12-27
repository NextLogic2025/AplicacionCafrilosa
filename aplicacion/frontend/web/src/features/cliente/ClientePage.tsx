import { Bell, CreditCard, Home, LifeBuoy, LogOut, Truck, User, ClipboardList, Boxes, ShoppingCart } from 'lucide-react'
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'
import { CartProvider, useCart } from './cart/CartContext'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', to: '/cliente', icon: Home },
  { id: 'pedidos', label: 'Mis Pedidos', to: '/cliente/pedidos', icon: ClipboardList },
  { id: 'productos', label: 'Productos', to: '/cliente/productos', icon: Boxes },
  { id: 'facturas', label: 'Facturas y Pagos', to: '/cliente/facturas', icon: CreditCard },
  { id: 'entregas', label: 'Entregas', to: '/cliente/entregas', icon: Truck },
  { id: 'soporte', label: 'Soporte / Tickets', to: '/cliente/soporte', icon: LifeBuoy },
  { id: 'notificaciones', label: 'Notificaciones', to: '/cliente/notificaciones', icon: Bell },
  { id: 'perfil', label: 'Mi Perfil', to: '/cliente/perfil', icon: User },
]

export default function ClientePage() {
  const navigate = useNavigate()
  const auth = useAuth()

  const handleSignOut = () => {
    auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <CartProvider>
      <div className="min-h-dvh bg-neutral-50 text-neutral-900">
      <div className="grid min-h-dvh w-full grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="flex flex-col gap-4 rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm lg:sticky lg:top-6 lg:h-[calc(100dvh-3rem)] lg:self-start">
          <div className="flex items-center gap-3 rounded-2xl bg-neutral-50 px-3 py-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-red text-sm font-semibold text-white">CL</div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Rol</p>
              <p className="text-sm font-semibold text-neutral-900">Cliente</p>
            </div>
          </div>

          <nav className="grid gap-1">
            {NAV_ITEMS.map(({ id, label, to, icon: Icon }) => (
              <NavLink
                key={id}
                to={to}
                end={id === 'dashboard'}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition',
                    isActive
                      ? 'bg-brand-red text-white shadow-sm'
                      : 'text-neutral-700 hover:bg-neutral-50',
                  ].join(' ')
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto space-y-3 rounded-2xl border border-neutral-100 bg-neutral-50 px-3 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Sistema</p>
              <p className="text-sm text-neutral-700">Distribución Comercial (Embutidos)</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-brand-red transition hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </aside>

        <div className="space-y-5 px-6 py-6">
          <div className="flex items-center justify-end">
            <CartButton />
          </div>
          <div className="overflow-hidden rounded-3xl bg-linear-to-r from-brand-red to-brand-red700 p-6 text-white shadow-lg">
            <p className="text-xs uppercase tracking-[0.26em] text-white/80">👤 Rol: Cliente</p>
            <h1 className="mt-1 text-3xl font-bold leading-tight">Sistema de Distribución Comercial (Embutidos)</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/90">
              El cliente es el comprador final (tienda, minimarket, restaurante, etc.). Consulta información,
              realiza pedidos, revisa su estado financiero, recibe notificaciones y solicita soporte en un mismo lugar.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-white/15 px-3 py-1">Pedidos, entregas y facturas en un panel</span>
              <span className="rounded-full bg-white/15 px-3 py-1">Alertas de crédito y vencimientos</span>
              <span className="rounded-full bg-white/15 px-3 py-1">Soporte y notificaciones en tiempo real</span>
            </div>
          </div>

          <div className="p-0">
            <Outlet />
          </div>
        </div>
      </div>
      </div>
    </CartProvider>
  )
}

function CartButton() {
  const { items } = useCart()
  return (
    <Link
      to="/cliente/carrito"
      className="group inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50"
      aria-label="Abrir carrito"
    >
      <ShoppingCart className="h-4 w-4 text-brand-red group-hover:text-brand-red700" />
      <span>Carrito</span>
      <span className="ml-1 rounded-full bg-brand-red px-2 py-0.5 text-xs font-bold text-white">{items.length}</span>
    </Link>
  )
}
