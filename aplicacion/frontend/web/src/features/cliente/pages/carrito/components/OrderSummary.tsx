
import { CheckCircle2 } from 'lucide-react'

import type { DestinoTipo } from '../types'
import type { PerfilCliente, SucursalCliente } from '../../../types'

interface OrderSummaryProps {
    total: number
    creditoDisponible: number
    superaCredito: boolean
    condicionComercial: string
    itemsCount: number
    confirmarPedido: () => void
    goToProducts: () => void
    perfil: PerfilCliente | null
    sucursales: SucursalCliente[]
    selectedSucursalId: string | null
    setSelectedSucursalId: (id: string | null) => void
    destinoTipo: DestinoTipo
    handleDestinoTipoChange: (tipo: DestinoTipo) => void

}

export function OrderSummary({
    total,
    creditoDisponible,
    superaCredito,
    condicionComercial,
    itemsCount,
    confirmarPedido,
    goToProducts,
    perfil,

    sucursales,
    selectedSucursalId,
    setSelectedSucursalId,
    destinoTipo,
    handleDestinoTipoChange

}: OrderSummaryProps) {
    return (
        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm lg:col-span-1 lg:sticky lg:top-24">
            <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-700">Total</p>
                <p className="text-xl font-bold text-neutral-900">${total.toFixed(2)}</p>
            </div>


            {(perfil || sucursales.length > 0) && (
                <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-4">
                    <p className="text-sm font-semibold text-neutral-900 border-b border-neutral-100 pb-2">Destino del pedido</p>

                    {/* Option: Main Address */}
                    <label className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${destinoTipo === 'cliente' ? 'border-brand-red bg-red-50/50' : 'border-neutral-200 hover:bg-neutral-50'}`}>
                        <div className="pt-0.5">
                            <input
                                type="radio"
                                name="destinoTipo"
                                checked={destinoTipo === 'cliente'}
                                onChange={() => handleDestinoTipoChange('cliente')}
                                className="h-4 w-4 text-brand-red border-neutral-300 focus:ring-brand-red"
                            />
                        </div>
                        <div className="flex-1">
                            <span className="block text-sm font-medium text-neutral-900">
                                Cliente principal
                            </span>
                            {perfil ? (
                                <div className="mt-1 text-sm text-neutral-600">
                                    <p className="font-medium text-neutral-800">{perfil.contactName}</p>
                                    <p>{perfil.direccion || perfil.direccion_texto || 'Dirección no registrada'}</p>
                                    {perfil.ciudad && <p className="text-xs text-neutral-500">{perfil.ciudad}</p>}
                                </div>
                            ) : (
                                <p className="mt-1 text-sm text-neutral-400 italic">Información no disponible</p>
                            )}
                        </div>
                    </label>

                    {/* Option: Branch (if available) */}
                    {sucursales.length > 0 && (
                        <div className="space-y-3">
                            <label className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${destinoTipo === 'sucursal' ? 'border-brand-red bg-red-50/50' : 'border-neutral-200 hover:bg-neutral-50'}`}>
                                <div className="pt-0.5">
                                    <input
                                        type="radio"
                                        name="destinoTipo"
                                        checked={destinoTipo === 'sucursal'}
                                        onChange={() => handleDestinoTipoChange('sucursal')}
                                        className="h-4 w-4 text-brand-red border-neutral-300 focus:ring-brand-red"
                                    />
                                </div>
                                <div className="flex-1">
                                    <span className="block text-sm font-medium text-neutral-900">
                                        Sucursal
                                    </span>
                                    <p className="text-xs text-neutral-500 mt-1">
                                        Selecciona una de tus sucursales registradas
                                    </p>
                                </div>
                            </label>

                            {destinoTipo === 'sucursal' && (
                                <div className="pl-7 space-y-2">
                                    {sucursales.map(sucursal => (
                                        <label
                                            key={sucursal.id}
                                            className={`block cursor-pointer rounded-lg border p-2 transition-colors ${selectedSucursalId === sucursal.id ? 'border-brand-red ring-1 ring-brand-red' : 'border-neutral-200 hover:border-brand-red/50'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="sucursalId"
                                                    value={sucursal.id}
                                                    checked={selectedSucursalId === sucursal.id}
                                                    onChange={(e) => setSelectedSucursalId(e.target.value)}
                                                    className="h-3.5 w-3.5 text-brand-red border-neutral-300 focus:ring-brand-red"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-neutral-900 truncate">
                                                        {sucursal.nombre}
                                                    </p>
                                                    <p className="text-xs text-neutral-500 truncate">
                                                        {sucursal.direccion}
                                                    </p>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}





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
                    disabled={itemsCount === 0}
                    onClick={confirmarPedido}
                    className="rounded-xl bg-brand-red px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Confirmar pedido
                </button>
            </div>
        </div>
    )
}
