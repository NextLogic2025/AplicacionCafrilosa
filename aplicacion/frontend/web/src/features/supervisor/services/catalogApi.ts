import { httpCatalogo } from '../../../services/api/http'

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
  return httpCatalogo<Category[]>('/categories')
}

export async function createCategory(data: CreateCategoryDto): Promise<Category> {
  return httpCatalogo<Category>('/categories', {
    method: 'POST',
    body: data,
  })
}

export async function updateCategory(id: number, data: Partial<CreateCategoryDto>): Promise<Category> {
  return httpCatalogo<Category>(`/categories/${id}`, {
    method: 'PUT',
    body: data,
  })
}

export async function getDeletedCategories(): Promise<Category[]> {
  return httpCatalogo<Category[]>('/categories/deleted')
}

export async function restoreCategory(id: number): Promise<void> {
  await httpCatalogo<void>(`/categories/${id}/restore`, {
    method: 'POST',
  })
}

export async function deleteCategory(id: number): Promise<void> {
  await httpCatalogo<void>(`/categories/${id}`, {
    method: 'DELETE',
  })
}

