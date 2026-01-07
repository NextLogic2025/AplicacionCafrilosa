import { Clock, GripVertical } from 'lucide-react'
import type { ClienteRutero } from '../../services/types'
import { PRIORIDAD_COLORS } from '../../services/types'

interface ClienteRuteroCardProps {
  cliente: ClienteRutero
  onUpdateHora: (clienteId: string, hora: string) => void
  isDragging?: boolean
}

export function ClienteRuteroCard({ cliente, onUpdateHora, isDragging = false }: ClienteRuteroCardProps) {
  const prioridadClass = PRIORIDAD_COLORS[cliente.prioridad]

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
        isDragging ? 'opacity-50 shadow-lg' : 'bg-white hover:shadow-md'
      }`}
    >
      <div className="cursor-grab text-gray-400 hover:text-gray-600">
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{cliente.razon_social}</span>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${prioridadClass}`}
          >
            {cliente.prioridad}
          </span>
        </div>
        <div className="mt-1 text-xs text-gray-500">
          Orden: {cliente.orden + 1}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-gray-400" />
        <input
          type="time"
          value={cliente.hora_estimada || ''}
          onChange={(e) => onUpdateHora(cliente.id, e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red"
        />
      </div>
    </div>
  )
}
