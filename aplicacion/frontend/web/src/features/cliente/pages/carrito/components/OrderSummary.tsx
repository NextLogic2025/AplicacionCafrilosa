
import { CheckCircle2 } from 'lucide-react'
import { DeliverySelector } from './DeliverySelector'
import type { DestinoTipo } from '../types'
import type { SucursalCliente } from '../../../types'

interface OrderSummaryProps {
    total: number
    creditoDisponible: number
    superaCredito: boolean
    condicionComercial: string
    itemsCount: number
    confirmarPedido: () => void
    goToProducts: () => void
    destinoTipo: DestinoTipo
    handleDestinoTipoChange: (tipo: DestinoTipo) => void
    sucursales: SucursalCliente[]
    selectedSucursalId: string | null
    setSelectedSucursalId: (id: string | null) => void
    destinoDescripcion: string
    invalidSucursalMessage: string | null
}

export function OrderSummary({
    total,
    creditoDisponible,
    superaCredito,
    condicionComercial,
    itemsCount,
    confirmarPedido,
    goToProducts,
    destinoTipo,
    handleDestinoTipoChange,
    sucursales,
    selectedSucursalId,
    setSelectedSucursalId,
    destinoDescripcion,
    invalidSucursalMessage
}: OrderSummaryProps) {
    return (
        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm lg:col-span-1 lg:sticky lg:top-24">
            <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-700">Total</p>
                <p className="text-xl font-bold text-neutral-900">${total.toFixed(2)}</p>
            </div>
            <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-700">Crédito disponible</p>
                <p className={`text-sm font-semibold ${superaCredito ? 'text-brand-red' : 'text-emerald-700'}`}>${creditoDisponible.toFixed(2)}</p>
            </div>
            <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-700">Condición comercial</p>
                <p className="text-sm font-semibold text-neutral-900">{condicionComercial}</p>
            </div>
            {superaCredito ? (
                <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
                    El total excede tu crédito disponible.
                </div>
            ) : (
                <div className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">
                    <CheckCircle2 className="mr-1 inline h-4 w-4" /> Cumple con crédito disponible.
                </div>
            )}

            <DeliverySelector
                destinoTipo={destinoTipo}
                handleDestinoTipoChange={handleDestinoTipoChange}
                sucursales={sucursales}
                selectedSucursalId={selectedSucursalId}
                setSelectedSucursalId={setSelectedSucursalId}
                destinoDescripcion={destinoDescripcion}
                invalidSucursalMessage={invalidSucursalMessage}
            />

            <div className="grid gap-2">
                <button
                    type="button"
                    onClick={goToProducts}
                    className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                >
                    Continuar comprando
                </button>
                <button
                    type="button"
                    disabled={itemsCount === 0 || superaCredito}
                    onClick={confirmarPedido}
                    className="rounded-xl bg-brand-red px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Confirmar pedido
                </button>
            </div>
        </div>
    )
}
