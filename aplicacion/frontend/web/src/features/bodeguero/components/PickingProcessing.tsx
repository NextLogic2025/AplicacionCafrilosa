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

    const [pickReason, setPickReason] = useState('')
    const [pickNote, setPickNote] = useState('')

    // Alternative lots state
    const [showAltModal, setShowAltModal] = useState(false)
    const [alternatives, setAlternatives] = useState<any[]>([])
    const [loadingAlt, setLoadingAlt] = useState(false)
    const [overrideLot, setOverrideLot] = useState<{ id: number, numero: string, ubicacionId: number, ubicacionLabel: string } | null>(null)

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
        setPickQty(String(Math.floor(item.cantidadPickeada))) // Start with integer part of current picked amount
        setPickReason('')
        setPickNote('')
        setOverrideLot(null) // Reset override
        setPickModal({ open: true, item })
    }

    // ... (keep fetchAlternatives and selectAlternative as is)

    // ... (inside confirmPick, verification is good, leaving it)

    // ... (inside JSX)
    // ... (keep fetchAlternatives and selectAlternative as is)

    const fetchAlternatives = async () => {
        if (!pickModal.item) return
        setLoadingAlt(true)
        try {
            const stocks = await pickingApi.getStocks(pickModal.item.productoId)
            setAlternatives(stocks)
            setShowAltModal(true)
        } catch (err) {
            alert('Error al cargar stocks alternativos')
        } finally {
            setLoadingAlt(false)
        }
    }

    const selectAlternative = (alt: any) => {
        setOverrideLot({
            id: alt.lote.id,
            numero: alt.lote.numeroLote,
            ubicacionId: alt.ubicacion.id,
            ubicacionLabel: alt.ubicacion.codigoVisual
        })
        setShowAltModal(false)
    }

    const confirmPick = async () => {
        if (!pickModal.item || !picking) return
        const targetQty = Number(pickQty)

        if (targetQty > pickModal.item.cantidadSolicitada) {
            alert(`No puedes ingresar más de lo solicitado (${pickModal.item.cantidadSolicitada} Unds).`)
            return
        }

        if (targetQty < 0) {
            alert('La cantidad no puede ser negativa.')
            return
        }

        if (!Number.isInteger(targetQty)) {
            alert('La cantidad debe ser un número entero.')
            return
        }

        // Validate deviation reason if incomplete
        if (targetQty < pickModal.item.cantidadSolicitada && !pickReason) {
            alert('Debes indicar un motivo de desviación si la cantidad es menor a la solicitada.')
            return
        }

        const currentQty = pickModal.item.cantidadPickeada
        const delta = targetQty - currentQty

        if (delta === 0) {
            setPickModal({ open: false, item: null })
            return
        }

        try {
            const payload = {
                cantidadPickeada: delta,
                motivo_desviacion: pickReason || undefined,
                nota_bodeguero: pickNote || undefined,
                loteConfirmado: overrideLot ? String(overrideLot.id) : undefined,
                ubicacion_confirmada: overrideLot ? String(overrideLot.ubicacionId) : undefined
            };
            console.log('FRONTEND PickingProcessing - confirmPick Payload:', payload);

            await pickingApi.pickItem(picking.id, pickModal.item.id, payload)
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
            <div className="flex items-center justify-between bg-white  rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-4 p-4 flex-1">
                    <Button variant="ghost" icon={ArrowLeft} onClick={onBack} />
                    <div>
                        <h2 className="text-lg font-bold text-neutral-900">Picking #{String(picking.id).substring(0, 8)}...</h2>
                        <p className="text-sm text-neutral-500">Pedido REF: {String(picking.pedidoId).substring(0, 8)}...</p>
                    </div>
                </div>
                <div className="flex gap-3 p-4 bg-gray-50 h-full items-center">
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
            <div className="space-y-3">
                {picking.items?.map(item => {
                    const isComplete = item.cantidadPickeada >= item.cantidadSolicitada

                    // Logic to extract readable location
                    let locationLabel = 'N/A'
                    if (item.ubicacionSugerida) {
                        if (typeof item.ubicacionSugerida === 'object') {
                            locationLabel = item.ubicacionSugerida.codigoVisual
                        } else {
                            locationLabel = String(item.ubicacionSugerida)
                        }
                    }

                    const productName = item.nombreProducto || `Producto ${item.productoId}`

                    const handleQuickPick = async () => {
                        if (isComplete) return // Already done
                        const remaining = item.cantidadSolicitada - item.cantidadPickeada
                        try {
                            await pickingApi.pickItem(picking.id, item.id, {
                                cantidadPickeada: remaining
                            })
                            fetchDetails()
                        } catch (err: any) {
                            alert('Error: ' + err.message)
                        }
                    }


                    const remaining = item.cantidadSolicitada - item.cantidadPickeada

                    return (
                        <div
                            key={item.id}
                            className={`bg-white p-4 rounded-xl border ${isComplete ? 'border-green-200 bg-green-50/50' : 'border-neutral-200'} shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between transition-all gap-4`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 ${isComplete ? 'bg-green-100 text-green-600' : 'bg-neutral-100 text-neutral-500'}`}>
                                    <Package size={24} />
                                </div>
                                <div>
                                    <p className="font-semibold text-neutral-900 text-lg">
                                        {productName}
                                    </p>
                                    <p className="text-sm text-neutral-600">
                                        Ubicación: <span className="font-mono bg-neutral-100 px-1 rounded font-bold text-neutral-700">{locationLabel}</span>
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-sm text-neutral-500">
                                            Progreso: <span className="font-bold text-neutral-900">{item.cantidadPickeada}</span> / {item.cantidadSolicitada} Unds
                                        </p>
                                        {remaining > 0 && (
                                            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">
                                                Faltan {remaining}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                {isComplete ? (
                                    <div className="flex items-center gap-2">
                                        <StatusBadge variant="success">Completado</StatusBadge>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handlePickClick(item)}
                                            title="Corregir cantidad"
                                        >
                                            Editar
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="flex-1 sm:flex-none"
                                            onClick={handleQuickPick}
                                            title={`Confirmar restantes (${remaining})`}
                                        >
                                            Todo ({remaining})
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 sm:flex-none"
                                            onClick={() => handlePickClick(item)}
                                        >
                                            Manual...
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Pick Modal */}
            <Modal
                isOpen={pickModal.open}
                onClose={() => setPickModal({ open: false, item: null })}
                title={`Registrar Pickeo: ${pickModal.item?.nombreProducto || 'Producto'}`}
                headerGradient="red"
            >
                <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Solicitado</p>
                            <p className="font-bold text-xl">{pickModal.item?.cantidadSolicitada}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Ya Pickeado</p>
                            <p className="font-bold text-xl text-blue-600">{pickModal.item?.cantidadPickeada}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Faltan</p>
                            <p className="font-bold text-xl text-orange-600">{(pickModal.item?.cantidadSolicitada || 0) - (pickModal.item?.cantidadPickeada || 0)}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex gap-2 items-end">
                                <TextField
                                    label="Cantidad Total Recogida"
                                    type="number"
                                    step="1"
                                    value={pickQty}
                                    onChange={(e) => {
                                        const val = e.target.value
                                        // Only allow digits (and empty string)
                                        if (val === '' || /^\d+$/.test(val)) {
                                            setPickQty(val)
                                        }
                                    }}
                                    autoFocus
                                    className="flex-1 text-lg font-bold"
                                />
                                <Button
                                    variant="secondary"
                                    className="mb-0.5 h-10"
                                    onClick={() => {
                                        if (pickModal.item) {
                                            setPickQty(String(pickModal.item.cantidadSolicitada))
                                        }
                                    }}
                                >
                                    TODO
                                </Button>
                            </div>
                        </div>

                        {/* Deviation Reason and Note */}
                        {pickModal.item && Number(pickQty) < pickModal.item.cantidadSolicitada && (
                            <div className="space-y-3 p-3 bg-orange-50 rounded-lg border border-orange-100 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-start gap-2 text-orange-800 mb-2">
                                    <AlertTriangle className="h-5 w-5 shrink-0" />
                                    <p className="text-sm font-medium">Has indicado una cantidad menor a la solicitada. Por favor indica el motivo.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Motivo de desviación <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        className="w-full h-10 rounded-lg border border-neutral-300 px-3 text-sm focus:border-brand-red focus:outline-none"
                                        value={pickReason}
                                        onChange={(e) => setPickReason(e.target.value)}
                                    >
                                        <option value="">Seleccionar motivo...</option>
                                        <option value="FALTANTE">Faltante (No hay stock físico)</option>
                                        <option value="DANADO">Producto Dañado</option>
                                        <option value="VENCIDO">Producto Vencido</option>
                                        <option value="ERROR_INVENTARIO">Error de Inventario</option>
                                        <option value="OTRO">Otro</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Nota para Bodeguero (Opcional)
                                    </label>
                                    <textarea
                                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-red focus:outline-none min-h-[80px]"
                                        placeholder="Detalles adicionales..."
                                        value={pickNote}
                                        onChange={(e) => setPickNote(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Suggested Lot / Override Display */}
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-blue-600 font-bold uppercase">Lote {overrideLot ? 'Seleccionado' : 'Sugerido'}</p>
                                <p className="text-neutral-900 font-medium">
                                    {overrideLot ? overrideLot.numero : (
                                        typeof pickModal.item?.loteSugerido === 'object' ?
                                            (pickModal.item?.loteSugerido as any).numeroLote :
                                            (pickModal.item?.loteSugerido ? String(pickModal.item?.loteSugerido) : 'N/A')
                                    )}
                                </p>
                                <p className="text-xs text-neutral-500">
                                    Ubicación: {overrideLot ? overrideLot.ubicacionLabel : (typeof pickModal.item?.ubicacionSugerida === 'object' ? pickModal.item?.ubicacionSugerida.codigoVisual : pickModal.item?.ubicacionSugerida)}
                                </p>
                            </div>
                            <Button size="sm" variant="outline" onClick={fetchAlternatives} disabled={loadingAlt}>
                                {loadingAlt ? 'Cargando...' : 'Cambiar Lote'}
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                        <Button variant="ghost" onClick={() => setPickModal({ open: false, item: null })}>Cancelar</Button>
                        <Button variant="primary" onClick={confirmPick}>Confirmar Pickeo</Button>
                    </div>
                </div>
            </Modal>

            {/* Alternatives Modal */}
            <Modal
                isOpen={showAltModal}
                onClose={() => setShowAltModal(false)}
                title="Seleccionar Lote Alternativo"
            >
                <div>
                    {alternatives.length === 0 ? (
                        <p className="p-4 text-center text-gray-500">No se encontraron otros stocks disponibles.</p>
                    ) : (
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {alternatives.map((alt, idx) => (
                                <div key={idx} className="p-3 border rounded-lg hover:bg-gray-50 flex justify-between items-center cursor-pointer" onClick={() => selectAlternative(alt)}>
                                    <div>
                                        <p className="font-bold text-sm">Lote: {alt.lote.numeroLote}</p>
                                        <p className="text-xs text-gray-500">Vence: {alt.lote.fechaVencimiento ? new Date(alt.lote.fechaVencimiento).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono text-sm font-bold bg-gray-100 px-1 rounded">{alt.ubicacion.codigoVisual}</p>
                                        <p className="text-xs text-green-600 font-bold">Disp: {alt.cantidadDisponible}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="mt-4 text-right">
                        <Button variant="ghost" onClick={() => setShowAltModal(false)}>Cerrar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
