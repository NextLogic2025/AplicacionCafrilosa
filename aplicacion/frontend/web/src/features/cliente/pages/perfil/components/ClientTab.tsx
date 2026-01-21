
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { Alert } from 'components/ui/Alert'
import { InfoCard } from 'components/ui/InfoCard'

interface ClientTabProps {
    clientLoading: boolean
    clientError: string | null
    client: any
    vendedorMap: any
    clientEditing: boolean
    clientForm: { identificacion: string; tipo_identificacion: string; razon_social: string; nombre_comercial: string }
    setClientForm: React.Dispatch<React.SetStateAction<{ identificacion: string; tipo_identificacion: string; razon_social: string; nombre_comercial: string }>>
    formatGps: (gps: any) => string
}

export function ClientTab({
    clientLoading,
    clientError,
    client,
    vendedorMap,
    clientEditing,
    clientForm,
    setClientForm,
    formatGps
}: ClientTabProps) {
    return (
        <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold uppercase text-neutral-500">Datos del cliente</h3>
            {clientLoading && <LoadingSpinner text="Cargando datos del cliente..." />}
            {clientError && <Alert type="info" title="Cliente" message={clientError} />}
            {client && (
                <div className="grid gap-4 md:grid-cols-2">
                    {!clientEditing ? (
                        <>
                            <InfoCard label="Identificación" value={client.identificacion ?? '—'} />
                            <InfoCard label="Tipo identificación" value={client.tipo_identificacion ?? '—'} />
                            <InfoCard label="Razón social" value={client.razon_social ?? '—'} />
                            <InfoCard label="Nombre comercial" value={client.nombre_comercial ?? '—'} />
                        </>
                    ) : (
                        <>
                            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                                <label className="text-xs uppercase tracking-[0.14em] text-neutral-500">Identificación</label>
                                <input
                                    className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                                    value={clientForm.identificacion}
                                    onChange={(e) => setClientForm((s) => ({ ...s, identificacion: e.target.value }))}
                                />
                            </div>

                            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                                <label className="text-xs uppercase tracking-[0.14em] text-neutral-500">Tipo identificación</label>
                                <input
                                    className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                                    value={clientForm.tipo_identificacion}
                                    onChange={(e) => setClientForm((s) => ({ ...s, tipo_identificacion: e.target.value }))}
                                />
                            </div>

                            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                                <label className="text-xs uppercase tracking-[0.14em] text-neutral-500">Razón social</label>
                                <input
                                    className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                                    value={clientForm.razon_social}
                                    onChange={(e) => setClientForm((s) => ({ ...s, razon_social: e.target.value }))}
                                />
                            </div>

                            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                                <label className="text-xs uppercase tracking-[0.14em] text-neutral-500">Nombre comercial</label>
                                <input
                                    className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                                    value={clientForm.nombre_comercial ?? ''}
                                    onChange={(e) => setClientForm((s) => ({ ...s, nombre_comercial: e.target.value }))}
                                />
                            </div>
                        </>
                    )}
                    <InfoCard label="Lista de precios" value={client.lista_precios_id ? String(client.lista_precios_id) : '—'} />
                    <InfoCard
                        label="Vendedor asignado"
                        value={client.vendedor_asignado_id
                            ? (client.nombre_vendedor_cache
                                ?? client.vendedor_nombre
                                ?? vendedorMap[client.vendedor_asignado_id]?.nombre
                                ?? 'Vendedor no disponible')
                            : '—'}
                    />
                    <InfoCard label="Zona comercial" value={client.zona_comercial_id ?? '—'} />
                    <InfoCard label="Tiene crédito" value={client.tiene_credito ? 'Sí' : 'No'} />
                    <InfoCard label="Límite crédito" value={client.limite_credito ?? '0.00'} />
                    <InfoCard label="Saldo actual" value={client.saldo_actual ?? '0.00'} />
                    <InfoCard label="Días plazo" value={client.dias_plazo != null ? String(client.dias_plazo) : '0'} />
                    <InfoCard label="Bloqueado" value={client.bloqueado ? 'Sí' : 'No'} />
                    <InfoCard label="Dirección" value={client.direccion_texto ?? '—'} />
                    <InfoCard label="Ubicación GPS" value={client.ubicacion_gps ? formatGps(client.ubicacion_gps) : '—'} />
                    <InfoCard label="Eliminado" value={client.deleted_at ? new Date(client.deleted_at).toLocaleDateString('es-PE') : 'No'} />
                </div>
            )}
        </div>
    )
}
