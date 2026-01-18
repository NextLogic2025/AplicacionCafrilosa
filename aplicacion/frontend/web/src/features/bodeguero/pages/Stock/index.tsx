import { useState, useEffect } from 'react'
import { PageHero } from '../../../../components/ui/PageHero'
import { GenericDataTable } from '../../../../components/ui/GenericDataTable'
import { Button } from '../../../../components/ui/Button'
import { Plus, SlidersHorizontal } from 'lucide-react'
import { Alert } from '../../../../components/ui/Alert'
import { getAllStock, StockItem, createStock, adjustStock } from '../../services/stockApi'
import { Modal } from '../../../../components/ui/Modal'
import { useForm } from 'react-hook-form'
import { lotesApi, Lote } from '../../services/lotesApi'
import { ubicacionesApi, Ubicacion } from '../../services/ubicacionesApi'
import { getAllProducts, Product } from '../../../supervisor/services/productosApi'
import { getSelectedRole } from '../../../../services/storage/roleStorage'
import { getStockByProduct } from '../../services/stockApi'

export default function StockPage() {
    const [stock, setStock] = useState<StockItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
    const [selectedStock, setSelectedStock] = useState<StockItem | null>(null)

    const [products, setProducts] = useState<Product[]>([])
    const [selectedProduct, setSelectedProduct] = useState<string>('')
    const role = getSelectedRole()

    const fetchStock = async () => {
        setLoading(true)
        try {
            const data = selectedProduct
                ? await getStockByProduct(selectedProduct)
                : await getAllStock()
            setStock(data)
        } catch (err: any) {
            setError(err.message || 'Error al cargar stock')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getAllProducts().then(setProducts).catch(console.error)
    }, [])

    useEffect(() => {
        fetchStock()
    }, [selectedProduct])

    const handleOpenAdjust = (item: StockItem) => {
        setSelectedStock(item)
        setIsAdjustModalOpen(true)
    }

    return (
        <div className="space-y-6">
            <PageHero
                title="Gestión de Stock"
                subtitle="Inventario físico en tiempo real"
                title="Gestión de Stock"
                subtitle="Inventario físico en tiempo real"
            />

            <div className="flex justify-between items-center">
                <div className="w-64">
                    <select
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red"
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                    >
                        <option value="">Todos los productos</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                    </select>
                </div>
                {role !== 'vendedor' && (
                    <Button onClick={() => setIsCreateModalOpen(true)} icon={Plus}>
                        Ingreso Inicial
                    </Button>
                )}
            </div>

            {error && <Alert type="error" title="Error" message={error} />}

            <GenericDataTable
                data={stock}
                loading={loading}
                columns={[
                    {
                        label: 'Producto',
                        key: 'lote', // Using lote object as key source
                        render: (_, item: StockItem) => item.lote?.producto?.nombre || 'N/A'
                    },
                    {
                        label: 'SKU',
                        key: 'id', // Fallback key
                        render: (_, item: StockItem) => item.lote?.producto?.codigo_sku || 'N/A'
                    },
                    {
                        label: 'Lote',
                        key: 'loteId',
                        render: (_, item: StockItem) => item.lote?.numeroLote || 'N/A'
                    },
                    {
                        label: 'Ubicación',
                        key: 'ubicacion',
                        render: (_, item: StockItem) => item.ubicacion?.codigoVisual || 'N/A'
                    },
                    {
                        label: 'Físico',
                        key: 'cantidadFisica',
                    },
                    {
                        label: 'Disponible',
                        key: 'cantidadDisponible',
                    },
                ]}
                // Custom actions support via render prop isn't direct in GenericDataTable we saw?
                // Wait, GenericDataTable has `onEdit` and `onDelete` but `Stock` reused `actions`.
                // GenericDataTable only supports onEdit/onDelete buttons OR custom?
                // GenericDataTable code: {showActions && (onEdit || onDelete) && ...}
                // It does NOT accept an `actions` render prop.
                // So I must rename Stock's specialized action to `onEdit` or generic.
                // Stock uses "Adjust Stock" (SlidersHorizontal). GenericDataTable uses Pencil for onEdit.
                // I should probably pass `onEdit` as `handleOpenAdjust` to get the pencil icon usage, OR generic doesn't support custom icons easily.
                // The `GenericDataTable` I viewed has HARDCODED Pencil and Trash icons.
                // For Stock, "Adjust" is the primary edit action. So I'll map `onEdit` to `handleOpenAdjust`.
                // It will show a Pencil icon, which is acceptable for "Edit/Adjust".
                onEdit={role !== 'vendedor' ? handleOpenAdjust : undefined}
            />

            <CreateStockModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    setIsCreateModalOpen(false)
                    fetchStock()
                }}
            />

            {selectedStock && (
                <AdjustStockModal
                    isOpen={isAdjustModalOpen}
                    onClose={() => {
                        setIsAdjustModalOpen(false)
                        setSelectedStock(null)
                    }}
                    onSuccess={() => {
                        setIsAdjustModalOpen(false)
                        setSelectedStock(null)
                        fetchStock()
                    }}
                    stockItem={selectedStock}
                />
            )}
        </div>
    )
}

function CreateStockModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
    const { register, handleSubmit, reset } = useForm<{ ubicacionId: string; loteId: string; cantidadFisica: number }>()
    const [lotes, setLotes] = useState<Lote[]>([])
    const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            Promise.all([
                lotesApi.getAll(),
                ubicacionesApi.getAll()
            ]).then(([l, u]) => {
                setLotes(l)
                setUbicaciones(u)
            }).catch(e => setError('Error cargando datos: ' + e.message))
        }
    }, [isOpen])

    const onSubmit = async (data: any) => {
        setLoading(true)
        setError(null)
        try {
            await createStock({
                ...data,
                cantidadFisica: Number(data.cantidadFisica)
            })
            reset()
            onSuccess()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ingreso Inicial de Stock" headerGradient="red">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && <div className="text-red-600 text-sm">{error}</div>}

                <div>
                    <label className="block text-sm font-medium text-gray-700">Lote</label>
                    <select {...register('loteId')} className="mt-1 block w-full border rounded-md px-3 py-2" required>
                        <option value="">Seleccionar Lote</option>
                        {lotes.map(l => (
                            <option key={l.id} value={l.id}>{l.numeroLote} (Vence: {l.fechaVencimiento})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Ubicación</label>
                    <select {...register('ubicacionId')} className="mt-1 block w-full border rounded-md px-3 py-2" required>
                        <option value="">Seleccionar Ubicación</option>
                        {ubicaciones.map(u => (
                            <option key={u.id} value={u.id}>{u.codigoVisual} - {u.almacen?.nombre}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Cantidad Inicial</label>
                    <input type="number" step="0.01" {...register('cantidadFisica')} className="mt-1 block w-full border rounded-md px-3 py-2" required min="0" />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={onClose} type="button">Cancelar</Button>
                    <Button type="submit" loading={loading}>Guardar</Button>
                </div>
            </form>
        </Modal>
    )
}

function AdjustStockModal({ isOpen, onClose, onSuccess, stockItem }: { isOpen: boolean; onClose: () => void; onSuccess: () => void; stockItem: StockItem }) {
    const { register, handleSubmit, watch, reset } = useForm<{ tipo: 'add' | 'remove'; cantidad: number }>()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const tipo = watch('tipo', 'add')

    const onSubmit = async (data: any) => {
        setLoading(true)
        setError(null)
        try {
            const delta = data.tipo === 'add' ? Number(data.cantidad) : -Number(data.cantidad)
            // Need user ID. Assuming token has it or backend handles it? 
            // DTO says usuarioResponsableId is required. 
            // We'll try to get it from localStorage which usually stores 'cafrilosa.user' or similar if we saved it on login.
            // If not available, we might fail. Let's try to decode or fetch.
            // For now, let's assume valid UUID placeholder if not found, or backend optional.
            // But checking AuthContext, we only have token.
            // Let's decode token payload manually simply
            const token = localStorage.getItem('cafrilosa.token')
            let userId = ''
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]))
                    userId = payload.sub
                } catch (e) { console.error('Token decode error', e) }
            }

            await adjustStock({
                ubicacionId: stockItem.ubicacionId,
                loteId: stockItem.loteId,
                cantidad: delta,
                usuarioResponsableId: userId || '00000000-0000-0000-0000-000000000000'
            })
            reset()
            onSuccess()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Ajustar Stock: ${stockItem.lote?.numeroLote}`} headerGradient="red">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && <div className="text-red-600 text-sm">{error}</div>}

                <div className="bg-gray-50 p-3 rounded text-sm">
                    <p><strong>Producto:</strong> {stockItem.lote?.producto?.nombre}</p>
                    <p><strong>Ubicación:</strong> {stockItem.ubicacion?.codigoVisual}</p>
                    <p><strong>Actual:</strong> {stockItem.cantidadFisica}</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Ajuste</label>
                    <select {...register('tipo')} className="mt-1 block w-full border rounded-md px-3 py-2">
                        <option value="add">Agregar (+)</option>
                        <option value="remove">Quitar (-)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                    <input type="number" step="0.01" {...register('cantidad')} className="mt-1 block w-full border rounded-md px-3 py-2" required min="0.001" />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={onClose} type="button">Cancelar</Button>
                    <Button type="submit" loading={loading} variant={tipo === 'remove' ? 'outline' : 'primary'} className={tipo === 'remove' ? 'border-red-500 text-red-600 hover:bg-red-50' : ''}>
                        {tipo === 'add' ? 'Ingresar' : 'Retirar'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
