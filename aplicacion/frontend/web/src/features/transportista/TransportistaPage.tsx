import React from 'react'
import { Truck } from 'lucide-react'
import { Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'
import { RoleLayout } from 'components/layout/RoleLayout'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { TRANSPORTISTA_NAV_ITEMS } from '../../config/navigation'

export default function TransportistaPage() {
  const navigate = useNavigate()
  const auth = useAuth()

  const handleSignOut = () => {
    auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <RoleLayout
      roleLabel="Transportista"
      avatarText="TR"
      navItems={TRANSPORTISTA_NAV_ITEMS}
      onSignOut={handleSignOut}
    >
      <React.Suspense fallback={<div className="py-8"><LoadingSpinner /></div>}>
        <Outlet />
      </React.Suspense>
    </RoleLayout>
  )
}
