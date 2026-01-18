import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Package, Search } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { PageHero } from 'components/ui/PageHero'
import { Button } from 'components/ui/Button'
import { StatusBadge } from 'components/ui/StatusBadge'
import { GenericDataTable } from 'components/ui/GenericDataTable'
import { Alert } from 'components/ui/Alert'
import { ConfirmDialog } from 'components/ui/ConfirmDialog'
import { TextField } from 'components/ui/TextField'

import { almacenesApi, Almacen, CreateAlmacenDto, UpdateAlmacenDto } from '../../services/almacenesApi'
import { AlmacenFormModal } from '../../components/AlmacenFormModal'

export default function AlmacenesPage() {
    const [almacenes, setAlmacenes] = useState<Almacen[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedAlmacen, setSelectedAlmacen] = useState<Almacen | null>(null)
    const [actionLoading, setActionLoading] = useState(false)

    // Delete Dialog State
    const [deleteId, setDeleteId] = useState<number | null>(null)

    const fetchAlmacenes = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await almacenesApi.getAll()
            setAlmacenes(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar almacenes')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAlmacenes()
    }, [fetchAlmacenes])

    const handleCreate = async (data: CreateAlmacenDto | UpdateAlmacenDto) => {
        setActionLoading(true)
        setError(null)
        try {
            if (selectedAlmacen) {
                await almacenesApi.update(selectedAlmacen.id, data)
            } else {
                await almacenesApi.create(data as CreateAlmacenDto)
            }
            setIsModalOpen(false)
            fetchAlmacenes()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar almacén')
        } finally {
            setActionLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        setActionLoading(true)
        try {
            await almacenesApi.delete(deleteId)
            setDeleteId(null)
            fetchAlmacenes()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al eliminar almacén')
        } finally {
            setActionLoading(false)
        }
    }

    const openCreate = () => {
        setSelectedAlmacen(null)
        setIsModalOpen(true)
    }

    const openEdit = (almacen: Almacen) => {
        setSelectedAlmacen(almacen)
        setIsModalOpen(true)
    }

    const filtered = almacenes.filter(a =>
        a.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (a.codigoRef && a.codigoRef.toLowerCase().includes(search.toLowerCase()))
    )

    return (
        <div className="space-y-6">
            <PageHero
                title="Almacenes"
                subtitle="Gestión de almacenes y ubicaciones físicas"
                chips={[
                    'Almacenes',
                    'Gestión de espacios',
                    'Control de frío',
                ]}
            />

            {error && <Alert type="error" title="Error" message={error} onClose={() => setError(null)} />}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <SectionHeader title="Lista de Almacenes" subtitle={`${filtered.length} almacenes registrados`} />
                <div className="flex gap-2">
                    <div className='relative'>
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <input
                            className="h-10 rounded-lg border border-neutral-200 pl-9 pr-4 text-sm focus:border-brand-red focus:outline-none"
                            placeholder="Buscar almacén..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button onClick={openCreate} icon={Plus}>
                        Crear Almacén
                    </Button>
                </div>
            </div>

            <GenericDataTable
                data={filtered}
                columns={[
                    {
                        label: 'Nombre', key: 'nombre', render: (val, item) => (
                            <div className="flex items-center gap-2 font-medium">
                                <Package className="h-4 w-4 text-neutral-400" />
                                {item.nombre}
                            </div>
                        )
                    },
                    { label: 'Código', key: 'codigoRef', render: (val) => val || '---' },
                    { label: 'Dirección', key: 'direccionFisica', render: (val) => <span className="text-sm text-neutral-600 truncate max-w-[200px]">{val || 'No registrada'}</span> },
                    {
                        label: 'Tipo', key: 'requiereFrio', render: (val, item) => (
                            item.requiereFrio
                                ? <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">Refrigerado</span>
                                : <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600">Seco</span>
                        )
                    },
                    {
                        label: 'Estado', key: 'activo', render: (val, item) => (
                            <StatusBadge variant={item.activo ? 'success' : 'neutral'}>
                                {item.activo ? 'Activo' : 'Inactivo'}
                            </StatusBadge>
                        )
                    },
                ]}
                onEdit={openEdit}
                onDelete={(item) => setDeleteId(item.id)}
            />

            <AlmacenFormModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreate}
                initialData={selectedAlmacen}
                loading={actionLoading}
            />

            <ConfirmDialog
                open={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Eliminar Almacén"
                description="¿Estás seguro de eliminar este almacén? Esta acción no se puede deshacer si el almacén tiene movimientos asociados (se realizará un borrado lógico)."
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
            />
        </div>
    )
}
