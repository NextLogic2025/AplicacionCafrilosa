import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'
import { CalendarDays, Flag, MapPin, MoveRight, Navigation, RefreshCcw, Users } from 'lucide-react'

import { PageHero } from '../../../../components/ui/PageHero'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner'
import { ClienteDetailModal, getClienteDisplayName } from '../Clientes/ClienteDetailModal'
import RouteCard from './RouteCard'
import MapPanel from './MapPanel'
import VendedorLista from './VendedorLista'
import VendedorMapa from './VendedorMapa'
import { getClienteCoords } from './helpers'
import { getClientesAsignados } from '../../services/vendedorApi'
import { obtenerTodasLasRutas } from '../../../supervisor/services/ruteroApi'
import { DIAS_SEMANA, PRIORIDAD_COLORS, type DiaSemana, type RuteroPlanificado } from '../../../supervisor/services/types'
import type { Cliente } from '../../../supervisor/services/clientesApi'
import ResumenCard from './ResumenCard'
import { DIA_LABEL, FRECUENCIA_LABEL, formatHora, titleCase, buildDirectionsUrl, diaActual } from './utils'

interface RutaConCliente {
  plan: RuteroPlanificado
  cliente: Cliente
}

type DiaResumen = {
  dia: DiaSemana
  visitas: number
  prioritarias: number
}



const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
const GOOGLE_MAP_LIBRARIES: Array<'drawing'> = ['drawing']
const MAP_CONTAINER_STYLE = { width: '100%', height: '450px' }
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

      // Filtrar rutas solo de clientes asignados y activos (no bloqueados ni eliminados)
      const rutasFiltradas: RutaConCliente[] = rutasPlanificadas
        .map((plan) => {
          const cliente = clientesIndex.get(plan.cliente_id)
          return cliente ? { plan, cliente } : null
        })
        .filter(Boolean)
        .map((x) => x as RutaConCliente)
        .filter(({ cliente }) => !cliente.bloqueado && !cliente.deleted_at)

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

  // Mapeo de días para comparación robusta (como en supervisor)
  // Mapeo de día a número y viceversa
  // Corregido para coincidir con la base de datos
  const DIA_MAP: Record<DiaSemana, number> = {
    LUNES: 1,
    MARTES: 2,
    MIERCOLES: 3,
    JUEVES: 4,
    VIERNES: 5,
  }
  const DIA_MAP_INV: Record<number, DiaSemana> = {
    1: 'LUNES',
    2: 'MARTES',
    3: 'MIERCOLES',
    4: 'JUEVES',
    5: 'VIERNES',
  }

  // Normaliza rutas para que siempre tengan dia_semana como número
  const rutasNormalizadas = useMemo(() => {
    return rutas.map((item) => {
      let diaNum: number

      // Si dia_semana ya es un número, usarlo directamente
      if (typeof item.plan.dia_semana === 'number') {
        diaNum = item.plan.dia_semana
      }
      // Si es un string (DiaSemana), convertirlo a número usando DIA_MAP
      else {
        diaNum = DIA_MAP[item.plan.dia_semana as DiaSemana]
      }

      return {
        ...item,
        plan: {
          ...item.plan,
          dia_semana: diaNum as any, // Type assertion: la interfaz espera DiaSemana (string) pero usamos number internamente
        },
      }
    })
  }, [rutas])

  const rutasPorDia = useMemo(() => {
    return DIAS_SEMANA.reduce<Record<DiaSemana, RutaConCliente[]>>((acc, dia) => {
      const diaNum = DIA_MAP[dia];
      acc[dia] = rutasNormalizadas.filter((item) => item.plan.dia_semana === diaNum);
      return acc;
    }, {
      LUNES: [],
      MARTES: [],
      MIERCOLES: [],
      JUEVES: [],
      VIERNES: [],
    });
  }, [rutasNormalizadas]);

  const diasResumen: DiaResumen[] = useMemo(() => {
    return DIAS_SEMANA.map((dia) => ({
      dia,
      visitas: rutasPorDia[dia].length,
      prioritarias: rutasPorDia[dia].filter((item) => item.plan.prioridad_visita === 'ALTA').length,
    }))
  }, [rutasPorDia])

  const rutasSeleccionadas = useMemo(() => rutasPorDia[diaActivo], [rutasPorDia, diaActivo])

  const puntosMapa = useMemo(() => {
    // Generar un marcador por dirección principal y otro por sucursal (si existen)
    const puntos: Array<{
      position: { lat: number; lng: number }
      label: string
      nombre: string
      id: string
      tipo: 'PRINCIPAL' | 'SUCURSAL'
      clienteId: string
    }> = []

    rutasSeleccionadas.forEach((item, index) => {
      const cliente = item.cliente as any
      const plan = item.plan as any
      const nombre = titleCase((plan.cliente_nombre ?? getClienteDisplayName(item.cliente)) || item.cliente.razon_social || item.cliente.nombre_comercial)
      const label = String(index + 1)

      // Si no hay sucursal_id, el plan corresponde a la dirección principal (matriz/cliente)
      if (!plan.sucursal_id) {
        const coordsPrincipal = plan.ubicacion_gps?.coordinates
          ? { lat: plan.ubicacion_gps.coordinates[1], lng: plan.ubicacion_gps.coordinates[0] }
          : getClienteCoords(item.cliente, null)
        if (coordsPrincipal) {
          const idPrincipal = plan.id ?? `${plan.cliente_id}-main-${plan.hora_estimada_arribo ?? plan.created_at ?? index}`
          puntos.push({
            position: coordsPrincipal,
            label,
            nombre,
            id: `principal-${idPrincipal}`,
            tipo: 'PRINCIPAL',
            clienteId: item.plan.cliente_id,
          })
        }
        return
      }

      // Si existe sucursal_id, añadimos únicamente el marcador de la sucursal (no la matriz),
      // buscando coords en plan.ubicacion_gps o en cliente.sucursales
      let coordsSucursal: { lat: number; lng: number } | undefined
      if (plan.ubicacion_gps?.coordinates) {
        coordsSucursal = { lat: plan.ubicacion_gps.coordinates[1], lng: plan.ubicacion_gps.coordinates[0] }
      } else if (cliente?.sucursales && Array.isArray(cliente.sucursales)) {
        const suc = cliente.sucursales.find((s: any) => String(s.id) === String(plan.sucursal_id))
        if (suc) {
          coordsSucursal = getClienteCoords({ ...item.cliente, ubicacion_gps: suc.ubicacion_gps, latitud: suc.latitud, longitud: suc.longitud } as Cliente, null)
        }
      }

      if (coordsSucursal) {
        const idSucursal = plan.id ?? `${plan.cliente_id}-${plan.sucursal_id}-${plan.hora_estimada_arribo ?? plan.created_at ?? index}`
        puntos.push({
          position: coordsSucursal,
          label,
          nombre: `${nombre} — ${plan.sucursal_nombre ?? 'Sucursal'}`,
          id: `sucursal-${idSucursal}`,
          tipo: 'SUCURSAL',
          clienteId: item.plan.cliente_id,
        })
      }
    })

    return puntos
  }, [rutasSeleccionadas])

  const rutaDirecciones = useMemo(() => puntosMapa.map((punto) => punto.position), [puntosMapa])

  const rutaPolyline = useMemo(() => puntosMapa.map((punto) => punto.position), [puntosMapa])

  const mapaCentro = useMemo(() => puntosMapa[0]?.position ?? DEFAULT_CENTER, [puntosMapa])
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(null)

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
                className={`flex flex-col rounded-xl border px-4 py-2 text-left transition ${activo
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
            <VendedorLista
              rutas={rutasSeleccionadas}
              isLoading={isLoading}
              rutaDirecciones={rutaDirecciones}
              onSelectPosition={(pos: { lat: number; lng: number } | null) => pos && setSelectedPosition(pos)}
              onVerDetalle={handleVerDetalle}
            />
          </div>

          <div className="lg:col-span-2">
            <VendedorMapa
              puntosMapa={puntosMapa}
              rutaPolyline={rutaPolyline}
              mapaCentro={mapaCentro}
              selectedPosition={selectedPosition}
              isLoaded={isLoaded}
              loadError={loadError}
              isLoading={isLoading}
              mapContainerStyle={MAP_CONTAINER_STYLE}
            />
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


