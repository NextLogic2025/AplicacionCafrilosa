import { http } from '../../../services/api/http'

export interface CreateUsuarioDto {
  email: string
  password: string
  nombre: string
  rolId: number
}

export interface CreateUsuarioResponse {
  id: number
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

export async function createUsuario(data: CreateUsuarioDto): Promise<CreateUsuarioResponse> {
  const response = await http<CreateUsuarioResponse>('/auth/registro', {
    method: 'POST',
    body: data,
  })
  return response
}

export async function obtenerEquipo(): Promise<Usuario[]> {
  const response = await http<Usuario[]>('/auth/usuarios', {
    method: 'GET',
  })
  return response
}
