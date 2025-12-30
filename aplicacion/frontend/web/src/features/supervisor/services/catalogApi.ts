import { http } from '../../../services/api/http'

// Nota: El servicio de catálogo corre en el puerto 3000
const CATALOG_BASE_URL = 'http://localhost:3000'

export interface Category {
  id: number
  nombre: string
  descripcion: string | null
  imagen_url: string | null
  activo: boolean
  created_at: string
  deleted_at: string | null
}

export interface CreateCategoryDto {
  nombre: string
  descripcion?: string
  imagen_url?: string
  activo?: boolean
}

export async function getAllCategories(): Promise<Category[]> {
  const response = await fetch(`${CATALOG_BASE_URL}/categories`)
  if (!response.ok) {
    throw new Error('Error al obtener categorías')
  }
  return response.json()
}

export async function createCategory(data: CreateCategoryDto): Promise<Category> {
  const response = await http<Category>('/categories', {
    method: 'POST',
    body: data,
  })
  return response
}

export async function updateCategory(id: number, data: Partial<CreateCategoryDto>): Promise<Category> {
  const response = await http<Category>(`/categories/${id}`, {
    method: 'PUT',
    body: data,
  })
  return response
}

export async function deleteCategory(id: number): Promise<void> {
  await http<void>(`/categories/${id}`, {
    method: 'DELETE',
  })
}
