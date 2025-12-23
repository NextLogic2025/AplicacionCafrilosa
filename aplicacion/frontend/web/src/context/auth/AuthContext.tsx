import * as React from 'react'

import { clearSelectedRole } from '../../services/storage/roleStorage'
import { clearToken, getToken, setToken } from '../../services/storage/tokenStorage'

type AuthContextValue = {
  token: string | null
  isAuthenticated: boolean
  signIn: (token: string, opts?: { persist?: boolean }) => void
  signOut: () => void
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = React.useState<string | null>(() => getToken())

  const signIn = React.useCallback((newToken: string, opts?: { persist?: boolean }) => {
    setToken(newToken, opts)
    setTokenState(newToken)
  }, [])

  const signOut = React.useCallback(() => {
    clearToken()
    clearSelectedRole()
    setTokenState(null)
  }, [])

  const value = React.useMemo<AuthContextValue>(
    () => ({ token, isAuthenticated: Boolean(token), signIn, signOut }),
    [signIn, signOut, token]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext debe usarse dentro de <AuthProvider />')
  return ctx
}
