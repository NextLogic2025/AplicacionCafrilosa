import { env } from '../../config/env'
import type { AppRole } from '../../types/roles'
import { APP_ROLES } from '../../types/roles'

type ErrorResponse = { message?: string }
type LoginResponse = {
  access_token?: string
  refresh_token?: string
  usuario?: unknown
  message?: string
}

function resolveLogoutUrl() {
  if (env.auth.logoutUrl) return env.auth.logoutUrl
  if (env.auth.loginUrl) return env.auth.loginUrl.replace(/\/login$/, '/logout')
  if (env.api.baseUrl) return `${env.api.baseUrl}/auth/logout`
  return ''
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
  const roleId = (user.rolId ?? user.roleId ?? user.rol_id ?? user.role_id ?? user['rol_id']) as
    | number
    | string
    | undefined
  const roleName = (user.rol ?? user.role ?? user['rol']) as unknown

  const normalizedId = typeof roleId === 'string' ? Number(roleId) : roleId
  if (typeof normalizedId === 'number' && ROLE_BY_ID[normalizedId]) return ROLE_BY_ID[normalizedId]

  const normalizedName = typeof roleName === 'string' ? roleName.toLowerCase() : undefined
  const fromName = APP_ROLES.find((r) => r.key === normalizedName) ??
    APP_ROLES.find((r) => r.label.toLowerCase() === normalizedName)
  return fromName?.key ?? null
}

export async function signInWithPassword(email: string, password: string) {
  const url = env.auth.loginUrl
  if (!url) throw new Error('Login URL no configurada (VITE_AUTH_LOGIN_URL)')

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 10_000)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    })

    const data = (await res.json().catch(() => null)) as LoginResponse | null

    if (!res.ok)
      throw new Error(typeof data?.message === 'string' ? data.message : 'No se pudo iniciar sesión')
    if (!data?.access_token) throw new Error('Respuesta inválida del servidor (falta access_token)')

    const role = mapRoleFromPayload(data.usuario) ?? mapRoleFromPayload(data)

    return { token: data.access_token, refreshToken: data.refresh_token, role }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado')
    }
    throw e
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function signOutFromServer(accessToken: string) {
  const url = resolveLogoutUrl()
  if (!url) throw new Error('Logout URL no configurada')

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 10_000)

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({}),
      signal: controller.signal,
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado')
    }
    // Silenciaremos cualquier fallo de red; el frontend igual limpiará la sesión
    console.warn('No se pudo cerrar sesión en el servidor', e)
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function requestPasswordReset(email: string) {
  const url = env.auth.forgotPasswordUrl
  if (!url) throw new Error('Servicio de recuperación no disponible')

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 10_000)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      signal: controller.signal,
    })

    if (res.ok) return

    const data = (await res.json().catch(() => null)) as ErrorResponse | null
    throw new Error(
      typeof data?.message === 'string' ? data.message : 'No se pudo enviar el correo de recuperación'
    )
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado')
    }
    throw e
  } finally {
    window.clearTimeout(timeout)
  }
}
