import { useState, useCallback } from 'react'

export interface CrudResult<T> {
  data: T[]
  isLoading: boolean
  error: string | null
  load: () => Promise<void>
  refresh: () => Promise<void>
}

export interface CrudOperations<T, CreateDto, UpdateDto = Partial<CreateDto>> {
  load: () => Promise<T[]>
  create: (data: CreateDto) => Promise<T>
  update: (id: string | number, data: UpdateDto) => Promise<T>
  delete: (id: string | number) => Promise<void>
}

/**
 * Hook genérico para operaciones CRUD
 * Maneja loading, errores y estado de los datos
 */
export function useEntityCrud<T extends { id: string | number }, CreateDto, UpdateDto>(
  operations: CrudOperations<T, CreateDto, UpdateDto>
): CrudResult<T> & {
  create: (data: CreateDto) => Promise<T>
  update: (id: string | number, data: UpdateDto) => Promise<T>
  delete: (id: string | number) => Promise<void>
} {
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await operations.load()
      setData(result || [])
    } catch (err: any) {
      setError(err?.message ?? 'Error al cargar datos')
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [operations])

  const refresh = useCallback(async () => {
    await load()
  }, [load])

  const create = useCallback(
    async (createData: CreateDto) => {
      const result = await operations.create(createData)
      await load()
      return result
    },
    [operations, load]
  )

  const update = useCallback(
    async (id: string | number, updateData: UpdateDto) => {
      const result = await operations.update(id, updateData)
      await load()
      return result
    },
    [operations, load]
  )

  const deleteItem = useCallback(
    async (id: string | number) => {
      await operations.delete(id)
      await load()
    },
    [operations, load]
  )

  // Cargar datos al montar
  const [initialized, setInitialized] = useState(false)
  if (!initialized) {
    load()
    setInitialized(true)
  }

  return {
    data,
    isLoading,
    error,
    load,
    refresh,
    create,
    update,
    delete: deleteItem,
  }
}
