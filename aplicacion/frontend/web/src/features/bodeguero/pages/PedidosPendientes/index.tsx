import { useState, useEffect } from 'react'
import { ClipboardList, Search, Eye, PackageCheck } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { PageHero } from 'components/ui/PageHero'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { Alert } from 'components/ui/Alert'
import { Modal } from 'components/ui/Modal'
import { obtenerPedidos, obtenerPedidoPorId, iniciarPreparacion, type Pedido } from '../../services/bodegueroApi'

type EstadoFiltro = 'TODOS' | 'PENDIENTE' | 'APROBADO' | 'EN_PREPARACION' | 'FACTURADO' | 'EN_RUTA' | 'ENTREGADO'

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>('TODOS')
  const [searchTerm, setSearchTerm] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [pedidoDetalle, setPedidoDetalle] = useState<Pedido | null>(null)
  const [isLoadingDetalle, setIsLoadingDetalle] = useState(false)

  useEffect(() => {
    cargarPedidos()
  }, [])

  const cargarPedidos = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const pedidosData = await obtenerPedidos()
      console.log('[Bodeguero] Pedidos recibidos:', pedidosData)
      console.log('[Bodeguero] Total pedidos:', pedidosData.length)
      setPedidos(pedidosData)
    } catch (err: any) {
      console.error('[Bodeguero] Error al cargar pedidos:', err)
      setError(err?.message || 'Error al cargar los pedidos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerDetalle = async (pedidoId: string) => {
    try {
      setIsLoadingDetalle(true)
      const detalle = await obtenerPedidoPorId(pedidoId)
      setPedidoDetalle(detalle)
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err?.message || 'Error al cargar el detalle del pedido'
      })
      setTimeout(() => setToast(null), 3000)
    } finally {
      setIsLoadingDetalle(false)
    }
  }

  const handleIniciarPreparacion = async (pedidoId: string) => {
    try {
      await iniciarPreparacion(pedidoId)

      // Actualizar el pedido en la lista local
      setPedidos(prevPedidos =>
        prevPedidos.map(p =>
          p.id === pedidoId ? { ...p, estado_actual: 'EN_PREPARACION' } : p
        )
      )

      // Actualizar detalle si está abierto
      if (pedidoDetalle?.id === pedidoId) {
        setPedidoDetalle({ ...pedidoDetalle, estado_actual: 'EN_PREPARACION' })
      }

      setToast({
        type: 'success',
        message: 'Pedido marcado como EN PREPARACIÓN exitosamente'
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
    const matchEstado = filtroEstado === 'TODOS' || pedido.estado_actual === filtroEstado
    const searchLower = searchTerm.toLowerCase()
    const matchSearch = !searchTerm ||
      pedido.id.toLowerCase().includes(searchLower) ||
      pedido.codigo_visual.toString().includes(searchLower) ||
      pedido.cliente?.razon_social?.toLowerCase().includes(searchLower)

    return matchEstado && matchSearch
  })

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'APROBADO':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'EN_PREPARACION':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'FACTURADO':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'EN_RUTA':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'ENTREGADO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'ANULADO':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(num)
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
        title="Pedidos en Bodega"
        subtitle="Consulta y prepara los pedidos aprobados para despacho"
        chips={[
          'Estado de preparación',
          'Picking y packing',
          'Control de calidad',
        ]}
      />

      {/* Toast Notifications */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 shadow-lg ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
          {toast.message}
        </div>
      )}

      <SectionHeader
        title="Pedidos a Preparar"
        subtitle="Pedidos aprobados listos para preparación"
      />

      {/* Filtros y búsqueda */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por ID, código o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]"
          />
        </div>

        <div className="flex gap-2">
          {(['TODOS', 'APROBADO', 'EN_PREPARACION', 'FACTURADO'] as EstadoFiltro[]).map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${filtroEstado === estado
                ? 'bg-brand-red text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
            >
              {estado === 'TODOS' ? 'Todos' : estado.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && <Alert type="error" message={error} />}

      {/* Contenido */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-200">
            <ClipboardList className="h-8 w-8 text-neutral-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-neutral-900">
            No hay pedidos
          </h3>
          <p className="mt-2 text-sm text-neutral-600">
            {searchTerm || filtroEstado !== 'TODOS'
              ? 'No se encontraron pedidos con los filtros aplicados'
              : 'Los pedidos aparecerán aquí cuando estén disponibles'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {pedidosFiltrados.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-neutral-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-neutral-900">
                    #{pedido.codigo_visual}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-900">
                    {pedido.cliente?.razon_social || 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getEstadoBadgeColor(pedido.estado_actual)}`}>
                      {pedido.estado_actual.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-neutral-900">
                    {formatCurrency(pedido.total_final)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                    {formatDate(pedido.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleVerDetalle(pedido.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                        title="Ver detalle"
                      >
                        <Eye className="h-4 w-4" />
                        Ver
                      </button>
                      {pedido.estado_actual === 'APROBADO' && (
                        <button
                          onClick={() => handleIniciarPreparacion(pedido.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-red px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-red/90"
                          title="Iniciar preparación"
                        >
                          <PackageCheck className="h-4 w-4" />
                          Preparar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Detalle */}
      <Modal
        isOpen={!!pedidoDetalle}
        onClose={() => setPedidoDetalle(null)}
        title={`Pedido #${pedidoDetalle?.codigo_visual || ''}`}
        headerGradient="red"
        maxWidth="2xl"
      >
        {isLoadingDetalle ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : pedidoDetalle && (
          <div className="space-y-6">
            {/* Información General */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-neutral-500">Cliente</p>
                <p className="mt-1 text-sm text-neutral-900">{pedidoDetalle.cliente?.razon_social || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500">Estado</p>
                <span className={`mt-1 inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getEstadoBadgeColor(pedidoDetalle.estado_actual)}`}>
                  {pedidoDetalle.estado_actual.replace('_', ' ')}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500">Fecha de Creación</p>
                <p className="mt-1 text-sm text-neutral-900">{formatDate(pedidoDetalle.created_at)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500">Condición de Pago</p>
                <p className="mt-1 text-sm text-neutral-900">{pedidoDetalle.condicion_pago}</p>
              </div>
            </div>

            {/* Observaciones */}
            {pedidoDetalle.observaciones_entrega && (
              <div>
                <p className="text-sm font-medium text-neutral-500">Observaciones</p>
                <p className="mt-1 text-sm text-neutral-900">{pedidoDetalle.observaciones_entrega}</p>
              </div>
            )}

            {/* Detalles del Pedido */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Productos</h3>
              <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-neutral-500">Producto</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-neutral-500">Cantidad</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-neutral-500">Precio</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-neutral-500">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {pedidoDetalle.detalles?.map((detalle) => (
                      <tr key={detalle.id}>
                        <td className="px-4 py-3 text-sm text-neutral-900">{detalle.codigo_sku}</td>
                        <td className="px-4 py-3 text-sm text-neutral-900">{detalle.nombre_producto}</td>
                        <td className="px-4 py-3 text-right text-sm text-neutral-900">
                          {detalle.cantidad} {detalle.unidad_medida}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-neutral-900">
                          {formatCurrency(detalle.precio_final)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-neutral-900">
                          {formatCurrency(detalle.subtotal_linea)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totales */}
            <div className="border-t border-neutral-200 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Subtotal:</span>
                  <span className="font-medium text-neutral-900">{formatCurrency(pedidoDetalle.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Descuento:</span>
                  <span className="font-medium text-neutral-900">-{formatCurrency(pedidoDetalle.descuento_total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Impuestos:</span>
                  <span className="font-medium text-neutral-900">{formatCurrency(pedidoDetalle.impuestos_total)}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold">
                  <span className="text-neutral-900">Total:</span>
                  <span className="text-brand-red">{formatCurrency(pedidoDetalle.total_final)}</span>
                </div>
              </div>
            </div>

            {/* Acción de Preparación */}
            {pedidoDetalle.estado_actual === 'APROBADO' && (
              <div className="flex justify-end border-t border-neutral-200 pt-4">
                <button
                  onClick={() => {
                    handleIniciarPreparacion(pedidoDetalle.id)
                    setPedidoDetalle(null)
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-red/90"
                >
                  <PackageCheck className="h-4 w-4" />
                  Iniciar Preparación
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
