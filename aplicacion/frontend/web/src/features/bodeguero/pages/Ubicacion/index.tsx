import { useState, useEffect } from 'react'
import { PageHero } from '../../../../components/ui/PageHero'
import { GenericDataTable } from '../../../../components/ui/GenericDataTable'
import { Button } from '../../../../components/ui/Button'
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react'
import { Alert } from '../../../../components/ui/Alert'
import { Modal } from '../../../../components/ui/Modal'
import { ConfirmDialog } from '../../../../components/ui/ConfirmDialog'
import { useForm } from 'react-hook-form'
import { ubicacionesApi, Ubicacion, CreateUbicacionDto } from '../../services/ubicacionesApi'
import { almacenesApi, Almacen } from '../../services/almacenesApi'

export default function UbicacionPage() {
    const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingUbicacion, setEditingUbicacion] = useState<Ubicacion | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const fetchUbicaciones = async () => {
        setLoading(true)
        try {
            const data = await ubicacionesApi.getAll()
            setUbicaciones(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUbicaciones()
    }, [])

    const handleEdit = (item: Ubicacion) => {
        setEditingUbicacion(item)
        setIsModalOpen(true)
    }

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            await ubicacionesApi.delete(deleteId)
            setDeleteId(null)
            fetchUbicaciones()
        } catch (err: any) {
            setError(err.message || 'Error elimiando ubicación')
            setDeleteId(null)
        }
    }

    return (
        <div className="space-y-6">
            <PageHero
                title="Ubicaciones"
                subtitle="Gestión de espacios físicos de almacenamiento"
            />

            <div className="flex justify-end">
                <Button onClick={() => { setEditingUbicacion(null); setIsModalOpen(true) }} icon={Plus}>
                    Nueva Ubicación
                </Button>
            </div>

            {error && <div className="mb-4"><Alert type="error" title="Error" message={error} /></div>}

            <GenericDataTable
                data={ubicaciones}
                loading={loading}
                columns={[
                    { label: 'Código', key: 'codigoVisual' },
                    {
                        label: 'Almacén',
                        key: 'almacen',
                        render: (_, item: Ubicacion) => item.almacen?.nombre || 'N/A'
                    },
                    { label: 'Tipo', key: 'tipo' },
                    { label: 'Capacidad (Kg)', key: 'capacidadMaxKg' },
                    {
                        label: 'Estado',
                        key: 'esCuarentena',
                        render: (val, item: Ubicacion) => item.esCuarentena ?
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Cuarentena</span> :
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Activo</span>
                    },
                ]}
                onEdit={handleEdit}
                onDelete={(item) => setDeleteId(item.id)}
            />

            <UbicacionFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false)
                    fetchUbicaciones()
                }}
                ubicacion={editingUbicacion}
            />

            <ConfirmDialog
                open={!!deleteId}
                title="Eliminar Ubicación"
                description="¿Estás seguro de que deseas eliminar esta ubicación? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    )
}

function UbicacionFormModal({ isOpen, onClose, onSuccess, ubicacion }: { isOpen: boolean; onClose: () => void; onSuccess: () => void; ubicacion: Ubicacion | null }) {
    const { register, handleSubmit, reset, setValue } = useForm<CreateUbicacionDto>()
    const [almacenes, setAlmacenes] = useState<Almacen[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            almacenesApi.getAll().then(setAlmacenes)
            if (ubicacion) {
                setValue('almacenId', ubicacion.almacenId)
                setValue('codigoVisual', ubicacion.codigoVisual)
                setValue('tipo', ubicacion.tipo)
                setValue('capacidadMaxKg', ubicacion.capacidadMaxKg)
                setValue('esCuarentena', ubicacion.esCuarentena)
            } else {
                reset({
                    tipo: 'RACK',
                    esCuarentena: false
                })
            }
        }
    }, [isOpen, ubicacion])

    const onSubmit = async (data: CreateUbicacionDto) => {
        setLoading(true)
        setError(null)
        try {
            const payload = {
                ...data,
                almacenId: Number(data.almacenId),
                capacidadMaxKg: data.capacidadMaxKg ? Number(data.capacidadMaxKg) : undefined
            }

            if (ubicacion) {
                await ubicacionesApi.update(ubicacion.id, payload)
            } else {
                await ubicacionesApi.create(payload)
            }
            onSuccess()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={ubicacion ? 'Editar Ubicación' : 'Nueva Ubicación'} headerGradient="red">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && <div className="text-red-500 text-sm">{error}</div>}

                <div>
                    <label className="block text-sm font-medium text-gray-700">Almacén</label>
                    <select {...register('almacenId')} className="mt-1 block w-full border rounded-md px-3 py-2" required>
                        <option value="">Seleccionar Almacén</option>
                        {almacenes.map(a => (
                            <option key={a.id} value={a.id}>{a.nombre}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Código Visual</label>
                    <input type="text" {...register('codigoVisual')} className="mt-1 block w-full border rounded-md px-3 py-2" required placeholder="Ej. A-01-01" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo</label>
                        <select {...register('tipo')} className="mt-1 block w-full border rounded-md px-3 py-2">
                            <option value="RACK">Rack</option>
                            <option value="PISO">Piso</option>
                            <option value="ESTANTERIA">Estantería</option>
                            <option value="CAMARA_FRIA">Cámara Fría</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Capacidad (Kg)</label>
                        <input type="number" step="0.01" {...register('capacidadMaxKg')} className="mt-1 block w-full border rounded-md px-3 py-2" />
                    </div>
                </div>

                <div className="flex items-center">
                    <input type="checkbox" {...register('esCuarentena')} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                    <label className="ml-2 block text-sm text-gray-900">Es zona de cuarentena</label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={onClose} type="button">Cancelar</Button>
                    <Button type="submit" loading={loading}>{ubicacion ? 'Actualizar' : 'Guardar'}</Button>
                </div>
            </form>
        </Modal>
    )
}
