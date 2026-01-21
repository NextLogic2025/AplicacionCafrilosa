
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { EstadoPedido, Pedido, COLORES_MARCA } from '../../../types'
import { formatEstadoPedido, getEstadoPedidoColor } from 'utils/statusHelpers'

interface OrderDetailsModalProps {
    pedido: Pedido
    onClose: () => void
    onCancel: () => void
    fetchDetallePedido: (id: string) => Promise<Pedido>
}

export function OrderDetailsModal({
    pedido,
    onClose,
    onCancel,
    fetchDetallePedido,
}: OrderDetailsModalProps) {
    const [detalle, setDetalle] = useState<Pedido>(pedido)
    const [cargandoDetalle, setCargandoDetalle] = useState(false)
    const [detalleError, setDetalleError] = useState<string | null>(null)

    useEffect(() => {
        let isMounted = true
        setDetalle(pedido)
        if (pedido.items.length > 0) {
            setDetalleError(null)
            setCargandoDetalle(false)
            return () => {
                isMounted = false
            }
        }

        setCargandoDetalle(true)
        setDetalleError(null)
        const loadDetalle = async () => {
            try {
                const enriched = await fetchDetallePedido(pedido.id)
                if (!isMounted) return
                setDetalle(enriched)
            } catch (err) {
                if (!isMounted) return
                const message = err instanceof Error ? err.message : 'No se pudo cargar el detalle del pedido'
                setDetalleError(message)
            } finally {
                if (isMounted) setCargandoDetalle(false)
            }
        }
        loadDetalle()
        return () => {
            isMounted = false
        }
    }, [pedido, fetchDetallePedido])

    const puedeCancelar = detalle.status === EstadoPedido.PENDING || String(detalle.status).toUpperCase() === 'PENDIENTE'
    const estadoColor = getEstadoPedidoColor(detalle.status)
    const formattedDate = new Date(detalle.createdAt).toLocaleDateString('es-ES')
    const totalLineas = detalle.items.reduce((acc: number, item: any) => acc + item.quantity, 0)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-neutral-200 px-8 py-6">
                    <div>
                        <p className="text-sm font-semibold text-neutral-500">Detalles del Pedido</p>
                        <h2 className="text-2xl font-bold text-neutral-900">#{detalle.orderNumber}</h2>
                    </div>
                    <span
                        className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: estadoColor }}
                    >
                        {formatEstadoPedido(detalle.status)}
                    </span>
                    <button onClick={onClose} className="text-neutral-400 transition-colors hover:text-neutral-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="space-y-8 px-8 py-6 overflow-y-auto">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-neutral-500">Fecha</p>
                            <p className="text-lg font-semibold text-neutral-900">{formattedDate}</p>
                        </div>
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-neutral-500">Total líneas</p>
                            <p className="text-lg font-semibold text-neutral-900">{totalLineas} unidades</p>
                        </div>
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-neutral-500">Monto total</p>
                            <p className="text-xl font-bold" style={{ color: COLORES_MARCA.red }}>${detalle.totalAmount.toFixed(2)}</p>
                        </div>
                    </div>

                    <div>
                        <div className="mb-3 flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-neutral-900">Productos</h3>
                            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">{detalle.items.length} líneas</span>
                        </div>
                        <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200">
                            {cargandoDetalle ? (
                                <div className="px-4 py-6 text-center text-sm text-neutral-500">Cargando productos...</div>
                            ) : detalleError ? (
                                <div className="px-4 py-6 text-center text-sm text-red-600">{detalleError}</div>
                            ) : detalle.items.length === 0 ? (
                                <div className="px-4 py-6 text-center text-sm text-neutral-500">Este pedido no tiene productos registrados.</div>
                            ) : (
                                detalle.items.map(item => {
                                    const wasAdjusted = item.cantidad_solicitada != null && item.cantidad_solicitada !== item.quantity
                                    const requestedQty = item.cantidad_solicitada ?? item.quantity

                                    return (
                                        <div key={item.id} className="grid gap-4 px-4 py-3 md:grid-cols-3">
                                            <div className="md:col-span-2">
                                                <p className="text-sm font-semibold text-neutral-900">{item.productName}</p>
                                                <div className="flex flex-col gap-1 mt-1">
                                                    {wasAdjusted ? (
                                                        <>
                                                            <p className="text-xs text-neutral-500 line-through">
                                                                Solicitado: {requestedQty} {item.unit}
                                                            </p>
                                                            <p className="text-xs font-bold text-orange-600">
                                                                Enviado: {item.quantity} {item.unit} × ${item.unitPrice.toFixed(2)}
                                                            </p>
                                                            {item.motivo_ajuste && (
                                                                <p className="text-xs text-red-500 italic">
                                                                    * Ajuste: {item.motivo_ajuste}
                                                                </p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <p className="text-xs text-neutral-500">
                                                            {item.quantity} {item.unit} × ${item.unitPrice.toFixed(2)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-neutral-900">${item.subtotal.toFixed(2)}</p>
                                                {wasAdjusted && (
                                                    <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full">
                                                        MODIFICADO
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                </div>

                <div className="flex flex-col gap-3 border-t border-neutral-200 px-8 py-6 md:flex-row">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-center text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-50"
                    >
                        Cerrar
                    </button>
                    {puedeCancelar && (
                        <button
                            onClick={onCancel}
                            className="flex-1 rounded-xl px-4 py-3 text-center text-sm font-semibold text-white transition-colors"
                            style={{ backgroundColor: COLORES_MARCA.red }}
                        >
                            Cancelar Pedido
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
