
import { Building2 } from 'lucide-react'
import type { SucursalCliente, ClienteDetalle } from '../types'

interface DestinationSelectorProps {
    destinoTipo: 'cliente' | 'sucursal'
    onDestinoChange: (tipo: 'cliente' | 'sucursal') => void
    sucursales: SucursalCliente[]
    clienteDetalle: ClienteDetalle | null
    selectedSucursalId: string | null
    onSucursalSelect: (id: string) => void
    invalidSucursalMessage: string | null
    destinoDescripcion: string
}

export function DestinationSelector({
    destinoTipo,
    onDestinoChange,
    sucursales,
    clienteDetalle,
    selectedSucursalId,
    onSucursalSelect,
    invalidSucursalMessage,
    destinoDescripcion
}: DestinationSelectorProps) {

    return (
        <div className="rounded-2xl border border-neutral-200 px-3 py-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-900">
                <Building2 className="h-4 w-4 text-brand-red" /> Destino del pedido
            </div>
            <p className="text-xs text-neutral-500">
                {sucursales.length > 0
                    ? 'Si el cliente tiene sucursales, puedes enviar este pedido directamente a una de ellas.'
                    : 'El pedido se enviará a la dirección principal del cliente.'}
            </p>
            <div className="mt-3 space-y-2">
                <label className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 text-sm ${destinoTipo === 'cliente' ? 'border-brand-red/50 bg-brand-red/5' : 'border-neutral-200 hover:border-neutral-300'}`}>
                    <input
                        type="radio"
                        name="destinoPedido"
                        checked={destinoTipo === 'cliente'}
                        onChange={() => onDestinoChange('cliente')}
                        className="mt-1"
                    />
                    <div>
                        <p className="font-semibold text-neutral-900">Cliente principal</p>
                        <p className="text-xs text-neutral-500">
                            {clienteDetalle?.direccion_texto || clienteDetalle?.direccion
                                ? `${clienteDetalle.direccion_texto || clienteDetalle.direccion}${clienteDetalle.ciudad ? ` · ${clienteDetalle.ciudad}` : ''}${clienteDetalle.estado ? ` · ${clienteDetalle.estado}` : ''}`
                                : 'Usaremos la dirección registrada del cliente.'}
                        </p>
                    </div>
                </label>
                {sucursales.length > 0 && (
                    <label className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 text-sm ${destinoTipo === 'sucursal' ? 'border-brand-red/50 bg-brand-red/5' : 'border-neutral-200 hover:border-neutral-300'}`}>
                        <input
                            type="radio"
                            name="destinoPedido"
                            checked={destinoTipo === 'sucursal'}
                            onChange={() => onDestinoChange('sucursal')}
                            className="mt-1"
                        />
                        <div>
                            <p className="font-semibold text-neutral-900">Sucursal</p>
                            <p className="text-xs text-neutral-500">
                                Selecciona una de las sucursales registradas.
                            </p>
                        </div>
                    </label>
                )}
            </div>
            {destinoTipo === 'sucursal' && sucursales.length > 0 && (
                <div className="mt-3 space-y-2 rounded-xl border border-dashed border-brand-red/40 bg-brand-red/5 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-red">Selecciona la sucursal</p>
                    <div className="space-y-2">
                        {sucursales.map(sucursal => (
                            <label
                                key={sucursal.id}
                                className={`flex cursor-pointer items-start gap-2 rounded-xl border bg-white px-3 py-2 text-sm ${selectedSucursalId === sucursal.id ? 'border-brand-red/60 shadow-sm' : 'border-brand-red/10 hover:border-brand-red/40'}`}
                            >
                                <input
                                    type="radio"
                                    name="destinoSucursal"
                                    checked={selectedSucursalId === sucursal.id}
                                    onChange={() => onSucursalSelect(sucursal.id)}
                                    className="mt-1"
                                />
                                <div>
                                    <p className="font-semibold text-neutral-900">{sucursal.nombre_sucursal || sucursal.nombre}</p>
                                    <p className="text-xs text-neutral-500">
                                        {[sucursal.direccion_entrega || sucursal.direccion, sucursal.zona_nombre, sucursal.contacto_telefono].filter(Boolean).join(' · ') || 'Sin dirección registrada'}
                                    </p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            )}
            <div className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                Destino actual: {destinoDescripcion}
            </div>
            {invalidSucursalMessage ? (
                <div className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {invalidSucursalMessage}
                </div>
            ) : null}
        </div>
    )
}
