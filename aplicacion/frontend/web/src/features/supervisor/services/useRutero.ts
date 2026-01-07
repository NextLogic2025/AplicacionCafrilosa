import { useState, useEffect, useCallback } from 'react'
import { getAllZonas, type ZonaComercial } from './zonasApi'
import { 
  obtenerClientesPorZona, 
  obtenerRuteroPorZonaYDia, 
  guardarRutero, 
  actualizarOrdenRutero,
  obtenerTodasLasRutas,
  eliminarRutaPorZonaYDia
} from './ruteroApi'
import type { ClienteRutero, RuteroPlanificado, DiaSemana } from './types'

interface RutaGuardada {
  zona_id: number
  zona_nombre: string
  dia_semana: string
  clientes: RuteroPlanificado[]
}

export function useRutero() {
  const [zonas, setZonas] = useState<ZonaComercial[]>([])
  const [zonaSeleccionada, setZonaSeleccionada] = useState<number | null>(null)
  const [diaSeleccionado, setDiaSeleccionado] = useState<DiaSemana>('LUNES')
  const [clientes, setClientes] = useState<ClienteRutero[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rutasGuardadas, setRutasGuardadas] = useState<RutaGuardada[]>([])
  const [isLoadingRutas, setIsLoadingRutas] = useState(false)

  // Cargar zonas al inicio
  useEffect(() => {
    const loadZonas = async () => {
      try {
        const data = await getAllZonas()
        setZonas(data || [])
        if (data && data.length > 0 && !zonaSeleccionada) {
          setZonaSeleccionada(data[0].id)
        }
      } catch (err: any) {
        setError(err?.message ?? 'Error al cargar zonas')
      }
    }
    loadZonas()
  }, [])

  // Cargar clientes cuando cambia zona o día
  const cargarClientesRutero = useCallback(async () => {
    if (!zonaSeleccionada) return

    try {
      setIsLoading(true)
      setError(null)

      const [clientesData, ruteroData] = await Promise.all([
        obtenerClientesPorZona(zonaSeleccionada),
        obtenerRuteroPorZonaYDia(zonaSeleccionada, diaSeleccionado).catch(() => []),
      ])

      // Combinar clientes con datos del rutero
      const clientesConRutero = clientesData.map((cliente) => {
        const rutero = ruteroData.find((r) => r.cliente_id === cliente.id)
        return {
          ...cliente,
          orden: rutero?.orden_sugerido ?? 999,
          hora_estimada: rutero?.hora_estimada ?? null,
          prioridad: rutero?.prioridad_visita ?? cliente.prioridad ?? 'MEDIA',
          frecuencia: rutero?.frecuencia ?? 'SEMANAL',
          activo: rutero?.activo ?? true,
        }
      })

      // Ordenar por orden
      clientesConRutero.sort((a, b) => a.orden - b.orden)

      setClientes(clientesConRutero)
    } catch (err: any) {
      setError(err?.message ?? 'Error al cargar clientes')
      setClientes([])
    } finally {
      setIsLoading(false)
    }
  }, [zonaSeleccionada, diaSeleccionado])

  useEffect(() => {
    cargarClientesRutero()
  }, [cargarClientesRutero])

  const handleReordenar = useCallback(
    (clienteId: string, nuevoOrden: number) => {
      setClientes((prev) => {
        const newClientes = [...prev]
        const index = newClientes.findIndex((c) => c.id === clienteId)
        if (index === -1) return prev

        const [cliente] = newClientes.splice(index, 1)
        newClientes.splice(nuevoOrden, 0, cliente)

        // Actualizar órdenes
        return newClientes.map((c, idx) => ({ ...c, orden: idx }))
      })
    },
    []
  )

  const handleActualizarHora = useCallback((clienteId: string, hora: string) => {
    setClientes((prev) =>
      prev.map((c) => (c.id === clienteId ? { ...c, hora_estimada: hora } : c))
    )
  }, [])

  const handleActualizarPrioridad = useCallback((clienteId: string, prioridad: 'ALTA' | 'MEDIA' | 'BAJA') => {
    setClientes((prev) =>
      prev.map((c) => (c.id === clienteId ? { ...c, prioridad } : c))
    )
  }, [])

  const handleActualizarFrecuencia = useCallback((clienteId: string, frecuencia: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL') => {
    setClientes((prev) =>
      prev.map((c) => (c.id === clienteId ? { ...c, frecuencia } : c))
    )
  }, [])

  const handleGuardar = useCallback(async () => {
    if (!zonaSeleccionada) return

    try {
      setIsSaving(true)
      setError(null)

      const ruteroData: RuteroPlanificado[] = clientes.map((cliente) => ({
        cliente_id: cliente.id,
        zona_id: zonaSeleccionada,
        dia_semana: diaSeleccionado,
        frecuencia: cliente.frecuencia,
        prioridad_visita: cliente.prioridad,
        orden_sugerido: cliente.orden,
        hora_estimada: cliente.hora_estimada || '',
        activo: cliente.activo,
      }))

      await guardarRutero(ruteroData)
      await cargarClientesRutero()
    } catch (err: any) {
      setError(err?.message ?? 'Error al guardar rutero')
    } finally {
      setIsSaving(false)
    }
  }, [zonaSeleccionada, diaSeleccionado, clientes, cargarClientesRutero])

  const cargarRutasGuardadas = useCallback(async () => {
    try {
      setIsLoadingRutas(true)
      const todasLasRutas = await obtenerTodasLasRutas()
      
      // Agrupar por zona y día
      const agrupadas = todasLasRutas.reduce((acc, ruta) => {
        const key = `${ruta.zona_id}-${ruta.dia_semana}`
        if (!acc[key]) {
          const zona = zonas.find((z) => z.id === ruta.zona_id)
          acc[key] = {
            zona_id: ruta.zona_id,
            zona_nombre: zona?.nombre ?? 'Zona desconocida',
            dia_semana: ruta.dia_semana,
            clientes: [],
          }
        }
        acc[key].clientes.push(ruta)
        return acc
      }, {} as Record<string, RutaGuardada>)

      // Ordenar clientes dentro de cada ruta
      Object.values(agrupadas).forEach((ruta) => {
        ruta.clientes.sort((a, b) => a.orden_sugerido - b.orden_sugerido)
      })

      setRutasGuardadas(Object.values(agrupadas))
    } catch (err: any) {
      setError(err?.message ?? 'Error al cargar rutas guardadas')
      setRutasGuardadas([])
    } finally {
      setIsLoadingRutas(false)
    }
  }, [zonas])

  const handleSeleccionarRuta = useCallback((zonaId: number, dia: string) => {
    setZonaSeleccionada(zonaId)
    setDiaSeleccionado(dia as DiaSemana)
  }, [])

  const handleEliminarRuta = useCallback(async (zonaId: number, dia: string) => {
    try {
      await eliminarRutaPorZonaYDia(zonaId, dia as DiaSemana)
      await cargarRutasGuardadas()
    } catch (err: any) {
      setError(err?.message ?? 'Error al eliminar ruta')
    }
  }, [cargarRutasGuardadas])

  return {
    zonas,
    zonaSeleccionada,
    setZonaSeleccionada,
    diaSeleccionado,
    setDiaSeleccionado,
    clientes,
    isLoading,
    isSaving,
    error,
    handleReordenar,
    handleActualizarHora,
    handleActualizarPrioridad,
    handleActualizarFrecuencia,
    handleGuardar,
    recargar: cargarClientesRutero,
    // Nuevas funciones para rutas guardadas
    rutasGuardadas,
    isLoadingRutas,
    cargarRutasGuardadas,
    handleSeleccionarRuta,
    handleEliminarRuta,
  }
}

export type { RutaGuardada }
