import type { AppRole } from '../../types/roles'

const ROLE_KEY = 'cafrilosa.role'

export function getSelectedRole(): AppRole | null {
  try {
    const value = localStorage.getItem(ROLE_KEY)
    if (!value) return null
    if (
      value === 'cliente' ||
      value === 'supervisor' ||
      value === 'vendedor' ||
      value === 'transportista' ||
      value === 'bodeguero'
    ) {
      return value
    }
    return null
  } catch {
    return null
  }
}

export function setSelectedRole(role: AppRole) {
  localStorage.setItem(ROLE_KEY, role)
}

export function clearSelectedRole() {
  localStorage.removeItem(ROLE_KEY)
}
