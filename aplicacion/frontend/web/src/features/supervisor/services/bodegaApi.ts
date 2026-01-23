import { httpWarehouse } from '../../../services/api/http'

// Interfaces matching Mobile App (Almacen)
export interface Bodega {
  id: number
  nombre: string
  codigoRef?: string | null
  direccionFisica?: string | null
  requiereFrio: boolean
  activo: boolean
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export interface CreateBodegaDto {
  nombre: string
  codigoRef?: string
  direccionFisica?: string
  requiereFrio?: boolean
  // Optional in Create, required in Update (handled by logic)
  activo?: boolean
}

// Endpoint: /api/almacenes (on Warehouse Service port 3005)

export async function getAllBodegas(): Promise<Bodega[]> {
  return httpWarehouse<Bodega[]>('/almacenes')
}

export async function createBodega(data: CreateBodegaDto): Promise<Bodega> {
  return httpWarehouse<Bodega>('/almacenes', {
    method: 'POST',
    body: data,
  })
}

export async function updateBodega(id: number, data: Partial<CreateBodegaDto>): Promise<Bodega> {
  return httpWarehouse<Bodega>(`/almacenes/${id}`, {
    method: 'PUT',
    body: data,
  })
}

export async function getDeletedBodegas(): Promise<Bodega[]> {
  return httpWarehouse<Bodega[]>('/almacenes/deleted')
}

export async function restoreBodega(id: number): Promise<void> {
  await httpWarehouse<void>(`/almacenes/${id}/restore`, {
    method: 'POST',
  })
}

export async function deleteBodega(id: number): Promise<void> {
  await httpWarehouse<void>(`/almacenes/${id}`, {
    method: 'DELETE',
  })
}
