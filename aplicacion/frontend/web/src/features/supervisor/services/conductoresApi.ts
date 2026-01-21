import { httpLogistics } from '../../../services/api/http'

export interface Conductor {
    id: string
    usuario_id: string | null
    nombre_completo: string
    cedula: string
    telefono: string | null
    licencia: string | null
    activo: boolean
    created_at: string
    updated_at: string
}

export interface CreateConductorDto {
    nombre_completo: string
    cedula: string
    telefono?: string
    licencia?: string
}

export async function getConductores(): Promise<Conductor[]> {
    return await httpLogistics<Conductor[]>('/conductores')
}

export async function getConductor(id: string): Promise<Conductor> {
    return await httpLogistics<Conductor>(`/conductores/${id}`)
}

export async function createConductor(data: CreateConductorDto): Promise<Conductor> {
    return await httpLogistics<Conductor>('/conductores', {
        method: 'POST',
        body: data
    })
}
