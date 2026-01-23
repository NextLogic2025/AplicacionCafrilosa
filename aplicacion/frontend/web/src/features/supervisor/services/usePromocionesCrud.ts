import { useEffect, useState } from 'react'
import {
  getAllCampanias,
  createCampania,
  updateCampania,
  deleteCampania,
  type Campania,
  type CreateCampaniaDto,
} from './promocionesApi'

export function usePromocionesCrud() {
  const [campanias, setCampanias] = useState<Campania[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string>('')

  useEffect(() => {
    loadCampanias()
  }, [])

  const loadCampanias = async () => {
    setIsLoading(true)
    try {
      const data = await getAllCampanias()
      setCampanias(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error al cargar campañas')
    } finally {
      setIsLoading(false)
    }
  }

  const create = async (data: CreateCampaniaDto) => {
    await createCampania(data)
    setSuccessMessage('Campaña creada correctamente')
    await loadCampanias()
  }

  const update = async (id: string | number, data: CreateCampaniaDto) => {
    const numId = typeof id === 'string' ? parseInt(id) : id
    await updateCampania(numId, data)
    setSuccessMessage('Campaña actualizada correctamente')
    await loadCampanias()
  }

  const remove = async (id: string | number) => {
    const numId = typeof id === 'string' ? parseInt(id) : id
    await deleteCampania(numId)
    setSuccessMessage('Campaña eliminada correctamente')
    await loadCampanias()
  }

  return {
    campanias,
    isLoading,
    error,
    successMessage,
    create,
    update,
    remove,
    reload: loadCampanias,
  }
}
