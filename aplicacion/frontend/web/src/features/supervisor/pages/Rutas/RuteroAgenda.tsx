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
  onUpdatePrioridad: (clienteId: string, prioridad: 'ALTA' | 'MEDIA' | 'BAJA') => void
  onUpdateFrecuencia: (clienteId: string, frecuencia: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL') => void
  onUpdateDireccion: (clienteId: string, tipoDireccion: 'PRINCIPAL' | 'SUCURSAL', sucursalId?: string) => void
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
  onUpdatePrioridad,
  onUpdateFrecuencia,
  onUpdateDireccion,
}: RuteroAgendaProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destIndex = result.destination.index

    if (sourceIndex === destIndex) return

    const clienteId = result.draggableId
    onReordenar(clienteId, destIndex)
  }

  // Solo un cliente seleccionado para mostrar el selector global
  const clienteSeleccionado = clientes.length === 1 ? clientes[0] : null;

  // Handler para cambiar dirección principal/sucursal y zona
  const handleDireccionGlobal = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!clienteSeleccionado) return;
    const value = e.target.value;
    if (value === 'PRINCIPAL') {
      onUpdateDireccion(clienteSeleccionado.id, 'PRINCIPAL');
      // Solo cambiar zona si el cliente principal está en una zona diferente a la seleccionada
      // (opcional: puedes comentar la siguiente línea si quieres que nunca cambie automáticamente)
      // if (clienteSeleccionado.zona_comercial_id && clienteSeleccionado.zona_comercial_id !== zonaSeleccionada) {
      //   onZonaChange(clienteSeleccionado.zona_comercial_id);
      // }
    } else if (value.startsWith('SUCURSAL-')) {
      const sucursalId = value.replace('SUCURSAL-', '');
      onUpdateDireccion(clienteSeleccionado.id, 'SUCURSAL', sucursalId);
      // NO cambiar zona automáticamente, solo actualizar la sucursal seleccionada
    }
  };

  // Determinar si el selector de zona debe estar deshabilitado
  const zonaDeshabilitada = clienteSeleccionado && clienteSeleccionado.tipo_direccion === 'SUCURSAL';
  const zonaIdActual = zonaSeleccionada || '';

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header y selector global */}
      <div className="border-b border-gray-200 bg-gray-50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Planificación de Rutero</h3>
          <p className="text-sm text-gray-600">Organiza el orden de visitas por zona y día</p>
          {/* Mostrar zona real de la sucursal o del cliente */}
          {clienteSeleccionado && (
            <div className="mt-1 text-xs text-gray-700">
              {clienteSeleccionado.tipo_direccion === 'SUCURSAL' && clienteSeleccionado.sucursal_id ? (
                (() => {
                  const suc = clienteSeleccionado.sucursales?.find(s => s.id === clienteSeleccionado.sucursal_id);
                  const zonaSucursal = suc && zonas.find(z => z.id === suc.zona_id);
                  return zonaSucursal ? (
                    <span>Zona de la sucursal: <span className="font-semibold">{zonaSucursal.nombre}</span></span>
                  ) : (
                    <span>Zona de la sucursal: <span className="font-semibold text-gray-400">Sin zona</span></span>
                  );
                })()
              ) : (
                (() => {
                  const zonaCliente = zonas.find(z => z.id === clienteSeleccionado.zona_comercial_id);
                  return zonaCliente ? (
                    <span>Zona del cliente: <span className="font-semibold">{zonaCliente.nombre}</span></span>
                  ) : (
                    <span>Zona del cliente: <span className="font-semibold text-gray-400">Sin zona</span></span>
                  );
                })()
              )}
            </div>
          )}
        </div>
        {/* Selector global de dirección principal/sucursal */}
        {clienteSeleccionado && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <select
              value={clienteSeleccionado.tipo_direccion === 'SUCURSAL' && clienteSeleccionado.sucursal_id ? `SUCURSAL-${clienteSeleccionado.sucursal_id}` : 'PRINCIPAL'}
              onChange={handleDireccionGlobal}
              className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red"
            >
              <option value="PRINCIPAL">Dirección Principal</option>
              {clienteSeleccionado.sucursales?.map((sucursal) => (
                <option key={sucursal.id} value={`SUCURSAL-${sucursal.id}`}>
                  Sucursal: {sucursal.nombre_sucursal}
                </option>
              ))}
            </select>
          </div>
        )}
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
            value={zonaIdActual}
            onChange={(e) => onZonaChange(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
            disabled={zonaDeshabilitada}
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
                            onUpdatePrioridad={onUpdatePrioridad}
                            onUpdateFrecuencia={onUpdateFrecuencia}
                            onUpdateDireccion={onUpdateDireccion}
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
