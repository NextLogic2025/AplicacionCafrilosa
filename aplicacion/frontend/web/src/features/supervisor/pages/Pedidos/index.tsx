import { useState, useEffect } from 'react'
import { ClipboardList, Search, Check, X, RefreshCcw, Eye } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { PageHero } from 'components/ui/PageHero'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { Alert } from 'components/ui/Alert'
import { Modal } from 'components/ui/Modal'
import { obtenerTodosPedidos, cambiarEstadoPedido, type Pedido } from '../../services/pedidosApi'
import { obtenerVendedores } from '../../services/usuariosApi'
import { obtenerClientes } from '../../services/clientesApi'

type EstadoFiltro = 'TODOS' | 'PENDIENTE' | 'APROBADO' | 'ANULADO' | 'EN_PREPARACION' | 'FACTURADO' | 'EN_RUTA' | 'ENTREGADO'

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>('TODOS')
  const [searchTerm, setSearchTerm] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [pedidoDetalle, setPedidoDetalle] = useState<Pedido | null>(null)

  useEffect(() => {
    cargarPedidos()
  }, [])

  const cargarPedidos = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Cargar pedidos, vendedores y clientes en paralelo
      const [pedidosData, vendedoresData, clientesData] = await Promise.all([
        obtenerTodosPedidos(),
        obtenerVendedores(),
        obtenerClientes()
      ])

      // Enriquecer pedidos con información de vendedores y clientes
      const pedidosEnriquecidos = pedidosData.map(pedido => ({
        ...pedido,
        vendedor: vendedoresData.find(v => v.id === pedido.vendedor_id),
        cliente: clientesData.find(c => c.id === pedido.cliente_id)
      }))

      setPedidos(pedidosEnriquecidos)
    } catch (err: any) {
      setError(err?.message || 'Error al cargar los pedidos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCambiarEstado = async (pedidoId: string, nuevoEstado: 'APROBADO' | 'ANULADO') => {
    try {
      await cambiarEstadoPedido(pedidoId, nuevoEstado)

      // Actualizar el pedido en la lista local
      setPedidos(prevPedidos =>
        prevPedidos.map(p =>
          p.id === pedidoId ? { ...p, estado_actual: nuevoEstado } : p
        )
      )

      // Mostrar toast de éxito
      setToast({
        type: 'success',
        message: `Pedido ${nuevoEstado === 'APROBADO' ? 'aprobado' : 'anulado'} exitosamente`
      })
      setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err?.message || 'Error al cambiar el estado del pedido'
      })
      setTimeout(() => setToast(null), 3000)
    }
  }

  const pedidosFiltrados = pedidos.filter(pedido => {
    // Filtro por estado
    const matchEstado = filtroEstado === 'TODOS' || pedido.estado_actual === filtroEstado

    // Filtro por búsqueda
    const searchLower = searchTerm.toLowerCase()
    const matchSearch = !searchTerm ||
      pedido.id.toLowerCase().includes(searchLower) ||
      pedido.cliente?.razon_social?.toLowerCase().includes(searchLower) ||
      pedido.vendedor?.nombreCompleto?.toLowerCase().includes(searchLower)

    return matchEstado && matchSearch
  })

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'APROBADO':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'ANULADO':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'EN_PREPARACION':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'FACTURADO':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'EN_RUTA':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'ENTREGADO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Trazabilidad de Pedidos"
        subtitle="Línea de tiempo completa: creación, validación, facturación y entrega"
        chips={[
          'Estado de pedidos',
          'Historial completo',
          'Escalar incidencias',
        ]}
      />

      <SectionHeader
        title="Pedidos del Sistema"
        subtitle="Todos los pedidos con su trazabilidad completa"
      />

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por ID, cliente o vendedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red outline-none"
            />
          </div>

          {/* Botón refrescar */}
          <button
            onClick={cargarPedidos}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Filtros de estado */}
        <div className="flex flex-wrap gap-2">
          {(['TODOS', 'PENDIENTE', 'APROBADO', 'ANULADO', 'EN_PREPARACION', 'FACTURADO', 'EN_RUTA', 'ENTREGADO'] as EstadoFiltro[]).map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filtroEstado === estado
                ? 'bg-brand-red text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {estado.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && <Alert type="error" message={error} />}

      {/* Loading */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No hay pedidos</h3>
          <p className="mt-2 text-sm text-gray-600">
            {searchTerm || filtroEstado !== 'TODOS'
              ? 'No se encontraron pedidos con los filtros aplicados'
              : 'No hay pedidos en el sistema'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    ID Pedido
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Vendedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pedidosFiltrados.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">
                      {pedido.id.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {pedido.cliente?.razon_social || 'Sin cliente'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {pedido.vendedor?.nombreCompleto || pedido.vendedor?.email || 'Sin vendedor'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getEstadoBadgeColor(pedido.estado_actual)}`}>
                        {pedido.estado_actual}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {formatCurrency(parseFloat(pedido.total_final))}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(pedido.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPedidoDetalle(pedido)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-3 h-3" />
                          Ver
                        </button>
                        <button
                          onClick={() => handleCambiarEstado(pedido.id, 'APROBADO')}
                          disabled={pedido.estado_actual === 'APROBADO' || pedido.estado_actual === 'ANULADO' || pedido.estado_actual === 'EN_PREPARACION'}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Aprobar pedido"
                        >
                          <Check className="w-3 h-3" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleCambiarEstado(pedido.id, 'ANULADO')}
                          disabled={pedido.estado_actual === 'ANULADO' || pedido.estado_actual === 'EN_PREPARACION'}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Anular pedido"
                        >
                          <X className="w-3 h-3" />
                          Anular
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Resumen */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Mostrando <span className="font-semibold">{pedidosFiltrados.length}</span> de{' '}
              <span className="font-semibold">{pedidos.length}</span> pedidos
            </p>
          </div>
        </div>
      )}

      {/* Modal de Detalles del Pedido */}
      <Modal
        isOpen={!!pedidoDetalle}
        title={`Detalles del Pedido #${pedidoDetalle?.codigo_visual || ''}`}
        onClose={() => setPedidoDetalle(null)}
        headerGradient="red"
        maxWidth="2xl"
      >
        {pedidoDetalle && (
          <div className="space-y-6">
            {/* Información del Pedido */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-600">Cliente</p>
                <p className="text-sm font-semibold text-gray-900">
                  {pedidoDetalle.cliente?.razon_social || 'Sin cliente'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Vendedor</p>
                <p className="text-sm font-semibold text-gray-900">
                  {pedidoDetalle.vendedor?.nombreCompleto || pedidoDetalle.vendedor?.email || 'Sin vendedor'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Estado</p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getEstadoBadgeColor(pedidoDetalle.estado_actual)}`}>
                  {pedidoDetalle.estado_actual}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-600">Condición de Pago</p>
                <p className="text-sm font-semibold text-gray-900">{pedidoDetalle.condicion_pago}</p>
              </div>
            </div>

            {/* Productos */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Productos del Pedido</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">SKU</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Producto</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Cantidad</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Precio Lista</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Precio Final</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pedidoDetalle.detalles?.map((detalle) => (
                      <tr key={detalle.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-xs font-mono text-gray-600">{detalle.codigo_sku}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {detalle.nombre_producto}
                          {detalle.motivo_descuento && (
                            <p className="text-xs text-green-600">🎁 {detalle.motivo_descuento}</p>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-gray-900">{detalle.cantidad} {detalle.unidad_medida}</td>
                        <td className="px-4 py-2 text-sm text-right text-gray-900">{formatCurrency(parseFloat(detalle.precio_lista))}</td>
                        <td className="px-4 py-2 text-sm text-right font-semibold text-gray-900">{formatCurrency(parseFloat(detalle.precio_final))}</td>
                        <td className="px-4 py-2 text-sm text-right font-semibold text-gray-900">{formatCurrency(parseFloat(detalle.subtotal_linea))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totales */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex flex-col gap-2 max-w-xs ml-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(parseFloat(pedidoDetalle.subtotal))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Descuentos:</span>
                  <span className="font-semibold text-green-600">-{formatCurrency(parseFloat(pedidoDetalle.descuento_total))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Impuestos:</span>
                  <span className="font-semibold">{formatCurrency(parseFloat(pedidoDetalle.impuestos_total))}</span>
                </div>
                <div className="flex justify-between text-lg border-t border-gray-200 pt-2">
                  <span className="font-bold text-gray-900">Total Final:</span>
                  <span className="font-bold text-brand-red">{formatCurrency(parseFloat(pedidoDetalle.total_final))}</span>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
              <button
                onClick={() => {
                  handleCambiarEstado(pedidoDetalle.id, 'APROBADO')
                  setPedidoDetalle(null)
                }}
                disabled={pedidoDetalle.estado_actual === 'APROBADO' || pedidoDetalle.estado_actual === 'ANULADO'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Check className="w-4 h-4" />
                Aprobar Pedido
              </button>
              <button
                onClick={() => {
                  handleCambiarEstado(pedidoDetalle.id, 'ANULADO')
                  setPedidoDetalle(null)
                }}
                disabled={pedidoDetalle.estado_actual === 'ANULADO'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <X className="w-4 h-4" />
                Anular Pedido
              </button>
              <button
                onClick={() => setPedidoDetalle(null)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 z-50 ${toast.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
            }`}
          style={{
            animation: 'slideInRight 0.3s ease-out',
          }}
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
