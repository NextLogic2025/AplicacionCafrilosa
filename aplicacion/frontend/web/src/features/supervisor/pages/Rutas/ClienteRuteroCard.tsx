import { Clock, GripVertical, CalendarClock, AlertCircle } from 'lucide-react'
import type { ClienteRutero } from '../../services/types'
import { PRIORIDAD_COLORS } from '../../services/types'

interface ClienteRuteroCardProps {
  cliente: ClienteRutero
  onUpdateHora: (clienteId: string, hora: string) => void
  onUpdatePrioridad?: (clienteId: string, prioridad: 'ALTA' | 'MEDIA' | 'BAJA') => void
  onUpdateFrecuencia?: (clienteId: string, frecuencia: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL') => void
  isDragging?: boolean
}

export function ClienteRuteroCard({ 
  cliente, 
  onUpdateHora, 
  onUpdatePrioridad,
  onUpdateFrecuencia,
  isDragging = false 
}: ClienteRuteroCardProps) {
  const prioridadClass = PRIORIDAD_COLORS[cliente.prioridad]

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border p-3 transition-all ${
        isDragging ? 'opacity-50 shadow-lg' : 'bg-white hover:shadow-md'
      } ${!cliente.activo ? 'opacity-60 bg-gray-50' : ''}`}
    >
      {/* Fila superior */}
      <div className="flex items-start gap-3">
        <div className="cursor-grab text-gray-400 hover:text-gray-600">
          <GripVertical className="h-5 w-5" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{cliente.razon_social}</span>
            {!cliente.activo && (
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                Inactivo
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Orden: {cliente.orden + 1}
          </div>
        </div>
      </div>

      {/* Fila inferior - Controles */}
      <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2">
        {/* Prioridad */}
        {onUpdatePrioridad ? (
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-gray-400" />
            <select
              value={cliente.prioridad}
              onChange={(e) => onUpdatePrioridad(cliente.id, e.target.value as any)}
              className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red"
            >
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>
        ) : (
          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${prioridadClass}`}>
            {cliente.prioridad}
          </span>
        )}

        {/* Frecuencia */}
        {onUpdateFrecuencia && (
          <div className="flex items-center gap-1">
            <CalendarClock className="h-3 w-3 text-gray-400" />
            <select
              value={cliente.frecuencia}
              onChange={(e) => onUpdateFrecuencia(cliente.id, e.target.value as any)}
              className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red"
            >
              <option value="SEMANAL">Semanal</option>
              <option value="QUINCENAL">Quincenal</option>
              <option value="MENSUAL">Mensual</option>
            </select>
          </div>
        )}

        {/* Hora */}
        <div className="ml-auto flex items-center gap-1">
          <Clock className="h-3 w-3 text-gray-400" />
          <input
            type="time"
            value={cliente.hora_estimada || ''}
            onChange={(e) => onUpdateHora(cliente.id, e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red"
          />
        </div>
      </div>
    </div>
  )
}
