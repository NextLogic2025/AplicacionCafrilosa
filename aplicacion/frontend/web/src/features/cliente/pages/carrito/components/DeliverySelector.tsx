
import { Building2 } from 'lucide-react'
import type { DestinoTipo } from '../types'
import type { PerfilCliente, SucursalCliente } from '../../../types'

interface DeliverySelectorProps {
    destinoTipo: DestinoTipo
    handleDestinoTipoChange: (tipo: DestinoTipo) => void
    sucursales: SucursalCliente[]
    selectedSucursalId: string | null
    setSelectedSucursalId: (id: string | null) => void
    destinoDescripcion: string
    invalidSucursalMessage: string | null
    perfil: PerfilCliente | null
}

export function DeliverySelector({
    destinoTipo,
    handleDestinoTipoChange,
    sucursales,
    selectedSucursalId,
    setSelectedSucursalId,
    destinoDescripcion,
    invalidSucursalMessage,
    perfil
}: DeliverySelectorProps) {
    // if (sucursales.length === 0) return null

    return (
        <div className="rounded-2xl border border-neutral-200 px-3 py-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-900">
                <Building2 className="h-4 w-4 text-brand-red" /> Destino del pedido
            </div>
            <p className="text-xs text-neutral-500">Si tu empresa tiene sucursales, puedes enviar este pedido directamente a una de ellas.</p>
            <div className="mt-3 space-y-2">
                <label className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 text-sm ${destinoTipo === 'cliente' ? 'border-brand-red/50 bg-brand-red/5' : 'border-neutral-200 hover:border-neutral-300'}`}>
                    <input
                        type="radio"
                        name="destinoPedido"
                        checked={destinoTipo === 'cliente'}
                        onChange={() => handleDestinoTipoChange('cliente')}
                        className="mt-1"
                    />
                    <div>
                        <p className="font-semibold text-neutral-900">Cliente principal</p>
                        <p className="text-xs text-neutral-500">
                            {perfil?.direccion_texto || perfil?.direccion
                                ? `${perfil.direccion_texto || perfil.direccion}${perfil.ciudad ? ` · ${perfil.ciudad}` : ''}${perfil.estado ? ` · ${perfil.estado}` : ''}`
                                : 'Usaremos la dirección registrada.'}
                        </p>
                    </div>
                </label>
                <label className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 text-sm ${destinoTipo === 'sucursal' ? 'border-brand-red/50 bg-brand-red/5' : 'border-neutral-200 hover:border-neutral-300'} ${sucursales.length === 0 ? 'opacity-60' : ''}`}>
                    <input
                        type="radio"
                        name="destinoPedido"
                        checked={destinoTipo === 'sucursal'}
                        onChange={() => handleDestinoTipoChange('sucursal')}
                        disabled={sucursales.length === 0}
                        className="mt-1"
                    />
                    <div>
                        <p className="font-semibold text-neutral-900">Sucursal</p>
                        <p className="text-xs text-neutral-500">
                            {sucursales.length > 0 ? 'Selecciona una de tus sucursales registradas.' : 'Aún no registras sucursales en tu catálogo.'}
                        </p>
                    </div>
                </label>
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
                                    onChange={() => setSelectedSucursalId(sucursal.id)}
                                    className="mt-1"
                                />
                                <div>
                                    <p className="font-semibold text-neutral-900">{sucursal.nombre}</p>
                                    <p className="text-xs text-neutral-500">
                                        {[sucursal.direccion, sucursal.ciudad, sucursal.estado].filter(Boolean).join(' · ') || 'Sin dirección registrada'}
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
