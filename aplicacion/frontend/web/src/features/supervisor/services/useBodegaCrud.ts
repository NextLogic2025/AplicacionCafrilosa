import { useEntityCrud } from '../../../hooks/useEntityCrud'
import {
    getAllBodegas,
    createBodega,
    updateBodega,
    deleteBodega,
    getDeletedBodegas,
    restoreBodega,
    type Bodega,
    type CreateBodegaDto
} from './bodegaApi'

const crudOperations = {
    load: getAllBodegas,
    create: createBodega,
    update: (id: string | number, data: CreateBodegaDto) => updateBodega(typeof id === 'string' ? parseInt(id) : id, data),
    delete: (id: string | number) => deleteBodega(typeof id === 'string' ? parseInt(id) : id),
}

export function useBodegaCrud() {
    const crud = useEntityCrud<Bodega, CreateBodegaDto, CreateBodegaDto>(crudOperations)

    return {
        ...crud,
        getDeleted: getDeletedBodegas,
        restore: (id: number) => restoreBodega(id)
    }
}
