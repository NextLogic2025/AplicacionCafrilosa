import { useEntityCrud } from '../../../hooks/useEntityCrud'
import { 
  getAllCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  type Category, 
  type CreateCategoryDto 
} from './catalogApi'

export function useCategoriaCrud() {
  return useEntityCrud<Category, CreateCategoryDto, CreateCategoryDto>({
    load: getAllCategories,
    create: createCategory,
    update: (id: string | number, data: CreateCategoryDto) => updateCategory(typeof id === 'string' ? parseInt(id) : id, data),
    delete: (id: string | number) => deleteCategory(typeof id === 'string' ? parseInt(id) : id),
  })
}
