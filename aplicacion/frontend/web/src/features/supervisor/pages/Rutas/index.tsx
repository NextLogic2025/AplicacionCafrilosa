import { useState, useEffect, useMemo } from 'react'
import { Save, AlertCircle, List, Map, Globe } from 'lucide-react'
import { PageHero } from 'components/ui/PageHero'
import { RuteroAgenda } from './RuteroAgenda'
import { RuteroMapa } from './RuteroMapa'
import { RuteroLista } from './RuteroLista'
import { MapaCompleto } from './MapaCompleto'
import { useRutero } from '../../services/useRutero'
import type { SucursalRutero, ClienteRutero } from '../../services/types'
import { obtenerSucursales as obtenerSucursalesApi } from '../../services/sucursalesApi'
import { obtenerClientes as obtenerClientesApi } from '../../services/clientesApi'

// Helper: Parse GeoJSON polygon to lat/lng array
function parseGeoPolygon(value: unknown): { lat: number; lng: number }[] {
  if (!value) return []

  if (Array.isArray(value) && value.every((p: any) => typeof p?.lat === 'number' && typeof p?.lng === 'number')) {
    return value as { lat: number; lng: number }[]
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parseGeoPolygon(parsed)
    } catch {
      return []
    }
  }

  if (typeof value === 'object' && value !== null && 'coordinates' in (value as any)) {
    const coordinates = (value as any).coordinates?.[0]
    if (Array.isArray(coordinates)) {
      return coordinates
        .map((pair: any) => {
          if (!Array.isArray(pair) || pair.length < 2) return null
          const [lng, lat] = pair
          if (typeof lat !== 'number' || typeof lng !== 'number') return null
          return { lat, lng }
        })
        .filter(Boolean) as { lat: number; lng: number }[]
    }
  }

  return []
}

// Ray-casting algorithm for point in polygon
function isPointInPolygon(point: { lat: number; lng: number }, polygon: { lat: number; lng: number }[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng
    const yi = polygon[i].lat
    const xj = polygon[j].lng
    const yj = polygon[j].lat

    const intersect = yi > point.lat !== yj > point.lat && point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi + 1e-9) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export default function RutasPage() {
  const {
    zonas,
    zonaSeleccionada,
    diaSeleccionado,
    clientes,
    isLoading,
    isSaving,
    error,
    setZonaSeleccionada,
    setDiaSeleccionado,
    handleReordenar,
    handleActualizarHora,
    handleActualizarPrioridad,
    handleActualizarFrecuencia,
    handleActualizarDireccion,
    handleGuardar,
    rutasGuardadas,
    isLoadingRutas,
    cargarRutasGuardadas,
    handleSeleccionarRuta,
    handleEliminarRuta,
    limpiarRuteroSeleccionado,
  } = useRutero()

  // Estado para rastrear clientes seleccionados por día (objeto plano para compatibilidad)
  const [clientesSeleccionadosPorDia, setClientesSeleccionadosPorDia] = useState<Record<string, string[]>>({})

  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [vistaActual, setVistaActual] = useState<'planificar' | 'listar' | 'mapa-completo'>('planificar')
  const [sucursales, setSucursales] = useState<SucursalRutero[]>([])
  const [todosLosClientes, setTodosLosClientes] = useState<ClienteRutero[]>([])

  const zonaActual = zonas.find((z) => z.id === zonaSeleccionada) || null

  // Obtener la clave única para el día/zona
  const diaZonaKey = `${zonaSeleccionada}-${diaSeleccionado}`

  // Obtener clientes seleccionados para el día actual
  const clientesSeleccionadosHoy = useMemo(() => {
    return new Set(clientesSeleccionadosPorDia[diaZonaKey] || [])
  }, [clientesSeleccionadosPorDia, diaZonaKey])

  // Toggle de cliente seleccionado
  const toggleClienteSeleccionado = (clienteId: string) => {
    setClientesSeleccionadosPorDia((prev) => {
      const actuales = new Set(prev[diaZonaKey] || [])
      if (actuales.has(clienteId)) actuales.delete(clienteId)
      else actuales.add(clienteId)

      const siguiente = { ...prev }
      if (actuales.size === 0) delete siguiente[diaZonaKey]
      else siguiente[diaZonaKey] = Array.from(actuales)

      return siguiente
    })
  }


  // Filtrar clientes por zona usando polígono
  const clientesFiltrados = useMemo(() => {
    if (!zonaActual?.poligono_geografico) return clientes
    
    const zonaPaths = parseGeoPolygon(zonaActual.poligono_geografico)
    if (!zonaPaths.length) return clientes

    return clientes.filter((c) => {
      if (!c.ubicacion_gps) return false
      const [lng, lat] = c.ubicacion_gps.coordinates
      return isPointInPolygon({ lat, lng }, zonaPaths)
    })
  }, [clientes, zonaActual])

  // Seleccionar/deseleccionar todos
  const toggleTodosLosClientes = () => {
    setClientesSeleccionadosPorDia((prev) => {
      const siguiente = { ...prev }
      if (clientesSeleccionadosHoy.size === clientesFiltrados.length) {
        // Deseleccionar todos
        delete siguiente[diaZonaKey]
      } else {
        // Seleccionar todos
        siguiente[diaZonaKey] = clientesFiltrados.map((c) => c.id)
      }
      return siguiente
    })
  }

  // Filtrar clientes según la selección del día y ajustar ubicacion_gps si es sucursal
  const clientesParaMostrar = useMemo(() => {
    if (clientesSeleccionadosHoy.size === 0) return []
    return clientesFiltrados
      .filter(c => clientesSeleccionadosHoy.has(c.id))
      .map(c => {
        if (c.tipo_direccion === 'SUCURSAL' && c.sucursal_id && c.sucursales?.length) {
          const suc = c.sucursales.find(s => s.id === c.sucursal_id)
          if (suc && suc.ubicacion_gps) {
            return { ...c, ubicacion_gps: suc.ubicacion_gps }
          }
        }
        return c
      })
  }, [clientesFiltrados, clientesSeleccionadosHoy])

  // Cargar todos los clientes y sus sucursales para el mapa completo
  useEffect(() => {
    const cargarTodosLosClientes = async () => {
      if (vistaActual !== 'mapa-completo') return
      
      try {
        const clientesData = await obtenerClientesApi()
        setTodosLosClientes(clientesData.map(cliente => ({
          id: cliente.id,
          razon_social: cliente.razon_social,
          nombre_comercial: cliente.nombre_comercial ?? null,
          ubicacion_gps: cliente.ubicacion_gps ?? null,
          zona_comercial_id: cliente.zona_comercial_id ?? null,
        })))
        
        // Cargar sucursales para todos los clientes
        const todasSucursales: SucursalRutero[] = []
        for (const cliente of clientesData) {
          try {
            const sucursales = await obtenerSucursalesApi(cliente.id)
            todasSucursales.push(...sucursales.map((sucursal: any) => ({
              id: sucursal.id,
              nombre_sucursal: sucursal.nombre_sucursal,
              ubicacion_gps: sucursal.ubicacion_gps,
              zona_id: sucursal.zona_id ?? null,
            })))
          } catch (error) {
            console.error(`Error al cargar sucursales para el cliente ${cliente.id}:`, error)
          }
        }
        setSucursales(todasSucursales)
      } catch (error) {
        console.error('Error al cargar todos los clientes:', error)
      }
    }
    
    void cargarTodosLosClientes()
  }, [vistaActual])

  useEffect(() => {
    if (vistaActual === 'listar') {
      cargarRutasGuardadas()
    }
  }, [vistaActual, cargarRutasGuardadas])

  const onGuardar = async () => {
    try {
      // Pasar solo los clientes seleccionados para el día/zona actual
      await handleGuardar(clientesSeleccionadosPorDia[diaZonaKey] || [])
      setSaveMessage('Rutero guardado exitosamente')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      setSaveMessage('Error al guardar el rutero')
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  // Recibe id de ruta específica (ruteroId) para cargar y auto-seleccionar
  const onSeleccionarRuta = (zonaId: number, dia: string, ruteroId?: string) => {
    const clienteId = handleSeleccionarRuta(zonaId, dia, ruteroId)
    setVistaActual('planificar')
    
    // Auto-seleccionar el cliente correspondiente
    if (clienteId) {
      const key = `${zonaId}-${dia}`
      setClientesSeleccionadosPorDia(prev => ({
        ...prev,
        [key]: [clienteId]
      }))
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PageHero
        title="Rutero"
        subtitle="Planifica las rutas de visita por zona y día de la semana"
      />

      <div className="flex-1 overflow-hidden p-6">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {saveMessage && (
          <div
            className={`mb-4 rounded-lg border p-3 text-sm ${
              saveMessage.includes('Error')
                ? 'border-red-300 bg-red-50 text-red-800'
                : 'border-green-300 bg-green-50 text-green-800'
            }`}
          >
            {saveMessage}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-4 flex gap-2 border-b border-neutral-200">
          <button
            onClick={() => {
              limpiarRuteroSeleccionado()
              setVistaActual('planificar')
            }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              vistaActual === 'planificar'
                ? 'border-brand-red text-brand-red'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Map className="h-4 w-4" />
            Planificar Ruta
          </button>
          <button
            onClick={() => setVistaActual('listar')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              vistaActual === 'listar'
                ? 'border-brand-red text-brand-red'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <List className="h-4 w-4" />
            Ver Rutas Guardadas
          </button>
          <button
            onClick={() => setVistaActual('mapa-completo')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              vistaActual === 'mapa-completo'
                ? 'border-brand-red text-brand-red'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Globe className="h-4 w-4" />
            Ver Mapa Completo
          </button>
        </div>

        {/* Vista de Planificación */}
        {vistaActual === 'planificar' && (
          <>
            {/* Selector de Clientes para el día */}
            <div className="mb-4 rounded-lg border border-neutral-200 bg-gradient-to-r from-neutral-50 to-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-neutral-900">Selecciona clientes para {diaSeleccionado}</h3>
                  <p className="text-xs text-neutral-600 mt-1">Elige los clientes que visitarás este día</p>
                </div>
                <button
                  onClick={toggleTodosLosClientes}
                  disabled={clientesFiltrados.length === 0}
                  className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
                >
                  {clientesSeleccionadosHoy.size === clientesFiltrados.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </button>
              </div>
              
              {/* Grid de clientes */}
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5">
                {clientesFiltrados.length === 0 ? (
                  <p className="col-span-full text-sm text-neutral-500">No hay clientes en esta zona</p>
                ) : (
                  clientesFiltrados.map(cliente => (
                    <button
                      key={cliente.id}
                      onClick={() => toggleClienteSeleccionado(cliente.id)}
                      className={`rounded-lg border-2 p-3 text-left transition ${
                        clientesSeleccionadosHoy.has(cliente.id)
                          ? 'border-brand-red bg-brand-red/5 shadow-md'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`flex h-5 w-5 items-center justify-center rounded border-2 flex-shrink-0 ${
                          clientesSeleccionadosHoy.has(cliente.id)
                            ? 'border-brand-red bg-brand-red'
                            : 'border-neutral-300 bg-white'
                        }`}>
                          {clientesSeleccionadosHoy.has(cliente.id) && (
                            <span className="text-white text-xs font-bold">✓</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-neutral-900">{cliente.razon_social}</p>
                          {cliente.nombre_comercial && (
                            <p className="truncate text-xs text-neutral-600">{cliente.nombre_comercial}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Botón Guardar */}
            <div className="mb-4 flex justify-between items-center">
              <p className="text-sm text-neutral-600">
                {clientesSeleccionadosHoy.size === 0 
                  ? 'Selecciona al menos un cliente'
                  : `${clientesSeleccionadosHoy.size} cliente(s) seleccionado(s)`}
              </p>
              <button
                onClick={onGuardar}
                disabled={isSaving || !zonaSeleccionada || clientesSeleccionadosHoy.size === 0}
                className="flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-red-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Guardando...' : 'Guardar Rutero'}
              </button>
            </div>

            {/* Grid Principal */}
            <div className="grid h-[calc(100%-5rem)] grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Panel Izquierdo - Agenda */}
              <RuteroAgenda
                zonas={zonas}
                zonaSeleccionada={zonaSeleccionada}
                onZonaChange={setZonaSeleccionada}
                diaSeleccionado={diaSeleccionado}
                onDiaChange={setDiaSeleccionado}
                clientes={clientesParaMostrar}
                isLoading={isLoading}
                onReordenar={handleReordenar}
                onUpdateHora={handleActualizarHora}
                onUpdatePrioridad={handleActualizarPrioridad}
                onUpdateFrecuencia={handleActualizarFrecuencia}
                onUpdateDireccion={handleActualizarDireccion}
              />

              {/* Panel Derecho - Mapa */}
              <RuteroMapa zona={zonaActual} clientes={clientesParaMostrar} isLoading={isLoading} />
            </div>
          </>
        )}

        {/* Vista de Lista */}
        {vistaActual === 'listar' && (
          <div className="h-[calc(100%-3rem)] overflow-y-auto">
            <RuteroLista
              rutas={rutasGuardadas}
              isLoading={isLoadingRutas}
              onSeleccionarRuta={onSeleccionarRuta}
              onEliminarRuta={handleEliminarRuta}
            />
          </div>
        )}

        {/* Vista de Mapa Completo */}
        {vistaActual === 'mapa-completo' && (
          <div className="h-[calc(100%-3rem)] overflow-y-auto">
            <MapaCompleto
              zonas={zonas}
              clientes={todosLosClientes}
              sucursales={sucursales}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  )
}
