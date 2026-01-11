import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api'
import { CalendarDays, Flag, MapPin, MoveRight, Navigation, RefreshCcw, Users } from 'lucide-react'

import { PageHero } from '../../../../components/ui/PageHero'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner'
import { ClienteDetailModal } from '../Clientes/ClienteDetailModal'
import { getClientesAsignados } from '../../services/vendedorApi'
import { obtenerTodasLasRutas } from '../../../supervisor/services/ruteroApi'
import { DIAS_SEMANA, PRIORIDAD_COLORS, type DiaSemana, type RuteroPlanificado } from '../../../supervisor/services/types'
import type { Cliente } from '../../../supervisor/services/clientesApi'

interface RutaConCliente {
  plan: RuteroPlanificado
  cliente: Cliente
}

type DiaResumen = {
  dia: DiaSemana
  visitas: number
  prioritarias: number
}

const DIA_LABEL: Record<DiaSemana, { corto: string; completo: string }> = {
  LUNES: { corto: 'Lun', completo: 'Lunes' },
  MARTES: { corto: 'Mar', completo: 'Martes' },
  MIERCOLES: { corto: 'Mié', completo: 'Miércoles' },
  JUEVES: { corto: 'Jue', completo: 'Jueves' },
  VIERNES: { corto: 'Vie', completo: 'Viernes' },
}

const FRECUENCIA_LABEL: Record<RuteroPlanificado['frecuencia'], string> = {
  SEMANAL: 'Semanal',
  QUINCENAL: 'Quincenal',
  MENSUAL: 'Mensual',
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
const GOOGLE_MAP_LIBRARIES: Array<'drawing' | 'geometry'> = ['drawing', 'geometry']
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' }
const DEFAULT_CENTER = { lat: -0.234292, lng: -78.524789 }
const PRIORIDAD_ORDEN: Record<RuteroPlanificado['prioridad_visita'], number> = {
  ALTA: 0,
  MEDIA: 1,
  BAJA: 2,
}

export default function VendedorRutas() {
  const cancelRef = useRef(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [diaActivo, setDiaActivo] = useState<DiaSemana>(diaActual())
  const [rutas, setRutas] = useState<RutaConCliente[]>([])
  const [clienteDetalle, setClienteDetalle] = useState<Cliente | null>(null)
  const [isDetalleAbierto, setIsDetalleAbierto] = useState(false)
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: GOOGLE_MAPS_API_KEY, libraries: GOOGLE_MAP_LIBRARIES })

  // Log de depuración para ver los datos filtrados
  useEffect(() => {
    if (rutas.length > 0) {
      console.log('Clientes asignados mostrados en rutas:', rutas.map(r => r.cliente));
      console.log('Rutas planificadas mostradas:', rutas.map(r => r.plan));
    } else {
      console.log('No hay rutas filtradas para mostrar.');
    }
  }, [rutas]);
  useEffect(() => {
    cancelRef.current = false
    return () => {
      cancelRef.current = true
    }
  }, [])

const cargarDatos = useCallback(async () => {
  try {
    setIsLoading(true)
    setError(null)

    const [clientesAsignados, rutasPlanificadas] = await Promise.all([
      getClientesAsignados().catch(() => []),
      obtenerTodasLasRutas().catch(() => []),
    ])

    // Indexar clientes asignados por id y por identificacion
    const clientesIndex = new Map<string, Cliente>()
    clientesAsignados.forEach((cliente) => {
      if (cliente.id) clientesIndex.set(cliente.id, cliente)
      if (cliente.identificacion) clientesIndex.set(cliente.identificacion, cliente)
    })

    // Filtrar rutas solo de clientes asignados
    const rutasFiltradas: RutaConCliente[] = rutasPlanificadas
      .filter((plan) => clientesIndex.has(plan.cliente_id))
      .map((plan) => ({ plan, cliente: clientesIndex.get(plan.cliente_id)! }))

    if (!cancelRef.current) setRutas(rutasFiltradas)
  } catch (err: any) {
    setError(err?.message ?? 'No se pudieron cargar las rutas')
    setRutas([])
  } finally {
    setIsLoading(false)
  }
}, [])

  useEffect(() => {
    cargarDatos().catch(() => {
      if (!cancelRef.current) setError('No se pudieron cargar tus rutas. Intenta nuevamente más tarde.')
    })
  }, [cargarDatos])

  const resumen = useMemo(() => {
    const totalVisitas = rutas.length
    const visitasHoy = rutas.filter((item) => item.plan.dia_semana === diaActivo).length
    const prioritarias = rutas.filter((item) => item.plan.prioridad_visita === 'ALTA').length
    return { totalVisitas, visitasHoy, prioritarias }
  }, [rutas, diaActivo])

  const rutasPorDia = useMemo(() => {
    return DIAS_SEMANA.reduce<Record<DiaSemana, RutaConCliente[]>>((acc, dia) => {
      acc[dia] = rutas.filter((item) => item.plan.dia_semana === dia)
      return acc
    }, {
      LUNES: [],
      MARTES: [],
      MIERCOLES: [],
      JUEVES: [],
      VIERNES: [],
    })
  }, [rutas])

  const diasResumen: DiaResumen[] = useMemo(() => {
    return DIAS_SEMANA.map((dia) => ({
      dia,
      visitas: rutasPorDia[dia].length,
      prioritarias: rutasPorDia[dia].filter((item) => item.plan.prioridad_visita === 'ALTA').length,
    }))
  }, [rutasPorDia])

  const rutasSeleccionadas = useMemo(() => rutasPorDia[diaActivo], [rutasPorDia, diaActivo])

  const puntosMapa = useMemo(() => {
    return rutasSeleccionadas
      .map((item, index) => {
        const coords = getClienteCoords(item.cliente)
        if (!coords) return null
        return {
          position: coords,
          label: String(index + 1),
          nombre: titleCase(item.cliente.razon_social || item.cliente.nombre_comercial),
        }
      })
      .filter(Boolean) as Array<{ position: { lat: number; lng: number }; label: string; nombre: string }>
  }, [rutasSeleccionadas])

  const rutaDirecciones = useMemo(() => puntosMapa.map((punto) => punto.position), [puntosMapa])

  const rutaPolyline = useMemo(() => puntosMapa.map((punto) => punto.position), [puntosMapa])

  const mapaCentro = useMemo(() => puntosMapa[0]?.position ?? DEFAULT_CENTER, [puntosMapa])

  const rutasGuardadasDia = useMemo(() => {
    const grupos = new Map<
      string,
      {
        key: string
        zona: string
        total: number
        prioritarias: number
        hora: string | null
        prioridad: number
      }
    >()

    rutasPorDia[diaActivo].forEach(({ plan, cliente }) => {
      const zonaIdentificador = plan.zona_id ?? cliente.zona_comercial?.id ?? cliente.zona_comercial_id ?? 'sin-zona'
      const key = String(zonaIdentificador)
      const zonaLabel =
        cliente.zona_comercial?.nombre ??
        (plan.zona_id != null ? `Zona ${plan.zona_id}` : cliente.zona_comercial_id != null ? `Zona ${cliente.zona_comercial_id}` : 'Sin zona asignada')
      const prioridadZona = PRIORIDAD_ORDEN[plan.prioridad_visita]
      const grupo =
        grupos.get(key) ?? {
          key,
          zona: zonaLabel,
          total: 0,
          prioritarias: 0,
          hora: plan.hora_estimada ?? null,
          prioridad: prioridadZona,
        }

      grupo.total += 1
      if (plan.prioridad_visita === 'ALTA') {
        grupo.prioritarias += 1
      }
      if (prioridadZona < grupo.prioridad) {
        grupo.prioridad = prioridadZona
      }
      if (plan.hora_estimada && (!grupo.hora || plan.hora_estimada < grupo.hora)) {
        grupo.hora = plan.hora_estimada
      }
      if (zonaLabel !== grupo.zona) {
        grupo.zona = zonaLabel
      }

      grupos.set(key, grupo)
    })

    return Array.from(grupos.values()).sort((a, b) => {
      if (a.prioridad !== b.prioridad) return a.prioridad - b.prioridad
      if (a.hora && b.hora) return a.hora.localeCompare(b.hora)
      if (a.hora && !b.hora) return -1
      if (!a.hora && b.hora) return 1
      return a.zona.localeCompare(b.zona)
    })
  }, [rutasPorDia, diaActivo])

  const handleVerDetalle = (cliente: Cliente) => {
    setClienteDetalle(cliente)
    setIsDetalleAbierto(true)
  }

  const cerrarDetalle = () => {
    setIsDetalleAbierto(false)
    setClienteDetalle(null)
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Mi Rutero"
        subtitle="Consulta las visitas planificadas por tu supervisor y organiza tu día"
        chips={[{ label: 'Rutas asignadas', variant: 'red' }]}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <ResumenCard icon={<Users className="h-5 w-5" />} title="Total visitas" value={resumen.totalVisitas} />
        <ResumenCard icon={<CalendarDays className="h-5 w-5" />} title="Programadas hoy" value={resumen.visitasHoy} />
        <ResumenCard icon={<Flag className="h-5 w-5" />} title="Prioritarias" value={resumen.prioritarias} />
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Agenda semanal</h2>
            <p className="text-sm text-neutral-500">Selecciona un día para ver el detalle de clientes y horarios.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              void cargarDatos()
            }}
            className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:border-brand-red hover:text-brand-red"
          >
            <RefreshCcw className="h-4 w-4" />
            Actualizar
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {diasResumen.map(({ dia, visitas, prioritarias: prioridades }) => {
            const activo = dia === diaActivo
            const label = DIA_LABEL[dia]
            return (
              <button
                key={dia}
                type="button"
                onClick={() => setDiaActivo(dia)}
                className={`flex flex-col rounded-xl border px-4 py-2 text-left transition ${
                  activo
                    ? 'border-brand-red bg-brand-red/10 text-brand-red shadow-sm'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-brand-red hover:text-brand-red'
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.08em]">{label.corto}</span>
                <span className="text-lg font-bold">{visitas}</span>
                <span className="text-xs text-neutral-500">{prioridades} prioritarias</span>
              </button>
            )
          })}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <LoadingSpinner text="Cargando rutas..." />
              </div>
            ) : rutasSeleccionadas.length === 0 ? (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-600">
                No tienes visitas planificadas para {DIA_LABEL[diaActivo].completo}.
              </div>
            ) : (
              rutasSeleccionadas.map(({ plan, cliente }) => {
                const prioridadClass = PRIORIDAD_COLORS[plan.prioridad_visita]
                const zonaNombre =
                  cliente.zona_comercial?.nombre ??
                  (cliente.zona_comercial_id ? `Zona ${cliente.zona_comercial_id}` : plan.zona_id != null ? `Zona ${plan.zona_id}` : 'Sin zona asignada')
                const direccion = cliente.direccion_texto ?? 'Sin dirección registrada'
                const coords = getClienteCoords(cliente)
                const directionsUrl = coords ? buildDirectionsUrl(rutaDirecciones, coords) : null
                return (
                  <article
                    key={`${plan.cliente_id}-${plan.dia_semana}-${plan.orden_sugerido}`}
                    className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">Orden #{plan.orden_sugerido}</p>
                        <h3 className="text-lg font-bold text-neutral-900">{titleCase(cliente.razon_social || cliente.nombre_comercial)}</h3>
                        <p className="text-sm text-neutral-600">{zonaNombre}</p>
                      </div>
                      <span className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${prioridadClass}`}>
                        <Flag className="h-3.5 w-3.5" />
                        {plan.prioridad_visita.toLowerCase()}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-neutral-700 md:grid-cols-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-brand-red" />
                        <span>{DIA_LABEL[plan.dia_semana].completo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-brand-red" />
                        <span>{FRECUENCIA_LABEL[plan.frecuencia]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MoveRight className="h-4 w-4 text-brand-red" />
                        <span>{formatHora(plan.hora_estimada)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-brand-red" />
                        <span className="truncate" title={direccion}>{direccion}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <div className="flex flex-wrap items-center gap-4">
                        {directionsUrl && (
                          <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-brand-red transition hover:text-brand-red-dark"
                          >
                            Cómo llegar
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleVerDetalle(cliente)}
                          className="text-sm font-semibold text-brand-red transition hover:text-brand-red-dark"
                        >
                          Ver detalles del cliente
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                <h3 className="text-sm font-semibold text-neutral-900">Mapa y ruta</h3>
                <p className="text-xs text-neutral-500">Visualiza el recorrido sugerido para el día seleccionado.</p>
              </div>
              <div className="relative h-80 flex-1 md:h-96">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <LoadingSpinner text="Cargando mapa..." />
                  </div>
                ) : !GOOGLE_MAPS_API_KEY ? (
                  <div className="flex h-full items-center justify-center px-4 text-center text-xs text-neutral-500">
                    Configura VITE_GOOGLE_MAPS_API_KEY para visualizar el mapa.
                  </div>
                ) : loadError ? (
                  <div className="flex h-full items-center justify-center px-4 text-center text-xs text-red-600">
                    No se pudo cargar Google Maps.
                  </div>
                ) : !isLoaded ? (
                  <div className="flex h-full items-center justify-center">
                    <LoadingSpinner text="Iniciando mapa..." />
                  </div>
                ) : puntosMapa.length === 0 ? (
                  <div className="flex h-full items-center justify-center px-4 text-center text-xs text-neutral-500">
                    Agrega clientes con ubicación para ver la ruta sobre el mapa.
                  </div>
                ) : (
                  <GoogleMap
                    mapContainerStyle={MAP_CONTAINER_STYLE}
                    center={mapaCentro}
                    zoom={13}
                    options={{
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: false,
                      clickableIcons: false,
                    }}
                  >
                    {puntosMapa.map((punto) => (
                      <Marker
                        key={`${punto.label}-${punto.nombre}`}
                        position={punto.position}
                        label={{ text: punto.label, color: 'white', fontSize: '14px', fontWeight: 'bold' }}
                        title={`${punto.label}. ${punto.nombre}`}
                      />
                    ))}
                    {rutaPolyline.length > 1 && (
                      <Polyline
                        path={rutaPolyline}
                        options={{ strokeColor: '#3b82f6', strokeOpacity: 0.8, strokeWeight: 3 }}
                      />
                    )}
                  </GoogleMap>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900">Rutas guardadas</h2>
        <p className="text-sm text-neutral-500">Resumen para {DIA_LABEL[diaActivo].completo}.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rutasGuardadasDia.map((resumen) => (
            <div key={`resumen-${diaActivo}-${resumen.key}`} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">{DIA_LABEL[diaActivo].completo}</p>
                  <p className="text-base font-bold text-neutral-900">{resumen.zona}</p>
                </div>
                <span className="rounded-full bg-brand-red/10 px-3 py-1 text-xs font-semibold text-brand-red">
                  {resumen.total} {resumen.total === 1 ? 'cliente' : 'clientes'}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-neutral-600">
                <MoveRight className="h-4 w-4 text-brand-red" />
                <span>{formatHora(resumen.hora)}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                <Flag className="h-3.5 w-3.5 text-brand-red" />
                <span>{resumen.prioritarias} prioritarias</span>
              </div>
            </div>
          ))}
          {rutasGuardadasDia.length === 0 && (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500">
              No tienes rutas guardadas para {DIA_LABEL[diaActivo].completo}.
            </div>
          )}
        </div>
      </section>

      <ClienteDetailModal isOpen={isDetalleAbierto} onClose={cerrarDetalle} cliente={clienteDetalle} />
    </div>
  )
}

function ResumenCard({ icon, title, value }: { icon: ReactNode; title: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red">{icon}</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">{title}</p>
        <p className="text-2xl font-bold text-neutral-900">{value}</p>
      </div>
    </div>
  )
}

function diaActual(): DiaSemana {
  const map: Record<number, DiaSemana> = {
    1: 'LUNES',
    2: 'MARTES',
    3: 'MIERCOLES',
    4: 'JUEVES',
    5: 'VIERNES',
  }
  const today = new Date().getDay()
  return map[today] ?? 'LUNES'
}

function formatHora(value: string | null | undefined): string {
  if (!value) return 'Sin hora programada'
  const [hh, mm] = value.split(':')
  if (!hh || !mm) return value
  return `${hh}:${mm}`
}

function titleCase(text: string | null | undefined): string {
  if (!text) return 'Cliente sin nombre'
  return text
}

function buildDirectionsUrl(
  rutaPuntos: Array<{ lat: number; lng: number }>,
  destinoPreferido: { lat: number; lng: number } | null,
): string | null {
  const puntosUnicos = dedupePuntos(rutaPuntos)
  const destino = destinoPreferido ? dedupePuntos([destinoPreferido])[0] : undefined

  if (destino && !puntosUnicos.some((p) => sonPuntosIguales(p, destino))) {
    puntosUnicos.push(destino)
  }

  if (puntosUnicos.length === 0) {
    if (!destino) return null
    return urlDestino(destino)
  }

  if (puntosUnicos.length === 1) {
    const unico = destino ?? puntosUnicos[0]
    return urlDestino(unico)
  }

  const origen = puntosUnicos[0]
  const destinoFinal = destino && !sonPuntosIguales(destino, origen) ? destino : puntosUnicos[puntosUnicos.length - 1]
  const waypoints = puntosUnicos.filter(
    (punto) => !sonPuntosIguales(punto, origen) && !sonPuntosIguales(punto, destinoFinal),
  )

  const params = new URLSearchParams()
  params.set('origin', formatearLatLng(origen))
  params.set('destination', formatearLatLng(destinoFinal))
  if (waypoints.length > 0) {
    params.set('waypoints', waypoints.map((p) => formatearLatLng(p)).join('|'))
  }
  params.set('travelmode', 'driving')

  return `https://www.google.com/maps/dir/?api=1&${params.toString()}`
}

function getClienteCoords(cliente: Cliente | null): { lat: number; lng: number } | null {
  if (!cliente) return null
  if (cliente.ubicacion_gps?.coordinates) {
    return {
      lat: cliente.ubicacion_gps.coordinates[1],
      lng: cliente.ubicacion_gps.coordinates[0],
    }
  }
  if (typeof cliente.latitud === 'number' && typeof cliente.longitud === 'number') {
    return { lat: cliente.latitud, lng: cliente.longitud }
  }
  return null
}

function normalizarClave(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null
  if (typeof valor === 'number' || typeof valor === 'bigint') return String(valor)
  if (typeof valor === 'string') {
    const limpio = valor
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
    return limpio.length > 0 ? limpio : null
  }
  return null
}

function normalizarPlan(plan: RuteroPlanificado): RuteroPlanificado {
  return {
    ...plan,
    cliente_id: String((plan as { cliente_id?: unknown }).cliente_id ?? ''),
    dia_semana: normalizarDia(plan.dia_semana),
    frecuencia: normalizarFrecuencia(plan.frecuencia),
    prioridad_visita: normalizarPrioridad(plan.prioridad_visita),
    hora_estimada: normalizarHora(plan.hora_estimada),
  }
}

function dedupePuntos(puntos: Array<{ lat: number; lng: number }>): Array<{ lat: number; lng: number }> {
  const vistos = new Set<string>()
  const resultado: Array<{ lat: number; lng: number }> = []
  puntos.forEach((punto) => {
    const clave = formatearClavePunto(punto)
    if (!vistos.has(clave)) {
      vistos.add(clave)
      resultado.push({ lat: punto.lat, lng: punto.lng })
    }
  })
  return resultado
}

function formatearLatLng(punto: { lat: number; lng: number }): string {
  return `${punto.lat},${punto.lng}`
}

function formatearClavePunto(punto: { lat: number; lng: number }): string {
  return `${punto.lat.toFixed(6)}|${punto.lng.toFixed(6)}`
}

function sonPuntosIguales(a: { lat: number; lng: number }, b: { lat: number; lng: number }): boolean {
  return formatearClavePunto(a) === formatearClavePunto(b)
}

function urlDestino(punto: { lat: number; lng: number }): string {
  const params = new URLSearchParams()
  params.set('destination', formatearLatLng(punto))
  params.set('travelmode', 'driving')
  return `https://www.google.com/maps/dir/?api=1&${params.toString()}`
}

function normalizarDia(valor: unknown): DiaSemana {
  const numeroToDia: Record<number, DiaSemana> = {
    0: 'LUNES',
    1: 'LUNES',
    2: 'LUNES',
    3: 'MARTES',
    4: 'MIERCOLES',
    5: 'JUEVES',
    6: 'VIERNES',
    7: 'VIERNES',
  }
  if (typeof valor === 'number') {
    return numeroToDia[valor] ?? 'LUNES'
  }
  if (typeof valor === 'string') {
    const limpio = valor.trim().toUpperCase()
    if (numeroToDia[Number(limpio)]) return numeroToDia[Number(limpio)]
    switch (limpio) {
      case 'LUNES':
        return 'LUNES'
      case 'MARTES':
        return 'MARTES'
      case 'MIERCOLES':
      case 'MIÉRCOLES':
        return 'MIERCOLES'
      case 'JUEVES':
        return 'JUEVES'
      case 'VIERNES':
        return 'VIERNES'
      default:
        return 'LUNES'
    }
  }
  return 'LUNES'
}

function normalizarFrecuencia(valor: unknown): RuteroPlanificado['frecuencia'] {
  const limpio = typeof valor === 'string' ? valor.trim().toUpperCase() : ''
  if (limpio === 'QUINCENAL') return 'QUINCENAL'
  if (limpio === 'MENSUAL') return 'MENSUAL'
  return 'SEMANAL'
}

function normalizarPrioridad(valor: unknown): RuteroPlanificado['prioridad_visita'] {
  const limpio = typeof valor === 'string' ? valor.trim().toUpperCase() : ''
  if (limpio === 'MEDIA') return 'MEDIA'
  if (limpio === 'BAJA') return 'BAJA'
  return 'ALTA'
}

function normalizarHora(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null
  if (typeof valor !== 'string') return null
  const limpio = valor.trim()
  if (limpio.length === 0) return null
  const partes = limpio.split(':')
  if (partes.length < 2) return limpio
  const [hh, mm] = partes
  const hora = hh.padStart(2, '0')
  const minuto = mm.padStart(2, '0')
  return `${hora}:${minuto}`
}
