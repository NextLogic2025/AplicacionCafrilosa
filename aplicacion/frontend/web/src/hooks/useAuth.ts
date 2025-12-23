import { useAuthContext } from '../context/auth/AuthContext'

export function useAuth() {
  return useAuthContext()
}
