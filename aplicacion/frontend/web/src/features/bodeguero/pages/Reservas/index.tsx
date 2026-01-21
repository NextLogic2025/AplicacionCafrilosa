import { useState, useEffect } from 'react'
import { Package } from 'lucide-react'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { Alert } from 'components/ui/Alert'
import { GenericDataTable } from 'components/ui/GenericDataTable'
import { StatusBadge } from 'components/ui/StatusBadge'
import { reservationsApi, Reservation } from '../../services/reservationsApi'

export default function ReservasPage() {
    const [reservations, setReservations] = useState<Reservation[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>('ALL')

    useEffect(() => {
        loadReservations()
    }, [statusFilter])

    const loadReservations = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await reservationsApi.getAll(statusFilter === 'ALL' ? undefined : statusFilter)
            console.log('[Reservas] API Response:', data)
            console.log('[Reservas] First item:', data[0])
            setReservations(data)
        } catch (err) {
            console.error('[Reservas] Error:', err)
            setError(err instanceof Error ? err.message : 'Error al cargar reservas')
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = async (id: string) => {
        if (!confirm('¿Estás seguro de cancelar esta reserva?')) return
        try {
            await reservationsApi.cancel(id)
            loadReservations()
        } catch (err) {
            setError('Error al cancelar reserva')
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <StatusBadge variant="info">Activa</StatusBadge>
            case 'CONFIRMED':
                return <StatusBadge variant="success">Confirmada</StatusBadge>
            case 'CANCELLED':
                return <StatusBadge variant="error">Cancelada</StatusBadge>
            default:
                return <span className="text-sm text-neutral-600">{status}</span>
        }
    }

    return (
        <div className="space-y-6">
            <PageHero
                title="Reservas de Stock"
                subtitle="Gestión de reservas de inventario para pedidos"
                chips={[
                    'Reservas activas',
                    'Historial de reservas',
                    'Control de stock',
                ]}
            />

            {error && (
                <Alert
                    type="error"
                    title="Error"
                    message={error}
                    onClose={() => setError(null)}
                />
            )}

            <div className="flex gap-2 mb-4">
                {['ALL', 'ACTIVE', 'CONFIRMED', 'CANCELLED'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === status
                            ? 'bg-brand-red text-white'
                            : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
                            }`}
                    >
                        {status === 'ALL' ? 'Todas' : status}
                    </button>
                ))}
            </div>

            {loading ? (
                <LoadingSpinner text="Cargando reservas..." />
            ) : reservations.length === 0 ? (
                <div className="bg-white rounded-xl border border-neutral-200 p-8">
                    <EmptyContent
                        icon={Package}
                        title="Sin reservas disponibles"
                        subtitle="No hay reservas registradas con el filtro seleccionado"
                    />
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                    <GenericDataTable
                        data={reservations}
                        columns={[
                            {
                                label: 'ID',
                                key: 'id',
                                render: (val: string) => <span className="font-mono text-xs text-neutral-600">#{val.slice(0, 8)}</span>
                            },
                            {
                                label: 'Estado',
                                key: 'status',
                                render: (val: string) => getStatusBadge(val)
                            },
                            {
                                label: 'Items',
                                key: 'items',
                                render: (val: any) => (
                                    <span className="text-sm text-neutral-900">
                                        {val?.length || 0} producto(s)
                                    </span>
                                )
                            },
                            {
                                label: 'Fecha',
                                key: 'createdAt',
                                render: (val: string) => new Date(val).toLocaleString('es-ES', {
                                    dateStyle: 'short',
                                    timeStyle: 'short'
                                })
                            },
                        ]}
                        showActions={true}
                        onDelete={(item: Reservation) => item.status === 'ACTIVE' ? handleCancel(item.id) : undefined}
                        emptyStateTitle="No hay reservas disponibles"
                        emptyStateDescription="No se encontraron reservas con el filtro seleccionado"
                    />
                </div>
            )}
        </div>
    )
}
