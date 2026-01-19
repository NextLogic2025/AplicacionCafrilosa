import { useState, useEffect } from 'react'
import { PageHero } from '../../../../components/ui/PageHero'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { EmptyContent } from '../../../../components/ui/EmptyContent'
import { ClipboardList, Search, Eye, RefreshCcw } from 'lucide-react'
import { getPedidos } from '../../services/vendedorApi'
import { Pedido, EstadoPedido } from '../../../cliente/types'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner'
import { Modal } from '../../../../components/ui/Modal'

// Componente auxiliar para estado
const EstadoBadge = ({ estado }: { estado: EstadoPedido }) => {
  const getVariant = (est: EstadoPedido) => {
    switch (est) {
      case EstadoPedido.PENDING: return 'warning'
      case EstadoPedido.APPROVED: return 'success'
      case EstadoPedido.CANCELLED: return 'error'
      case EstadoPedido.IN_TRANSIT: return 'info'
      case EstadoPedido.DELIVERED: return 'success'
      case EstadoPedido.IN_PREPARATION: return 'neutral'
      default: return 'neutral'
    }
  }

  const getLabel = (est: EstadoPedido) => {
    switch (est) {
      case EstadoPedido.PENDING: return 'Pendiente'
      case EstadoPedido.APPROVED: return 'Aprobado'
      case EstadoPedido.CANCELLED: return 'Anulado'
      case EstadoPedido.IN_TRANSIT: return 'En Ruta'
      case EstadoPedido.DELIVERED: return 'Entregado'
      case EstadoPedido.IN_PREPARATION: return 'En Preparación'
      default: return est
    }
  }

  return <StatusBadge variant={getVariant(estado)}>{getLabel(estado)}</StatusBadge>
}

export default function VendedorPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null)

  const fetchPedidos = async () => {
    setIsLoading(true)
    try {
      const response = await getPedidos(1)
      setPedidos(response.items)
    } catch (error) {
      console.error('Error loading pedidos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPedidos()
  }, [])

  const filteredPedidos = pedidos.filter(p =>
    p.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Mis Pedidos"
        subtitle="Seguimiento de pedidos creados"
        chips={[
          { label: 'Trazabilidad completa', variant: 'blue' },
          { label: 'Cliente y vendedor', variant: 'green' },
        ]}
      />

      {/* Filtros */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Buscar Pedido
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Número de pedido..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={fetchPedidos}
            disabled={isLoading}
            className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors flex items-center gap-2"
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </section>

      {/* Lista de Pedidos */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4">Lista de Pedidos ({filteredPedidos.length})</h3>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredPedidos.length === 0 ? (
          <EmptyContent
            icon={<ClipboardList className="h-16 w-16" />}
            title="No hay pedidos registrados"
            description="Los pedidos que crees o que tus clientes generen aparecerán aquí"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredPedidos.map(pedido => (
                  <tr key={pedido.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-sm font-mono text-neutral-900">{pedido.orderNumber}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{formatDate(pedido.createdAt)}</td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={pedido.status} />
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-neutral-900 text-right">
                      ${pedido.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedPedido(pedido)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-100 text-neutral-700 text-xs font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                      >
                        <Eye className="h-3 w-3" /> Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal Detalle */}
      <Modal
        isOpen={!!selectedPedido}
        onClose={() => setSelectedPedido(null)}
        title={`Detalle Pedido #${selectedPedido?.orderNumber}`}
        maxWidth="2xl"
      >
        {selectedPedido && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-neutral-500">Fecha de Creación</p>
                <p className="font-medium">{formatDate(selectedPedido.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Estado</p>
                <EstadoBadge estado={selectedPedido.status} />
              </div>
              <div>
                <p className="text-xs text-neutral-500">ID Interno</p>
                <p className="font-mono text-xs">{selectedPedido.id}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Items</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-100">
                    <tr>
                      <th className="px-3 py-2 text-left">Producto</th>
                      <th className="px-3 py-2 text-right">Cant.</th>
                      <th className="px-3 py-2 text-right">Precio</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedPedido.items.map(item => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">{item.productName}</td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">${item.unitPrice.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-medium">${item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-neutral-50 font-bold">
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right">Total</td>
                      <td className="px-3 py-2 text-right">${selectedPedido.totalAmount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Leyenda de Estados */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h4 className="font-semibold text-neutral-950 mb-3">Estados del Pedido</h4>
        <div className="flex flex-wrap gap-3">
          <StatusBadge variant="warning">Pendiente</StatusBadge>
          <StatusBadge variant="success">Aprobado</StatusBadge>
          <StatusBadge variant="error">Anulado</StatusBadge>
          <StatusBadge variant="info">En Ruta</StatusBadge>
        </div>
      </section>
    </div>
  )
}
