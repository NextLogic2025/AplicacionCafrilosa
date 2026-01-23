import { useEntityCrud } from '../../../hooks/useEntityCrud'
import {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getDeletedProducts,
    restoreProduct,
    type Product,
    type CreateProductDto,
} from './productosApi'

const crudOperations = {
    load: getAllProducts,
    create: createProduct,
    update: (id: string | number, data: Partial<CreateProductDto>) => updateProduct(id as string, data),
    delete: (id: string | number) => deleteProduct(id as string),
}

export function useProductoCrud() {
    const crud = useEntityCrud<Product, CreateProductDto, Partial<CreateProductDto>>(crudOperations)

    return {
        ...crud,
        getDeleted: getDeletedProducts,
        restore: restoreProduct,
    }
}
