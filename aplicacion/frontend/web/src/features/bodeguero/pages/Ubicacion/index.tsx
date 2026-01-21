import { useState, useEffect } from 'react'
import { PageHero } from '../../../../components/ui/PageHero'
import { GenericDataTable } from '../../../../components/ui/GenericDataTable'
import { Button } from '../../../../components/ui/Button'
import { TextField } from '../../../../components/ui/TextField'
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
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    )
}

function UbicacionFormModal({ isOpen, onClose, onSuccess, ubicacion }: { isOpen: boolean; onClose: () => void; onSuccess: () => void; ubicacion: Ubicacion | null }) {
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateUbicacionDto>()
    const [almacenes, setAlmacenes] = useState<Almacen[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        almacenId: '',
        codigoVisual: '',
        tipo: 'RACK',
        capacidadMaxKg: '',
        esCuarentena: false
    })

    useEffect(() => {
        if (isOpen) {
            almacenesApi.getAll().then(setAlmacenes)
            if (ubicacion) {
                setFormData({
                    almacenId: String(ubicacion.almacenId),
                    codigoVisual: ubicacion.codigoVisual,
                    tipo: ubicacion.tipo,
                    capacidadMaxKg: String(ubicacion.capacidadMaxKg || ''),
                    esCuarentena: ubicacion.esCuarentena
                })
            } else {
                setFormData({
                    almacenId: '',
                    codigoVisual: '',
                    tipo: 'RACK',
                    capacidadMaxKg: '',
                    esCuarentena: false
                })
            }
        }
    }, [isOpen, ubicacion])

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            if (ubicacion) {
                // When updating, don't send almacenId as it cannot be changed
                const payload = {
                    codigoVisual: formData.codigoVisual,
                    tipo: formData.tipo as any,
                    capacidadMaxKg: formData.capacidadMaxKg ? Number(formData.capacidadMaxKg) : undefined,
                    esCuarentena: formData.esCuarentena
                }
                await ubicacionesApi.update(ubicacion.id, payload)
            } else {
                // When creating, include almacenId
                const payload = {
                    almacenId: Number(formData.almacenId),
                    codigoVisual: formData.codigoVisual,
                    tipo: formData.tipo as any,
                    capacidadMaxKg: formData.capacidadMaxKg ? Number(formData.capacidadMaxKg) : undefined,
                    esCuarentena: formData.esCuarentena
                }
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
        <Modal isOpen={isOpen} onClose={onClose} title={ubicacion ? 'Editar Ubicación' : 'Nueva Ubicación'} headerGradient="red" maxWidth="md">
            <form onSubmit={onSubmit} className="space-y-4">
                {error && <Alert type="error" message={error} />}

                <div className="grid gap-2">
                    <label className="text-xs text-neutral-600">Almacén</label>
                    <select
                        value={formData.almacenId}
                        onChange={(e) => setFormData({ ...formData, almacenId: e.target.value })}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]"
                        required
                    >
                        <option value="">Seleccionar Almacén</option>
                        {almacenes.map(a => (
                            <option key={a.id} value={a.id}>{a.nombre}</option>
                        ))}
                    </select>
                </div>

                <TextField
                    label="Código Visual"
                    tone="light"
                    type="text"
                    placeholder="Ej: A-01-01"
                    value={formData.codigoVisual}
                    onChange={(e) => setFormData({ ...formData, codigoVisual: e.target.value })}
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <label className="text-xs text-neutral-600">Tipo</label>
                        <select
                            value={formData.tipo}
                            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]"
                        >
                            <option value="RACK">Rack</option>
                            <option value="PISO">Piso</option>
                            <option value="ESTANTERIA">Estantería</option>
                            <option value="CAMARA_FRIA">Cámara Fría</option>
                        </select>
                    </div>
                    <TextField
                        label="Capacidad (Kg)"
                        tone="light"
                        type="number"
                        step="0.01"
                        placeholder="Opcional"
                        value={formData.capacidadMaxKg}
                        onChange={(e) => setFormData({ ...formData, capacidadMaxKg: e.target.value })}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={formData.esCuarentena}
                        onChange={(e) => setFormData({ ...formData, esCuarentena: e.target.checked })}
                        className="h-4 w-4 rounded border-neutral-300 text-brand-red focus:ring-brand-red"
                    />
                    <label className="text-sm text-neutral-700">Es zona de cuarentena</label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        onClick={onClose}
                        className="bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        className="bg-brand-red text-white hover:bg-brand-red/90 disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : (ubicacion ? 'Actualizar' : 'Guardar')}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
