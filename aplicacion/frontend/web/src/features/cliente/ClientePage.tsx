import React from 'react'
import { ShoppingCart } from 'lucide-react'
import { Outlet, useNavigate, Link } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'
import { RoleLayout } from 'components/layout/RoleLayout'
import { CartProvider, useCart } from './cart/CartContext'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { CLIENTE_NAV_ITEMS } from '../../config/navigation'

export default function ClientePage() {
  const navigate = useNavigate()
  const auth = useAuth()

  const handleSignOut = () => {
    auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <CartProvider>
      <RoleLayout
        roleLabel="Cliente"
        avatarText="CL"
        navItems={CLIENTE_NAV_ITEMS}
        onSignOut={handleSignOut}
        topRightSlot={<CartButton />}
      >
        <React.Suspense fallback={<div className="py-8"><LoadingSpinner /></div>}>
          <Outlet />
        </React.Suspense>
      </RoleLayout>
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
