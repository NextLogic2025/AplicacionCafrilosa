import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'
import { getSelectedRole } from '../services/storage/roleStorage'
import type { AppRole } from '../types/roles'

type Props = {
  children: ReactNode
  allowedRoles?: AppRole[]
}

export function RequireAuth({ children, allowedRoles }: Props) {
  const auth = useAuth()
  const location = useLocation()

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (allowedRoles) {
    const userRole = getSelectedRole()
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Redirect to the user's appropriate dashboard or login
      const userPath = userRole ? `/${userRole}` : '/login'
      return <Navigate to={userPath} replace />
    }
  }

  return children
}
