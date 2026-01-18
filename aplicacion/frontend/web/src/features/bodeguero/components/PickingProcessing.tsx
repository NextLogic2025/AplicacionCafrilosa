import { useState, useEffect } from 'react'
import { ArrowLeft, CheckCircle, Package, AlertTriangle } from 'lucide-react'
import { Button } from 'components/ui/Button'
import { StatusBadge } from 'components/ui/StatusBadge'
import { Alert } from 'components/ui/Alert'
import { pickingApi, PickingOrden, PickingItem } from '../services/pickingApi'
import { Modal } from 'components/ui/Modal'
import { TextField } from 'components/ui/TextField'

interface Props {
    pickingId: number
    onBack: () => void
    onComplete: () => void
}

export function PickingProcessing({ pickingId, onBack, onComplete }: Props) {
    const [picking, setPicking] = useState<PickingOrden | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [pickModal, setPickModal] = useState<{ open: boolean, item: PickingItem | null }>({ open: false, item: null })
    const [pickQty, setPickQty] = useState('')

    const fetchDetails = async () => {
        setLoading(true)
        try {
            const data = await pickingApi.getById(pickingId)
            setPicking(data)
        } catch (err) {
            setError('Error al cargar detalles del picking')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDetails()
    }, [pickingId])

    const handlePickClick = (item: PickingItem) => {
        setPickQty(String(item.cantidadSolicitada - item.cantidadPickeada)) // Default to remaining
        setPickModal({ open: true, item })
    }

    const confirmPick = async () => {
        if (!pickModal.item || !picking) return
        try {
            await pickingApi.pickItem(picking.id, pickModal.item.id, {
                cantidadPickeada: Number(pickQty)
            })
            setPickModal({ open: false, item: null })
            fetchDetails() // Refresh to see updates
        } catch (err: any) {
            alert('Error al registrar pickeo: ' + err.message)
        }
    }

    const handleCompleteOrder = async () => {
        if (!picking) return
        const unpicked = picking.items?.some(i => i.cantidadPickeada < i.cantidadSolicitada)
        if (unpicked && !window.confirm('Hay items incompletos. ¿Seguro que desea completar la orden?')) {
            return
        }

        try {
            await pickingApi.completePicking(picking.id)
            onComplete()
        } catch (err: any) {
            alert('Error al completar orden: ' + err.message)
        }
    }

    if (loading) return <div className="p-8 text-center">Cargando detalles...</div>
    if (!picking) return <div className="p-8 text-red-600">No se encontró la orden</div>

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" icon={ArrowLeft} onClick={onBack} />
                    <div>
                        <h2 className="text-lg font-bold text-neutral-900">Picking #{picking.id}</h2>
                        <p className="text-sm text-neutral-500">Pedido REF: {picking.pedidoId}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <StatusBadge variant="warning">{picking.estado}</StatusBadge>
                    <Button
                        variant="primary"
                        icon={CheckCircle}
                        onClick={handleCompleteOrder}
                        disabled={picking.estado === 'COMPLETADO'}
                    >
                        Completar Orden
                    </Button>
                </div>
            </div>

            {error && <Alert type="error" title="Error" message={error} onClose={() => setError(null)} />}

            {/* Items List */}
            <div className="grid gap-4">
                {picking.items?.map(item => {
                    const progress = item.cantidadSolicitada > 0 ? (item.cantidadPickeada / item.cantidadSolicitada) * 100 : 0
                    const isComplete = item.cantidadPickeada >= item.cantidadSolicitada

                    return (
                        <div key={item.id} className={`bg-white p-4 rounded-xl border ${isComplete ? 'border-green-200 bg-green-50' : 'border-neutral-200'} shadow-sm flex justify-between items-center`}>
                            <div className="flex gap-4 items-center">
                                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${isComplete ? 'bg-green-100 text-green-600' : 'bg-brand-red/10 text-brand-red'}`}>
                                    <Package size={24} />
                                </div>
                                <div>
                                    <p className="font-medium text-neutral-900">Item #{item.id} (Prod ID: {item.productoId})</p>
                                    <p className="text-sm text-neutral-500">
                                        Solicitado: <span className="font-bold">{item.cantidadSolicitada}</span> |
                                        Ubicación Sugerida: {item.ubicacionOrigenSugerida || 'N/A'}
                                    </p>
                                    {/* Progress Bar */}
                                    <div className="mt-2 w-48 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${isComplete ? 'bg-green-500' : 'bg-brand-red'}`} style={{ width: `${progress}%` }} />
                                    </div>
                                    <p className="text-xs text-neutral-400 mt-1">{item.cantidadPickeada} pickeados</p>
                                </div>
                            </div>

                            {!isComplete && (
                                <Button onClick={() => handlePickClick(item)} variant="outline">
                                    Registrar
                                </Button>
                            )}
                            {isComplete && <CheckCircle className="text-green-500" />}
                        </div>
                    )
                })}
            </div>

            {/* Pick Modal */}
            <Modal
                isOpen={pickModal.open}
                onClose={() => setPickModal({ open: false, item: null })}
                title="Registrar Pickeo"
                headerGradient="red"
            >
                <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Producto ID: {pickModal.item?.productoId}</p>
                        <p className="font-bold text-lg">{pickModal.item?.cantidadPickeada} / {pickModal.item?.cantidadSolicitada} Unds</p>
                    </div>

                    <TextField
                        label="Cantidad a confirmar"
                        type="number"
                        value={pickQty}
                        onChange={(e) => setPickQty(e.target.value)}
                        autoFocus
                    />

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" onClick={() => setPickModal({ open: false, item: null })}>Cancelar</Button>
                        <Button variant="primary" onClick={confirmPick}>Confirmar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
