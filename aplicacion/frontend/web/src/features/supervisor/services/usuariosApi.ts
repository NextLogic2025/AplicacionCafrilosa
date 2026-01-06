import { http } from '../../../services/api/http'

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
}

export interface Vendedor extends Usuario {}

export async function createUsuario(data: CreateUsuarioDto): Promise<CreateUsuarioResponse> {
  const response = await http<CreateUsuarioResponse>('/auth/registro', {
    method: 'POST',
    body: data,
    auth: false, // registro no requiere token; evita problemas si hay un token inválido
  })
  return response
}

export async function obtenerEquipo(): Promise<Usuario[]> {
  const response = await http<Usuario[]>('/auth/usuarios', {
    method: 'GET',
  })
  return response
}

export async function getUsuario(id: string): Promise<Usuario> {
  const response = await http<Usuario>(`/auth/usuarios/${id}`)
  return response
}

export async function updateUsuario(id: string, data: UpdateUsuarioDto): Promise<Usuario> {
  const response = await http<Usuario>(`/auth/usuarios/${id}`, {
    method: 'PATCH',
    body: data,
  })
  return response
}

export async function obtenerVendedores(): Promise<Vendedor[]> {
  const response = await http<Vendedor[]>('/auth/vendedores', {
    method: 'GET',
  })
  return response
}
