import React from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { RoleLayout } from '../../components/layout/RoleLayout'
import { VENDEDOR_NAV_ITEMS } from '../../config/navigation'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'

export default function VendedorPage() {
  const navigate = useNavigate()

  const handleSignOut = () => {
    navigate('/login')
  }

  return (
    <RoleLayout
      roleLabel="Vendedor"
      avatarText="VN"
      navItems={VENDEDOR_NAV_ITEMS}
      onSignOut={handleSignOut}
    >
      <React.Suspense fallback={<div className="py-8"><LoadingSpinner /></div>}>
        <Outlet />
      </React.Suspense>
    </RoleLayout>
  )
}
