import { useState, useEffect } from 'react'
import { PackagePlus, Filter, RefreshCw, ClipboardList, Box } from 'lucide-react'
import { PageHero } from 'components/ui/PageHero'
import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { Button } from 'components/ui/Button'
import { GenericDataTable } from 'components/ui/GenericDataTable'
import { StatusBadge } from 'components/ui/StatusBadge'
import { Alert } from 'components/ui/Alert'
import { pickingApi, PickingOrden } from '../../services/pickingApi'
import { PickingProcessing } from '../../components/PickingProcessing'

export default function PickingPage() {
    const [tasks, setTasks] = useState<PickingOrden[]>([])
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Filters
    const [activeTab, setActiveTab] = useState<'ALL' | 'MY_TASKS'>('ALL')
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ASIGNADO' | 'EN_PROCESO' | 'COMPLETADO'>('ALL')

    const fetchTasks = async () => {
        setLoading(true)
        setError(null)
        try {
            let data: PickingOrden[]
            if (activeTab === 'MY_TASKS') {
                data = await pickingApi.getMyTasks()
            } else {
                // Backend expects 'estado' query param
                data = await pickingApi.getAllOrders(statusFilter === 'ALL' ? undefined : statusFilter)
            }
            setTasks(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar tareas de picking')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTasks()
    }, [activeTab, statusFilter])

    const handleStart = async (id: number) => {
        try {
            await pickingApi.startPicking(id)
            fetchTasks()
            setSelectedTaskId(id)
        } catch (err) {
            setError('Error al iniciar picking')
        }
    }

    const handleTomarPedido = async (id: number) => {
        try {
            setError(null)
            await pickingApi.tomarPedido(id)

            // Cambiar a tab "Mis Asignaciones"
            setActiveTab('MY_TASKS')

            // Refrescar datos
            await fetchTasks()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al tomar el pedido')
        }
    }



    return (
        <div className="space-y-6">
            <PageHero
                title="Tablero de Picking"
                subtitle="Gestión y ejecución de tareas de preparación"
                chips={['Tareas Pendientes', 'Mis Asignaciones', 'Historial']}
            />

            {error && <Alert type="error" title="Error" message={error} onClose={() => setError(null)} />}

            {selectedTaskId ? (
                <PickingProcessing
                    pickingId={selectedTaskId}
                    onBack={() => {
                        setSelectedTaskId(null)
                        fetchTasks()
                    }}
                    onComplete={() => {
                        setSelectedTaskId(null)
                        fetchTasks()
                        // Optional: Show success message/toast
                    }}
                />
            ) : (
                <div className="flex flex-col gap-4">
                    {/* Tabs & Controls */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 pb-4">
                        <div className="flex gap-2 p-1 bg-neutral-100 rounded-lg">
                            <button
                                onClick={() => setActiveTab('ALL')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'ALL' ? 'bg-white shadow-sm text-brand-red' : 'text-neutral-600 hover:text-neutral-900'}`}
                            >
                                Todas las Ordenes
                            </button>
                            <button
                                onClick={() => setActiveTab('MY_TASKS')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'MY_TASKS' ? 'bg-white shadow-sm text-brand-red' : 'text-neutral-600 hover:text-neutral-900'}`}
                            >
                                Mis Asignaciones
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                className="h-10 rounded-lg border border-neutral-200 pl-3 pr-8 text-sm focus:border-brand-red focus:outline-none bg-white"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                            >
                                <option value="ALL">Todos los Estados</option>
                                <option value="ASIGNADO">Asignado</option>
                                <option value="EN_PROCESO">En Proceso</option>
                                <option value="COMPLETADO">Completados</option>
                            </select>
                            <Button variant="ghost" icon={RefreshCw} onClick={fetchTasks} title="Actualizar" />
                        </div>
                    </div>

                    <GenericDataTable
                        data={tasks}
                        loading={loading}
                        emptyStateIcon={<PackagePlus className="h-12 w-12 text-neutral-300" />}
                        emptyStateTitle="No hay tareas de picking"
                        emptyStateDescription={activeTab === 'MY_TASKS' ? "No tienes tareas asignadas." : "No hay órdenes pendientes en este momento."}
                        columns={[
                            { label: 'Picking ID', key: 'pickingId', render: (val, item) => <span className="font-mono font-bold text-neutral-900">PCK-{String(item.id).substring(0, 8)}...</span> },
                            { label: 'Pedido Ref', key: 'pedidoId', render: (val) => <span className="font-medium text-neutral-600">PED-{String(val).substring(0, 8)}...</span> },
                            // Note: Client name currently not available in PickingOrden list endpoint
                            {
                                label: 'Prioridad',
                                key: 'prioridad',
                                render: (val) => {
                                    const prioridadMap: Record<number, { label: string; color: string }> = {
                                        1: { label: 'Alta', color: 'text-red-600 bg-red-50 border-red-200' },
                                        2: { label: 'Media', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
                                        3: { label: 'Baja', color: 'text-green-600 bg-green-50 border-green-200' }
                                    }
                                    const prioridad = prioridadMap[val as number] || { label: `Prioridad ${val}`, color: 'text-neutral-600 bg-neutral-50 border-neutral-200' }
                                    return (
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${prioridad.color}`}>
                                            {prioridad.label}
                                        </span>
                                    )
                                }
                            },
                            {
                                label: 'Estado', key: 'estado', render: (val) => {
                                    const map = {
                                        ASIGNADO: { variant: 'neutral' as const, label: 'Asignado' },
                                        PENDIENTE: { variant: 'neutral' as const, label: 'Pendiente' },
                                        EN_PROCESO: { variant: 'warning' as const, label: 'En Picking' },
                                        COMPLETADO: { variant: 'success' as const, label: 'Completado' }
                                    }
                                    const estado = map[val as keyof typeof map] || { variant: 'neutral' as const, label: val }
                                    return <StatusBadge variant={estado.variant}>{estado.label}</StatusBadge>
                                }
                            },
                            { label: 'Fecha Asignada', key: 'createdAt', render: (val) => new Date(val).toLocaleDateString() },
                            {
                                label: 'Acciones', key: 'id', render: (val, item) => (
                                    <div className="flex gap-2">
                                        {activeTab === 'MY_TASKS' ? (
                                            <Button size="sm" variant="primary" onClick={() => setSelectedTaskId(val)}>Ver</Button>
                                        ) : (
                                            <>
                                                {(item.estado === 'ASIGNADO' || item.estado === 'PENDIENTE') && (
                                                    <Button size="sm" variant="primary" onClick={() => handleTomarPedido(val)}>Tomar</Button>
                                                )}
                                                {item.estado === 'EN_PROCESO' && (
                                                    <Button size="sm" variant="primary" onClick={() => setSelectedTaskId(val)}>Continuar</Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )
                            }
                        ]}
                    />
                </div>
            )}
        </div>
    )
}
