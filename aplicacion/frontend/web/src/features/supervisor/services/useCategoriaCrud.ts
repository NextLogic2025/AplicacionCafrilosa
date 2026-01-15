import { useEntityCrud } from '../../../hooks/useEntityCrud'
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getDeletedCategories,
  restoreCategory,
  type Category,
  type CreateCategoryDto
} from './catalogApi'

const crudOperations = {
  load: getAllCategories,
  create: createCategory,
  update: (id: string | number, data: CreateCategoryDto) => updateCategory(typeof id === 'string' ? parseInt(id) : id, data),
  delete: (id: string | number) => deleteCategory(typeof id === 'string' ? parseInt(id) : id),
}

export function useCategoriaCrud() {
  const crud = useEntityCrud<Category, CreateCategoryDto, CreateCategoryDto>(crudOperations)

  return {
    ...crud,
    getDeleted: getDeletedCategories,
    restore: (id: number) => restoreCategory(id)
  }
}
