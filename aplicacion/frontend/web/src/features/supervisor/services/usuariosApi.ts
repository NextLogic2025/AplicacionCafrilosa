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

export async function createUsuario(data: CreateUsuarioDto): Promise<CreateUsuarioResponse> {
  const response = await http<CreateUsuarioResponse>('/auth/registro', {
    method: 'POST',
    body: data,
  })
  return response
}
