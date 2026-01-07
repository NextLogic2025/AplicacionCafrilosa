import { useState } from 'react'
import { Save, AlertCircle } from 'lucide-react'
import { PageHero } from 'components/ui/PageHero'
import { RuteroAgenda } from './RuteroAgenda'
import { RuteroMapa } from './RuteroMapa'
import { useRutero } from '../../services/useRutero'

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
    handleGuardar,
  } = useRutero()

  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const zonaActual = zonas.find((z) => z.id === zonaSeleccionada) || null

  const onGuardar = async () => {
    try {
      await handleGuardar()
      setSaveMessage('Rutero guardado exitosamente')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      setSaveMessage('Error al guardar el rutero')
      setTimeout(() => setSaveMessage(null), 3000)
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

        {/* Botón Guardar */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={onGuardar}
            disabled={isSaving || !zonaSeleccionada || clientes.length === 0}
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
            clientes={clientes}
            isLoading={isLoading}
            onReordenar={handleReordenar}
            onUpdateHora={handleActualizarHora}
            onUpdatePrioridad={handleActualizarPrioridad}
            onUpdateFrecuencia={handleActualizarFrecuencia}
          />

          {/* Panel Derecho - Mapa */}
          <RuteroMapa zona={zonaActual} clientes={clientes} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
