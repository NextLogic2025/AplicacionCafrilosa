import { Calendar, MapPin } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import type { ZonaComercial } from '../../services/zonasApi'
import type { ClienteRutero, DiaSemana } from '../../services/types'
import { DIAS_SEMANA } from '../../services/types'
import { ClienteRuteroCard } from './ClienteRuteroCard'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'

interface RuteroAgendaProps {
  zonas: ZonaComercial[]
  zonaSeleccionada: number | null
  onZonaChange: (zonaId: number) => void
  diaSeleccionado: DiaSemana
  onDiaChange: (dia: DiaSemana) => void
  clientes: ClienteRutero[]
  isLoading: boolean
  onReordenar: (clienteId: string, nuevoOrden: number) => void
  onUpdateHora: (clienteId: string, hora: string) => void
}

export function RuteroAgenda({
  zonas,
  zonaSeleccionada,
  onZonaChange,
  diaSeleccionado,
  onDiaChange,
  clientes,
  isLoading,
  onReordenar,
  onUpdateHora,
}: RuteroAgendaProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destIndex = result.destination.index

    if (sourceIndex === destIndex) return

    const clienteId = result.draggableId
    onReordenar(clienteId, destIndex)
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <h3 className="text-lg font-semibold text-gray-900">Planificación de Rutero</h3>
        <p className="text-sm text-gray-600">Organiza el orden de visitas por zona y día</p>
      </div>

      {/* Selectores */}
      <div className="space-y-3 border-b border-gray-200 p-4">
        {/* Selector de Zona */}
        <div>
          <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
            <MapPin className="h-4 w-4" />
            Zona Comercial
          </label>
          <select
            value={zonaSeleccionada || ''}
            onChange={(e) => onZonaChange(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
          >
            <option value="">Seleccione una zona</option>
            {zonas.map((zona) => (
              <option key={zona.id} value={zona.id}>
                {zona.nombre} - {zona.ciudad || 'Sin ciudad'}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Día */}
        <div>
          <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
            <Calendar className="h-4 w-4" />
            Día de la Semana
          </label>
          <select
            value={diaSeleccionado}
            onChange={(e) => onDiaChange(e.target.value as DiaSemana)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
          >
            {DIAS_SEMANA.map((dia) => (
              <option key={dia} value={dia}>
                {dia.charAt(0) + dia.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : clientes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MapPin className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-900">No hay clientes en esta zona</p>
            <p className="mt-1 text-xs text-gray-500">Selecciona otra zona o asigna clientes</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="clientes-rutero">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-2"
                >
                  {clientes.map((cliente, index) => (
                    <Draggable key={cliente.id} draggableId={cliente.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <ClienteRuteroCard
                            cliente={cliente}
                            onUpdateHora={onUpdateHora}
                            isDragging={snapshot.isDragging}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Footer con estadísticas */}
      {!isLoading && clientes.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total de clientes:</span>
            <span className="font-semibold text-gray-900">{clientes.length}</span>
          </div>
        </div>
      )}
    </div>
  )
}
