import { useState, useEffect, useCallback } from 'react'
import { 
  getAllZonas,
  getZonasConVendedores,
  createZona, 
  updateZona,
  toggleZonaActivo,
  deleteZona,
  asignarVendedorAZona,
  actualizarAsignacionVendedor,
  eliminarAsignacionVendedor,
  type ZonaComercial, 
  type CreateZonaDto 
} from './zonasApi'
import { obtenerVendedores, type Vendedor } from './usuariosApi'

export function useZonas() {
  const [zonas, setZonas] = useState<ZonaComercial[]>([])
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadZonas = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getZonasConVendedores()
      setZonas(data || [])
    } catch (err: any) {
      setError(err?.message ?? 'No se pudieron cargar las zonas')
      setZonas([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadVendedores = useCallback(async () => {
    try {
      const data = await obtenerVendedores()
      setVendedores(data || [])
    } catch (err) {
      console.error('Error al cargar vendedores:', err)
      setVendedores([])
    }
  }, [])

  useEffect(() => {
    loadZonas()
    loadVendedores()
  }, [loadZonas, loadVendedores])

  const crearZonaConVendedor = async (
    zonaData: Omit<CreateZonaDto, 'activo'>,
    vendedorId?: string
  ) => {
    const zonaCreada = await createZona({
      ...zonaData,
      codigo: zonaData.codigo.trim(),
      nombre: zonaData.nombre.trim(),
      ciudad: zonaData.ciudad?.trim() || undefined,
      macrorregion: zonaData.macrorregion?.trim() || undefined,
      poligono_geografico: zonaData.poligono_geografico,
    })

    if (vendedorId && zonaCreada?.id) {
      const vendedor = vendedores.find((v) => v.id === vendedorId)
      await asignarVendedorAZona({
        zona_id: zonaCreada.id,
        vendedor_usuario_id: vendedorId,
        nombre_vendedor_cache: vendedor ? vendedor.nombre : undefined,
      })
    }

    return zonaCreada
  }

  const actualizarZonaConVendedor = async (
    zonaId: number,
    zonaData: Partial<CreateZonaDto>,
    vendedorId?: string,
    asignacionActualId?: number
  ) => {
    const zonaActualizada = await updateZona(zonaId, {
      codigo: zonaData.codigo?.trim(),
      nombre: zonaData.nombre?.trim(),
      ciudad: zonaData.ciudad?.trim() || undefined,
      macrorregion: zonaData.macrorregion?.trim() || undefined,
      poligono_geografico: zonaData.poligono_geografico,
    })

    // Si hay una asignación actual y el vendedor cambió o se eliminó
    if (asignacionActualId) {
      if (!vendedorId) {
        // Se quitó el vendedor
        await eliminarAsignacionVendedor(asignacionActualId)
      } else {
        // Se cambió el vendedor
        const vendedor = vendedores.find((v) => v.id === vendedorId)
        await actualizarAsignacionVendedor(asignacionActualId, {
          vendedor_usuario_id: vendedorId,
          nombre_vendedor_cache: vendedor ? vendedor.nombre : undefined,
        })
      }
    } else if (vendedorId) {
      // No había vendedor y se asignó uno nuevo
      const vendedor = vendedores.find((v) => v.id === vendedorId)
      await asignarVendedorAZona({
        zona_id: zonaId,
        vendedor_usuario_id: vendedorId,
        nombre_vendedor_cache: vendedor ? vendedor.nombre : undefined,
        es_principal: true,
      })
    }

    return zonaActualizada
  }

  const toggleEstadoZona = async (zona: ZonaComercial) => {
    await toggleZonaActivo(zona.id, !zona.activo)
  }

  const eliminarZona = async (id: number) => {
    await deleteZona(id)
  }

  return {
    zonas,
    vendedores,
    isLoading,
    error,
    loadZonas,
    crearZonaConVendedor,
    actualizarZonaConVendedor,
    toggleEstadoZona,
    eliminarZona,
  }
}
