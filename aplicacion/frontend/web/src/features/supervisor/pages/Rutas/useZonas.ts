import { useState, useEffect, useCallback } from 'react'
import { 
  getAllZonas,
  getZonasConVendedores,
  createZona, 
  updateZona,
  toggleZonaActivo,
  asignarVendedorAZona,
  type ZonaComercial, 
  type CreateZonaDto 
} from '../../services/zonasApi'
import { obtenerVendedores, type Vendedor } from '../../services/usuariosApi'

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
    })

    if (vendedorId && zonaCreada?.id) {
      const vendedor = vendedores.find((v) => v.id === vendedorId)
      await asignarVendedorAZona({
        zona_id: zonaCreada.id,
        vendedor_usuario_id: vendedorId,
        nombre_vendedor_cache: vendedor ? `${vendedor.nombre} ${vendedor.apellido || ''}`.trim() : null,
        es_principal: true,
      })
    }

    return zonaCreada
  }

  const actualizarZonaConVendedor = async (
    zonaId: number,
    zonaData: Partial<CreateZonaDto>,
    vendedorId?: string
  ) => {
    const zonaActualizada = await updateZona(zonaId, {
      codigo: zonaData.codigo?.trim(),
      nombre: zonaData.nombre?.trim(),
      ciudad: zonaData.ciudad?.trim() || undefined,
      macrorregion: zonaData.macrorregion?.trim() || undefined,
    })

    if (vendedorId && zonaId) {
      const vendedor = vendedores.find((v) => v.id === vendedorId)
      await asignarVendedorAZona({
        zona_id: zonaId,
        vendedor_usuario_id: vendedorId,
        nombre_vendedor_cache: vendedor ? `${vendedor.nombre} ${vendedor.apellido || ''}`.trim() : null,
        es_principal: true,
      })
    }

    return zonaActualizada
  }

  const toggleEstadoZona = async (zona: ZonaComercial) => {
    await toggleZonaActivo(zona.id, !zona.activo)
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
  }
}
