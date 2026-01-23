import { useState, useEffect } from 'react'
import { Modal } from 'components/ui/Modal'
import { TextField } from 'components/ui/TextField'
import { Alert } from 'components/ui/Alert'
import { Button } from 'components/ui/Button'
import { Lote, CreateLoteDto, UpdateLoteDto } from '../../services/lotesApi'
import { getAllProducts, Product } from '../../supervisor/services/productosApi'

interface Props {
    open: boolean
    onClose: () => void
    onSubmit: (data: CreateLoteDto | UpdateLoteDto) => Promise<void>
    initialData?: Lote | null
    loading?: boolean
}

export function LoteFormModal({ open, onClose, onSubmit, initialData, loading }: Props) {
    const isEdit = !!initialData
    const [formData, setFormData] = useState<Partial<CreateLoteDto>>({})
    const [error, setError] = useState<string | null>(null)

    // Products for dropdown
    const [productos, setProductos] = useState<Product[]>([])

    useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData({
                    productoId: initialData.productoId,
                    numeroLote: initialData.numeroLote,
                    fechaFabricacion: initialData.fechaFabricacion,
                    fechaVencimiento: initialData.fechaVencimiento,
                    estadoCalidad: initialData.estadoCalidad
                })
            } else {
                setFormData({
                    estadoCalidad: 'LIBERADO'
                })
            }
            setError(null)
            loadProductos()
        }
    }, [open, initialData])

    const loadProductos = async () => {
        try {
            const data = await getAllProducts()
            setProductos(data)
        } catch (err) {
            console.error("Error loading products", err)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        try {
            if (isEdit) {
                // On Edit, only send UpdateLoteDto fields
                const updatePayload: UpdateLoteDto = {
                    fechaVencimiento: formData.fechaVencimiento,
                    estadoCalidad: formData.estadoCalidad
                }
                await onSubmit(updatePayload)
            } else {
                await onSubmit(formData as CreateLoteDto)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar')
        }
    }

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            title={isEdit ? 'Editar Lote' : 'Registrar Nuevo Lote'}
            maxWidth="md"
            headerGradient="red"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

                <div className="grid grid-cols-1 gap-4">
                    {!isEdit ? (
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-neutral-700">Producto</label>
                            <select
                                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                                value={formData.productoId || ''}
                                onChange={(e) => setFormData((prev: Partial<CreateLoteDto>) => ({ ...prev, productoId: e.target.value }))}
                                required
                            >
                                <option value="">Seleccione un producto</option>
                                {productos.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre} ({p.codigoSku})</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <TextField
                            label="ID Producto"
                            name="productoId"
                            value={formData.productoId || ''}
                            disabled
                            tone="light"
                        />
                    )}

                    <TextField
                        label="Número de Lote"
                        name="numeroLote"
                        value={formData.numeroLote || ''}
                        onChange={(e) => setFormData((prev: Partial<CreateLoteDto>) => ({ ...prev, numeroLote: e.target.value }))}
                        placeholder="Ej: LAT-2025-001"
                        required
                        disabled={isEdit}
                        tone="light"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <TextField
                            label="Fecha Fabricación"
                            name="fechaFabricacion"
                            type="date"
                            value={formData.fechaFabricacion ? new Date(formData.fechaFabricacion).toISOString().split('T')[0] : ''}
                            onChange={(e) => setFormData((prev: Partial<CreateLoteDto>) => ({ ...prev, fechaFabricacion: e.target.value }))}
                            required
                            disabled={isEdit}
                            tone="light"
                        />
                        <TextField
                            label="Fecha Vencimiento"
                            name="fechaVencimiento"
                            type="date"
                            value={formData.fechaVencimiento ? new Date(formData.fechaVencimiento).toISOString().split('T')[0] : ''}
                            onChange={(e) => setFormData((prev: Partial<CreateLoteDto>) => ({ ...prev, fechaVencimiento: e.target.value }))}
                            required
                            tone="light"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-neutral-700">Estado de Calidad</label>
                        <select
                            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                            value={formData.estadoCalidad || 'LIBERADO'}
                            onChange={(e) => setFormData((prev: Partial<CreateLoteDto>) => ({ ...prev, estadoCalidad: e.target.value }))}
                        >
                            <option value="LIBERADO">Liberado</option>
                            <option value="CUARENTENA">Cuarentena</option>
                            <option value="RECHAZADO">Rechazado</option>
                        </select>
                    </div>

                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        onClick={onClose}
                        className="bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        className="bg-brand-red text-white"
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear')}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
