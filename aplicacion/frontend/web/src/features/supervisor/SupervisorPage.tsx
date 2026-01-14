import { Outlet, useNavigate } from 'react-router-dom'
import { Suspense } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { RoleLayout } from 'components/layout/RoleLayout'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { SUPERVISOR_NAV_ITEMS } from '../../config/navigation'

export default function SupervisorPage() {
  const auth = useAuth()
  const navigate = useNavigate()

  const handleSignOut = () => {
    auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <RoleLayout
      roleLabel="Supervisor"
      avatarText="SV"
      navItems={SUPERVISOR_NAV_ITEMS}
      onSignOut={handleSignOut}
    >
      <Suspense fallback={<LoadingSpinner />}>
        <Outlet />
      </Suspense>
    </RoleLayout>
  )
}
