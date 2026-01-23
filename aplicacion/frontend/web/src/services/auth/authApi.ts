import { env } from '../../config/env'
import type { AppRole } from '../../types/roles'
import { APP_ROLES } from '../../types/roles'
import { httpAuth, httpUsuarios } from '../api/http'

type ErrorResponse = { message?: string }
type LoginResponse = {
  access_token?: string
  refresh_token?: string
  usuario?: unknown
  message?: string
  rolId?: number
}

export type UserProfile = {
  id: string
  email: string
  nombre: string
  nombre_completo?: string
  nombreCompleto?: string
  telefono: string | null
  avatarUrl?: string | null
  emailVerificado: boolean
  activo: boolean
  createdAt: string
  rol?: { id: number; nombre: string }
}

const ROLE_BY_ID: Record<number, AppRole> = {
  2: 'supervisor',
  3: 'bodeguero',
  4: 'vendedor',
  5: 'transportista',
  6: 'cliente',
}

function mapRoleFromPayload(payload: unknown): AppRole | null {
  if (!payload || typeof payload !== 'object') return null

  const user = payload as Record<string, unknown>

  // Try to find role ID in various locations and formats
  // Check root, 'usuario', 'user', and both camelCase/snake_case
  const possibleSources = [
    user,
    user.usuario as Record<string, unknown>,
    user.user as Record<string, unknown>
  ].filter(Boolean)

  let roleId: string | number | undefined
  let roleName: unknown

  for (const src of possibleSources) {
    if (src.rolId !== undefined) roleId = src.rolId as string | number
    else if (src.rol_id !== undefined) roleId = src.rol_id as string | number
    else if (src.roleId !== undefined) roleId = src.roleId as string | number
    else if (src.role_id !== undefined) roleId = src.role_id as string | number

    if (roleId !== undefined) break
  }

  // If roleId found, try mapping by ID first (most reliable)
  const normalizedId = typeof roleId === 'string' ? Number(roleId) : roleId
  if (typeof normalizedId === 'number' && ROLE_BY_ID[normalizedId]) {
    return ROLE_BY_ID[normalizedId]
  }

  // Fallback: Try mapping by Name
  // Find role name in sources
  for (const src of possibleSources) {
    if (src.rol !== undefined) {
      if (typeof src.rol === 'string') roleName = src.rol
      else if (typeof src.rol === 'object' && src.rol && 'nombre' in src.rol) roleName = (src.rol as any).nombre
    } else if (src.role !== undefined) {
      if (typeof src.role === 'string') roleName = src.role
    }

    if (roleName) break
  }

  const normalizedName = typeof roleName === 'string' ? roleName.toLowerCase() : undefined

  // Specific fix for "Cliente" variations
  if (normalizedName === 'cliente' || normalizedName === 'customer') return 'cliente'

  const fromName = APP_ROLES.find((r) => r.key === normalizedName) ??
    APP_ROLES.find((r) => r.label.toLowerCase() === normalizedName)
  return fromName?.key ?? null
}

export async function signInWithPassword(email: string, password: string) {
  try {
    const data = await httpAuth<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    })

    if (!data?.access_token) throw new Error('Respuesta inválida del servidor (falta access_token)')

    const role = mapRoleFromPayload(data.usuario) ?? mapRoleFromPayload(data)

    return { token: data.access_token, refreshToken: data.refresh_token, role }
  } catch (e) {
    if (e instanceof Error && e.message.includes('fetch')) {
      throw new Error('No se pudo conectar con el servidor')
    }
    throw e
  }
}

export async function signOutFromServer(accessToken: string) {
  try {
    await httpAuth('/auth/logout', {
      method: 'POST',
      body: {},
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  } catch (e) {
    // Silenciaremos cualquier fallo de red; el frontend igual limpiará la sesión
    console.warn('No se pudo cerrar sesión en el servidor', e)
  }
}

export async function fetchProfile(): Promise<UserProfile> {
  // El endpoint real es /usuarios/me según la colección Postman
  return httpUsuarios<UserProfile>('/usuarios/me')
}

export async function requestPasswordReset(email: string): Promise<void> {
  await httpAuth('/auth/forgot-password', {
    method: 'POST',
    body: { email },
    auth: false,
  })
}
