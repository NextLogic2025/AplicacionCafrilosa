
import { Eye, X } from 'lucide-react'
import { EstadoPedido, Pedido } from '../../../types'
import { formatEstadoPedido, getEstadoPedidoColor } from 'utils/statusHelpers'

interface OrdersTableProps {
    pedidos: Pedido[]
    onViewDetail: (pedido: Pedido) => void
    onCancelOrder: (id: string) => void
}

export function OrdersTable({ pedidos, onViewDetail, onCancelOrder }: OrdersTableProps) {
    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Número</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {pedidos.map(pedido => (
                        <tr key={pedido.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{pedido.orderNumber}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{new Date(pedido.createdAt).toLocaleDateString('es-ES')}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">${pedido.totalAmount.toFixed(2)}</td>
                            <td className="px-4 py-3">
                                <span
                                    className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
                                    style={{ backgroundColor: getEstadoPedidoColor(pedido.status) }}
                                >
                                    {formatEstadoPedido(pedido.status)}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                                <button
                                    onClick={() => onViewDetail(pedido)}
                                    className="text-blue-600 transition-colors hover:text-blue-700"
                                    title="Ver detalles"
                                >
                                    <Eye className="h-5 w-5" />
                                </button>
                                {(pedido.status === EstadoPedido.PENDING || String(pedido.status).toUpperCase() === 'PENDIENTE') && (
                                    <button
                                        onClick={() => {
                                            if (!confirm('¿Estás seguro que deseas cancelar este pedido?')) return
                                            onCancelOrder(pedido.id)
                                        }}
                                        className="text-red-600 transition-colors hover:text-red-700"
                                        title="Cancelar pedido"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
