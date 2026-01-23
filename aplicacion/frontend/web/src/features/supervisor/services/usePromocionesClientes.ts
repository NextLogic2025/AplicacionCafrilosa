import { useState } from 'react'
import { getClientesByCampania, addClienteCampania, deleteClienteCampania, type ClienteCampania } from './promocionesApi'
import { obtenerCliente, type Cliente } from './clientesApi'

export function usePromocionesClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clientesCampania, setClientesCampania] = useState<ClienteCampania[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadClientes = async () => {
    setIsLoading(true)
    try {
      // Aquí podrías cargar todos los clientes o filtrar según lógica de negocio
      setClientes([])
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error al cargar clientes')
    } finally {
      setIsLoading(false)
    }
  }

  const loadClientesCampania = async (campaniaId: string | number) => {
    setIsLoading(true)
    try {
      const id = typeof campaniaId === 'string' ? parseInt(campaniaId) : campaniaId
      const data: any[] = await getClientesByCampania(id) as any
      let normalizados: ClienteCampania[] = []
      if (Array.isArray(data) && data.length > 0 && 'razon_social' in data[0]) {
        // La API devolvió clientes completos (listar clientes permitidos)
        normalizados = (data as any[]).map((c: any) => ({
          campania_id: id,
          cliente_id: c.id,
          cliente: {
            id: c.id,
            identificacion: c.identificacion,
            razon_social: c.razon_social,
          },
        }))
      } else {
        // Forma clásica ClienteCampania[]; enriquecer consultando cada cliente si falta
        const base = (data as ClienteCampania[])
        normalizados = await Promise.all(
          base.map(async (cc) => {
            if (cc.cliente && cc.cliente.razon_social) return cc
            try {
              const c = await obtenerCliente(cc.cliente_id)
              return {
                ...cc,
                cliente: { id: c.id, identificacion: c.identificacion, razon_social: c.razon_social },
              }
            } catch {
              return cc
            }
          })
        )
      }
      setClientesCampania(normalizados)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Error al cargar clientes de la campaña')
    } finally {
      setIsLoading(false)
    }
  }

  const addCliente = async (campaniaId: string | number, clienteId: string) => {
    const id = typeof campaniaId === 'string' ? parseInt(campaniaId) : campaniaId
    await addClienteCampania(id, { cliente_id: clienteId })
    await loadClientesCampania(id)
  }

  const removeCliente = async (campaniaId: string | number, clienteId: string) => {
    const id = typeof campaniaId === 'string' ? parseInt(campaniaId) : campaniaId
    await deleteClienteCampania(id, clienteId)
    await loadClientesCampania(id)
  }

  return {
    clientes,
    clientesCampania,
    isLoading,
    error,
    loadClientes,
    loadClientesCampania,
    addCliente,
    removeCliente,
  }
}
