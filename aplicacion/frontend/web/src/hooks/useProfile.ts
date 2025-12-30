import * as React from 'react'

import { fetchProfile, type UserProfile } from '../services/auth/authApi'

export function useProfile() {
  const [profile, setProfile] = React.useState<UserProfile | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const loadProfile = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchProfile()
      setProfile(data)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo obtener el perfil'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    profile,
    loading,
    error,
    refresh: loadProfile,
  }
}
