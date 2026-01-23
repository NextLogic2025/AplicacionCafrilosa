
import { CheckCircle2 } from 'lucide-react'


import type { SucursalCliente, ClienteDetalle, DestinoTipo } from '../types'

interface OrderSummaryProps {
    totalItems: number
    total: number
    creditoDisponible: number
    superaCredito: boolean
    condicionComercial: string


    // New props for selection
    clienteDetalle: ClienteDetalle | null
    sucursales: SucursalCliente[]
    selectedSucursalId: string | null
    setSelectedSucursalId: (id: string | null) => void
    destinoTipo: DestinoTipo
    handleDestinoTipoChange: (tipo: DestinoTipo) => void

    onGoBack: () => void
    onSubmit: () => void
    isSubmitting: boolean
    isCartEmpty: boolean
}

export function OrderSummary({
    totalItems,
    total,
    creditoDisponible,
    superaCredito,
    condicionComercial,


    // Selection props
    clienteDetalle,
    sucursales,
    selectedSucursalId,
    setSelectedSucursalId,
    destinoTipo,
    handleDestinoTipoChange,

    onGoBack,
    onSubmit,
    isSubmitting,
    isCartEmpty
}: OrderSummaryProps) {
    return (
        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm lg:col-span-1 lg:sticky lg:top-24">
            <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-700">Total de ítems</p>
                <p className="text-sm font-semibold text-neutral-900">{totalItems}</p>
            </div>
            <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-700">Total</p>
                <p className="text-xl font-bold text-neutral-900">${total.toFixed(2)}</p>
            </div>


            {/* Destination Selection UI */}
            {(clienteDetalle || sucursales.length > 0) && (
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
                            {clienteDetalle ? (
                                <div className="mt-1 text-sm text-neutral-600">
                                    <p className="font-medium text-neutral-800">
                                        {clienteDetalle.razon_social || clienteDetalle.nombre_comercial || 'Cliente'}
                                    </p>
                                    <p>
                                        {clienteDetalle.direccion || clienteDetalle.direccion_texto || 'Dirección no registrada'}
                                    </p>
                                    {clienteDetalle.ciudad && <p className="text-xs text-neutral-500">{clienteDetalle.ciudad}</p>}
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
                                        Selecciona una sucursal del cliente
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
                                                        {sucursal.nombre || sucursal.nombre_sucursal}
                                                    </p>
                                                    <p className="text-xs text-neutral-500 truncate">
                                                        {sucursal.direccion || sucursal.direccion_entrega}
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
                    onClick={onGoBack}
                    className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                >
                    ← Agregar más productos
                </button>
                <button
                    type="button"
                    disabled={isCartEmpty || isSubmitting}
                    onClick={onSubmit}
                    className="rounded-xl bg-brand-red px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Creando pedido...
                        </>
                    ) : (
                        'Confirmar pedido'
                    )}
                </button>
            </div>
        </div>
    )
}
