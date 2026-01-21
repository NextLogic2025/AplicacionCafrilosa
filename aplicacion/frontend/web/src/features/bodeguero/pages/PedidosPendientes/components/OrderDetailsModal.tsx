
import { PackageCheck } from 'lucide-react'
import { Modal } from 'components/ui/Modal'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { Pedido } from '../../../services/bodegueroApi'

interface OrderDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    pedido: Pedido | null
    isLoading: boolean
    getEstadoBadgeColor: (estado: string) => string
    formatCurrency: (value: string | number) => string
    formatDate: (date: string) => string
    handleIniciarPreparacion: (id: string) => void
    setPedidoDetalle: (pedido: Pedido | null) => void
}

export function OrderDetailsModal({
    isOpen,
    onClose,
    pedido,
    isLoading,
    getEstadoBadgeColor,
    formatCurrency,
    formatDate,
    handleIniciarPreparacion,
    setPedidoDetalle
}: OrderDetailsModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Pedido #${pedido?.codigo_visual || ''}`}
            headerGradient="red"
            maxWidth="2xl"
        >
            {isLoading ? (
                <div className="flex justify-center py-8">
                    <LoadingSpinner />
                </div>
            ) : pedido && (
                <div className="space-y-6">
                    {/* Información General */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-neutral-500">Cliente</p>
                            <p className="mt-1 text-sm text-neutral-900">{pedido.cliente?.razon_social || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-neutral-500">Estado</p>
                            <span className={`mt-1 inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getEstadoBadgeColor(pedido.estado_actual)}`}>
                                {pedido.estado_actual.replace('_', ' ')}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-neutral-500">Fecha de Creación</p>
                            <p className="mt-1 text-sm text-neutral-900">{formatDate(pedido.created_at)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-neutral-500">Condición de Pago</p>
                            <p className="mt-1 text-sm text-neutral-900">{pedido.condicion_pago}</p>
                        </div>
                    </div>

                    {/* Observaciones */}
                    {pedido.observaciones_entrega && (
                        <div>
                            <p className="text-sm font-medium text-neutral-500">Observaciones</p>
                            <p className="mt-1 text-sm text-neutral-900">{pedido.observaciones_entrega}</p>
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
                                    {pedido.detalles?.map((detalle) => (
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
                                <span className="font-medium text-neutral-900">{formatCurrency(pedido.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500">Descuento:</span>
                                <span className="font-medium text-neutral-900">-{formatCurrency(pedido.descuento_total)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500">Impuestos:</span>
                                <span className="font-medium text-neutral-900">{formatCurrency(pedido.impuestos_total)}</span>
                            </div>
                            <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold">
                                <span className="text-neutral-900">Total:</span>
                                <span className="text-brand-red">{formatCurrency(pedido.total_final)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Acción de Preparación */}
                    {pedido.estado_actual === 'APROBADO' && (
                        <div className="flex justify-end border-t border-neutral-200 pt-4">
                            <button
                                onClick={() => {
                                    handleIniciarPreparacion(pedido.id)
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
    )
}
