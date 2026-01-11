import { useState, useEffect, useCallback } from 'react'
import { getAllZonas, type ZonaComercial } from './zonasApi'
import {
    obtenerClientesPorZona,
    obtenerRuteroPorZonaYDia,
    guardarRutero,
    obtenerTodasLasRutas,
    eliminarRutaPorZonaYDia,
} from './ruteroApi'
import type { ClienteRutero, RuteroPlanificado, DiaSemana } from './types'

interface RutaGuardada {
    zona_id: number
    zona_nombre: string
    dia_semana: DiaSemana
    clientes: RuteroPlanificado[]
}

const resolveZonaId = (cliente: Partial<ClienteRutero> | null | undefined): number | null => {
    if (!cliente) return null
    if (typeof cliente.zona_comercial_id === 'number') {
        return cliente.zona_comercial_id
    }
    const zonaObj = cliente.zona_comercial
    if (zonaObj && typeof zonaObj.id === 'number') {
        return zonaObj.id ?? null
    }
    return null
}

export function useRutero() {
    const [zonas, setZonas] = useState<ZonaComercial[]>([])
    const [zonaSeleccionada, setZonaSeleccionada] = useState<number | null>(null)
    const [diaSeleccionado, setDiaSeleccionado] = useState<DiaSemana>('LUNES')
    const [clientes, setClientes] = useState<ClienteRutero[]>([])
    const [ruteroActual, setRuteroActual] = useState<RuteroPlanificado[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [rutasGuardadas, setRutasGuardadas] = useState<RutaGuardada[]>([])
    const [isLoadingRutas, setIsLoadingRutas] = useState(false)

    useEffect(() => {
        let cancelado = false
        const loadZonas = async () => {
            try {
                const data = await getAllZonas()
                if (cancelado) return
                setZonas(data ?? [])
                if (!zonaSeleccionada && data && data.length > 0) {
                    setZonaSeleccionada(data[0].id)
                }
            } catch (err: any) {
                if (!cancelado) {
                    setError(err?.message ?? 'Error al cargar zonas')
                }
            }
        }
        void loadZonas()
        return () => {
            cancelado = true
        }
    }, [zonaSeleccionada])

    const cargarClientesRutero = useCallback(async () => {
        if (!zonaSeleccionada) return

        setIsLoading(true)
        setError(null)

        try {
            const [clientesData, ruteroData] = await Promise.all([
                obtenerClientesPorZona(zonaSeleccionada),
                obtenerRuteroPorZonaYDia(zonaSeleccionada, diaSeleccionado).catch(() => []),
            ])

            setRuteroActual(ruteroData)

            const clientesZona = clientesData.filter(
                (cliente) => resolveZonaId(cliente) === zonaSeleccionada,
            )

            const clientesConRutero = clientesZona.map((cliente) => {
                const rutero = ruteroData.find((r) => r.cliente_id === cliente.id)
                return {
                    ...cliente,
                    orden: rutero?.orden_sugerido ?? cliente.orden ?? 999,
                    hora_estimada: rutero?.hora_estimada ?? cliente.hora_estimada ?? null,
                    prioridad: rutero?.prioridad_visita ?? cliente.prioridad ?? 'MEDIA',
                    frecuencia: rutero?.frecuencia ?? cliente.frecuencia ?? 'SEMANAL',
                    activo: rutero?.activo ?? (cliente.activo ?? true),
                    ruteroId: rutero?.id ?? cliente.ruteroId ?? null,
                    fueraDeZona: false,
                } as ClienteRutero
            })

            const clientesFueraDeZona = ruteroData
                .filter((ruta) => !clientesZona.some((cliente) => cliente.id === ruta.cliente_id))
                .map((ruta) => {
                    const clienteReferencia = clientesData.find((cliente) => cliente.id === ruta.cliente_id)
                    const zonaAsignadaId = resolveZonaId(clienteReferencia)
                    const zonaAsignadaNombre =
                        zonaAsignadaId != null
                            ? zonas.find((zona) => zona.id === zonaAsignadaId)?.nombre ?? `Zona ${zonaAsignadaId}`
                            : null

                    return {
                        id: ruta.cliente_id,
                        razon_social:
                            clienteReferencia?.razon_social ?? clienteReferencia?.nombre ?? 'Cliente sin nombre',
                        nombre_comercial: clienteReferencia?.nombre_comercial ?? null,
                        prioridad: ruta.prioridad_visita ?? clienteReferencia?.prioridad ?? 'MEDIA',
                        frecuencia: ruta.frecuencia ?? clienteReferencia?.frecuencia ?? 'SEMANAL',
                        orden: ruta.orden_sugerido ?? clienteReferencia?.orden ?? 999,
                        hora_estimada: ruta.hora_estimada ?? clienteReferencia?.hora_estimada ?? null,
                        activo: ruta.activo ?? clienteReferencia?.activo ?? true,
                        ruteroId: ruta.id ?? clienteReferencia?.ruteroId ?? null,
                        ubicacion_gps: clienteReferencia?.ubicacion_gps ?? null,
                        sucursales: clienteReferencia?.sucursales ?? [],
                        fueraDeZona: true,
                        zonaAsignadaId,
                        zonaAsignadaNombre,
                    } as ClienteRutero
                })

            const combinados = [...clientesConRutero, ...clientesFueraDeZona]

            combinados.sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999))

            const normalizados = combinados.map((cliente, index) => ({
                ...cliente,
                orden: index,
            }))

            setClientes(normalizados)
        } catch (err: any) {
            setClientes([])
            setError(err?.message ?? 'Error al cargar clientes')
        } finally {
            setIsLoading(false)
        }
    }, [zonaSeleccionada, diaSeleccionado, zonas])

    useEffect(() => {
        void cargarClientesRutero()
    }, [cargarClientesRutero])

    const handleReordenar = useCallback((clienteId: string, nuevoOrden: number) => {
        setClientes((prev) => {
            const nuevos = [...prev]
            const index = nuevos.findIndex((c) => c.id === clienteId)
            if (index === -1) return prev

            const [cliente] = nuevos.splice(index, 1)
            nuevos.splice(nuevoOrden, 0, cliente)

            return nuevos.map((c, idx) => ({ ...c, orden: idx }))
        })
    }, [])

    const handleActualizarHora = useCallback((clienteId: string, hora: string) => {
        setClientes((prev) =>
            prev.map((c) => (c.id === clienteId ? { ...c, hora_estimada: hora } : c)),
        )
    }, [])

    const handleActualizarPrioridad = useCallback(
        (clienteId: string, prioridad: 'ALTA' | 'MEDIA' | 'BAJA') => {
            setClientes((prev) =>
                prev.map((c) => (c.id === clienteId ? { ...c, prioridad } : c)),
            )
        },
        [],
    )

    const handleActualizarFrecuencia = useCallback(
        (clienteId: string, frecuencia: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL') => {
            setClientes((prev) =>
                prev.map((c) => (c.id === clienteId ? { ...c, frecuencia } : c)),
            )
        },
        [],
    )

    const handleGuardar = useCallback(async (clientesSeleccionadosIds?: string[]) => {
        if (!zonaSeleccionada) return

        try {
            setIsSaving(true)
            setError(null)

            // Si se pasan clientes seleccionados, solo guardar esos
            let clientesAGuardar = clientes
            if (clientesSeleccionadosIds && clientesSeleccionadosIds.length > 0) {
                clientesAGuardar = clientes.filter(
                    (cliente) => !cliente.fueraDeZona && clientesSeleccionadosIds.includes(cliente.id)
                )
            } else {
                clientesAGuardar = clientes.filter((cliente) => !cliente.fueraDeZona)
            }

            const ruteroData: RuteroPlanificado[] = clientesAGuardar.map((cliente) => ({
                id: cliente.ruteroId ?? undefined,
                cliente_id: cliente.id,
                zona_id: zonaSeleccionada,
                dia_semana: diaSeleccionado,
                frecuencia: cliente.frecuencia ?? 'SEMANAL',
                prioridad_visita: cliente.prioridad ?? 'MEDIA',
                orden_sugerido: cliente.orden ?? 999,
                hora_estimada: cliente.hora_estimada ?? null,
                activo: cliente.activo ?? true,
            }))

            const idsVigentes = new Set(
                ruteroData
                    .map((item) => item.id)
                    .filter((id): id is string => typeof id === 'string' && id.length > 0),
            )

            const eliminados = ruteroActual
                .map((ruta) => ruta.id)
                .filter(
                    (id): id is string =>
                        typeof id === 'string' && id.length > 0 && !idsVigentes.has(id),
                )

            await guardarRutero(ruteroData, eliminados.length > 0 ? eliminados : undefined)
            await cargarClientesRutero()
        } catch (err: any) {
            setError(err?.message ?? 'Error al guardar rutero')
        } finally {
            setIsSaving(false)
        }
    }, [zonaSeleccionada, diaSeleccionado, clientes, ruteroActual, cargarClientesRutero])

    const cargarRutasGuardadas = useCallback(async () => {
        try {
            setIsLoadingRutas(true)
            const todasLasRutas = await obtenerTodasLasRutas()

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

    const handleEliminarRuta = useCallback(
        async (zonaId: number, dia: string) => {
            try {
                await eliminarRutaPorZonaYDia(zonaId, dia as DiaSemana)
                await cargarRutasGuardadas()
            } catch (err: any) {
                setError(err?.message ?? 'Error al eliminar ruta')
            }
        },
        [cargarRutasGuardadas],
    )

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
        rutasGuardadas,
        isLoadingRutas,
        cargarRutasGuardadas,
        handleSeleccionarRuta,
        handleEliminarRuta,
    }
}

export type { RutaGuardada }
