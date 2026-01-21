
import { Eye, PackageCheck } from 'lucide-react'
import { Pedido } from '../../../services/bodegueroApi'

interface PendingOrdersTableProps {
    pedidos: Pedido[]
    handleVerDetalle: (id: string) => void
    handleIniciarPreparacion: (id: string) => void
    getEstadoBadgeColor: (estado: string) => string
    formatCurrency: (value: string | number) => string
    formatDate: (date: string) => string
}

export function PendingOrdersTable({
    pedidos,
    handleVerDetalle,
    handleIniciarPreparacion,
    getEstadoBadgeColor,
    formatCurrency,
    formatDate
}: PendingOrdersTableProps) {
    return (
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
                    {pedidos.map((pedido) => (
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
    )
}
