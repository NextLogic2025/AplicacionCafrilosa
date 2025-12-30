import { useState, useEffect } from 'react'
import { MapPin, Phone, Clock, AlertCircle, Eye, Truck } from 'lucide-react'
import { useCliente } from '../../hooks/useCliente'
import { LoadingSpinner, SkeletonTable } from 'components/ui/LoadingSpinner'
import { Alert } from 'components/ui/Alert'
import { SectionHeader } from 'components/ui/SectionHeader'
import { StatCard } from 'components/ui/StatCard'
import { PageHero } from 'components/ui/PageHero'
import { Entrega, EstadoEntrega } from '../../types'

type EstadoEntregaExtendido = EstadoEntrega | undefined

interface EntregaConEstado extends Entrega {
  currentStatus?: EstadoEntregaExtendido
  trackingNumber?: string
  carrier?: string
}

export default function PaginaEntregas() {
  const { entregas, fetchEntregas, error } = useCliente()
  const [cargando, setCargando] = useState(true)
  const [entregaSeleccionada, setEntregaSeleccionada] = useState<EntregaConEstado | null>(null)
  const [entregaConProblema, setEntregaConProblema] = useState<string | null>(null)
  const [descripcionProblema, setDescripcionProblema] = useState('')

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      await fetchEntregas()
      setCargando(false)
    }
    cargar()
  }, [fetchEntregas])

  const reportarProblema = async () => {
    if (!entregaConProblema || !descripcionProblema.trim()) {
      alert('Por favor completa todos los campos')
      return
    }

    console.log('Reporte enviado:', { deliveryId: entregaConProblema, description: descripcionProblema })
    alert('Reporte enviado correctamente (mock)')
    setEntregaConProblema(null)
    setDescripcionProblema('')
  }

  const statusConfig: Record<EstadoEntrega, { label: string; color: string; icon: string }> = {
    pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: '📦' },
    in_transit: { label: 'En tránsito', color: 'bg-blue-100 text-blue-800', icon: '🚚' },
    delivered: { label: 'Entregada', color: 'bg-emerald-100 text-emerald-800', icon: '✓' },
    issue: { label: 'Con problemas', color: 'bg-red-100 text-red-800', icon: '⚠️' },
  }

  const entregasConEstado = entregas as EntregaConEstado[]

  return (
    <div className="space-y-6">
      <PageHero
        title="Mis Entregas"
        subtitle="Rastrea tus entregas y accede al historial de envíos realizados"
        chips={[
          'Estado de entrega',
          'Rastreo GPS',
          'Constancia de entrega',
        ]}
      />

      {error && <Alert type="error" title="Error" message={error} />}

      <SectionHeader title="Mis Entregas" subtitle="Rastrea el estado de tus entregas" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Pendiente" value={entregasConEstado.filter(d => d.currentStatus === 'pending').length} color="yellow" />
        <StatCard label="En tránsito" value={entregasConEstado.filter(d => d.currentStatus === 'in_transit').length} color="blue" />
        <StatCard label="Entregadas" value={entregasConEstado.filter(d => d.currentStatus === 'delivered').length} color="emerald" />
        <StatCard label="Problemas" value={entregasConEstado.filter(d => d.currentStatus === 'issue').length} color="red" />
      </div>

      {cargando ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-4">
          {entregasConEstado.length > 0 ? (
            entregasConEstado.map(entrega => (
              <div key={entrega.id} className="rounded-lg border border-gray-200 bg-white p-4 transition hover:shadow-md">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Entrega {entrega.id}</h3>
                    <p className="text-sm text-gray-600">Pedido: {entrega.orderId}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusConfig[entrega.currentStatus || 'pending'].color}`}>
                    {statusConfig[entrega.currentStatus || 'pending'].label}
                  </span>
                </div>

                <div className="mb-3 flex items-start gap-2 text-sm text-gray-700">
                  <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{entrega.address}</p>
                    <p>
                      {entrega.city}, {entrega.state} {entrega.zipCode}
                    </p>
                  </div>
                </div>

                {entrega.trackingNumber && (
                  <div className="mb-3 flex items-center gap-2 rounded bg-gray-50 p-2 text-sm text-gray-700">
                    <Clock size={16} />
                    <span>
                      Tracking: <span className="font-mono font-semibold">{entrega.trackingNumber}</span>
                    </span>
                    {entrega.carrier && <span className="text-gray-600">via {entrega.carrier}</span>}
                  </div>
                )}

                <div className="mb-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Enviado</p>
                    <p className="font-semibold">{new Date(entrega.deliveryDate).toLocaleDateString('es-ES')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Entrega estimada</p>
                    <p className="font-semibold">{new Date(entrega.estimatedDeliveryDate).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-gray-100 pt-3">
                  <button
                    onClick={() => setEntregaSeleccionada(entrega)}
                    className="flex items-center gap-1 text-sm text-blue-600 transition hover:text-blue-800"
                  >
                    <Eye size={16} />
                    Ver detalles
                  </button>
                  {entrega.currentStatus === 'issue' && (
                    <button
                      onClick={() => setEntregaConProblema(entrega.id)}
                      className="flex items-center gap-1 text-sm text-brand-red transition hover:opacity-80"
                    >
                      <AlertCircle size={16} />
                      Reportar problema
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-gray-600">
              <p>No tienes entregas</p>
            </div>
          )}
        </div>
      )}

      {entregaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white">
            <div className="sticky top-0 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <h2 className="font-bold">Detalles de Entrega</h2>
              <button onClick={() => setEntregaSeleccionada(null)} className="text-2xl text-white hover:text-blue-100">
                ×
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <p className="text-sm text-gray-600">ID de Entrega</p>
                <p className="font-semibold">{entregaSeleccionada.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Número de Rastreo</p>
                <p className="font-mono font-semibold">{entregaSeleccionada.trackingNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Transportista</p>
                <p className="font-semibold">{entregaSeleccionada.carrier}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Dirección</p>
                <p className="font-semibold">{entregaSeleccionada.address}</p>
                <p className="text-sm">
                  {entregaSeleccionada.city}, {entregaSeleccionada.state}
                </p>
              </div>
              <button
                onClick={() => setEntregaSeleccionada(null)}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {entregaConProblema && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white">
            <div className="sticky top-0 flex items-center justify-between bg-gradient-to-r from-brand-red to-brand-red700 p-6 text-white">
              <h2 className="font-bold">Reportar Problema</h2>
              <button onClick={() => setEntregaConProblema(null)} className="text-2xl text-white hover:text-red-100">
                ×
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Descripción del problema</label>
                <textarea
                  value={descripcionProblema}
                  onChange={e => setDescripcionProblema(e.target.value)}
                  placeholder="Cuéntanos qué problema tienes con esta entrega..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-red-500"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEntregaConProblema(null)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={reportarProblema}
                  className="flex-1 rounded-lg bg-brand-red px-4 py-2 text-white transition hover:bg-brand-red700"
                >
                  Enviar Reporte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
