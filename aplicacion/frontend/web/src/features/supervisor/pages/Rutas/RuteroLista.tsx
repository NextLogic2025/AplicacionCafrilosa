import { Calendar, MapPin, Users, Clock } from 'lucide-react'
import type { RuteroPlanificado } from '../../services/types'

interface RutaGuardada {
  zona_id: number
  zona_nombre: string
  dia_semana: string
  clientes: RuteroPlanificado[]
}

interface RuteroListaProps {
  rutas: RutaGuardada[]
  isLoading: boolean
  onSeleccionarRuta: (zonaId: number, dia: string) => void
  onEliminarRuta: (zonaId: number, dia: string) => void
}

export function RuteroLista({ rutas, isLoading, onSeleccionarRuta, onEliminarRuta }: RuteroListaProps) {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Cargando rutas...</div>
      </div>
    )
  }

  if (rutas.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <MapPin className="h-12 w-12 text-gray-300" />
        <p className="mt-3 text-sm font-medium text-gray-900">No hay rutas guardadas</p>
        <p className="mt-1 text-xs text-gray-500">Crea tu primera ruta en la pestaña de Planificación</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rutas.map((ruta, idx) => (
        <div
          key={`${ruta.zona_id}-${ruta.dia_semana}-${idx}`}
          className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          {/* Header */}
          <div className="mb-3 flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-base font-bold text-neutral-900">{ruta.zona_nombre}</h3>
              <div className="mt-1 flex items-center gap-1 text-xs text-neutral-600">
                <Calendar className="h-3 w-3" />
                <span>{ruta.dia_semana}</span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
              <MapPin className="h-5 w-5 text-neutral-600" />
            </div>
          </div>

          {/* Estadísticas */}
          <div className="mb-3 space-y-2 border-t border-neutral-200 pt-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-neutral-600">
                <Users className="h-3 w-3" />
                <span>Clientes:</span>
              </div>
              <span className="font-semibold text-neutral-900">{ruta.clientes.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-neutral-600">
                <Clock className="h-3 w-3" />
                <span>Primera visita:</span>
              </div>
              <span className="font-medium text-neutral-900">
                {ruta.clientes[0]?.hora_estimada || 'Sin hora'}
              </span>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            <button
              onClick={() => onSeleccionarRuta(ruta.zona_id, ruta.dia_semana)}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-brand-red px-3 py-2 text-sm font-semibold text-brand-red transition-colors hover:bg-red-50"
            >
              Ver/Editar
            </button>
            <button
              onClick={() => {
                if (window.confirm('¿Eliminar esta ruta?')) {
                  onEliminarRuta(ruta.zona_id, ruta.dia_semana)
                }
              }}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-red-600 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
