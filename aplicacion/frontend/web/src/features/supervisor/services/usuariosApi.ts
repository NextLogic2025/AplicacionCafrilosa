import { httpAuth, httpUsuarios, ApiError } from '../../../services/api/http'

// Obtener todos los usuarios desde /auth/usuarios
export async function obtenerUsuarios(): Promise<Usuario[]> {
  // Cambiado a la ruta correcta
  return httpUsuarios<Usuario[]>('/usuarios/me')
}

export interface CreateUsuarioDto {
  email: string
  password: string
  nombre: string
  rolId: number
}

export interface CreateUsuarioResponse {
  id: string
  email: string
  nombre: string
  rolId: number
  activo: boolean
  createdAt: string
}

export interface Usuario {
  id: string
  email: string
  nombre: string
  /** Nombre completo, si está disponible */
  nombreCompleto?: string
  telefono: string | null
  avatarUrl: string | null
  emailVerificado: boolean
  activo: boolean
  createdAt: string
  rol: {
    id: number
    nombre: string
  }
}

export interface UpdateUsuarioDto {
  email?: string
  password?: string
  nombre?: string
  telefono?: string | null
  rolId?: number
  activo?: boolean
}

export interface Vendedor extends Usuario {}

// Registro de usuario - usa la ruta de autenticación en puerto 3001
export async function createUsuario(data: CreateUsuarioDto): Promise<CreateUsuarioResponse> {
  const response = await httpAuth<CreateUsuarioResponse>('/auth/registro', {
    method: 'POST',
    body: data,
    auth: false,
  })
  return response
}

// Operaciones de usuarios - usan puerto 3002
export async function obtenerEquipo(): Promise<Usuario[]> {
  return httpUsuarios<Usuario[]>('/usuarios')
}

export async function getUsuario(id: string): Promise<Usuario | null> {
  try {
    return await httpUsuarios<Usuario>(`/usuarios/${id}`)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null
    throw e
  }
}

export async function updateUsuario(id: string, data: UpdateUsuarioDto): Promise<Usuario> {
  return httpUsuarios<Usuario>(`/usuarios/${id}`, {
    method: 'PUT',
    body: data,
  })
}

export async function desactivarUsuario(id: string): Promise<Usuario> {
  return httpUsuarios<Usuario>(`/usuarios/${id}/desactivar`, {
    method: 'PUT',
  })
}

export async function activarUsuario(id: string): Promise<Usuario> {
  return httpUsuarios<Usuario>(`/usuarios/${id}/activar`, {
    method: 'PUT',
  })
}

export async function obtenerVendedores(): Promise<Vendedor[]> {
  return httpUsuarios<Vendedor[]>('/usuarios/vendedores')
}

export async function listarUsuariosDesactivados(): Promise<Usuario[]> {
  return httpUsuarios<Usuario[]>('/usuarios/desactivados')
}

