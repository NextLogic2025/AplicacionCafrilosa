
import { useState, useEffect } from 'react'
import { Modal } from 'components/ui/Modal'
import { Button } from 'components/ui/Button'
import { TextField } from 'components/ui/TextField'
import { Alert } from 'components/ui/Alert'
import { createStock } from '../../../services/stockApi'
import { lotesApi, Lote } from '../../../services/lotesApi'
import { ubicacionesApi, Ubicacion } from '../../../services/ubicacionesApi'

interface CreateStockModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function CreateStockModal({ isOpen, onClose, onSuccess }: CreateStockModalProps) {
    const [lotes, setLotes] = useState<Lote[]>([])
    const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        loteId: '',
        ubicacionId: '',
        cantidadFisica: ''
    })

    useEffect(() => {
        if (isOpen) {
            Promise.all([
                lotesApi.getAll(),
                ubicacionesApi.getAll()
            ]).then(([l, u]) => {
                setLotes(l)
                setUbicaciones(u)
            }).catch(e => setError('Error cargando datos: ' + e.message))

            // Reset form when opening
            setFormData({
                loteId: '',
                ubicacionId: '',
                cantidadFisica: ''
            })
            setError(null)
        }
    }, [isOpen])

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            await createStock({
                loteId: formData.loteId,
                ubicacionId: formData.ubicacionId,
                cantidadFisica: Number(formData.cantidadFisica)
            })
            onSuccess()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ingreso Inicial de Stock" headerGradient="red" maxWidth="md">
            <form onSubmit={onSubmit} className="space-y-4">
                {error && <Alert type="error" message={error} />}

                <div className="grid gap-2">
                    <label className="text-xs text-neutral-600">Lote</label>
                    <select
                        value={formData.loteId}
                        onChange={(e) => setFormData({ ...formData, loteId: e.target.value })}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]"
                        required
                    >
                        <option value="">Seleccionar Lote</option>
                        {lotes.map(l => (
                            <option key={l.id} value={l.id}>{l.numeroLote} (Vence: {l.fechaVencimiento})</option>
                        ))}
                    </select>
                </div>

                <div className="grid gap-2">
                    <label className="text-xs text-neutral-600">Ubicación</label>
                    <select
                        value={formData.ubicacionId}
                        onChange={(e) => setFormData({ ...formData, ubicacionId: e.target.value })}
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]"
                        required
                    >
                        <option value="">Seleccionar Ubicación</option>
                        {ubicaciones.map(u => (
                            <option key={u.id} value={u.id}>{u.codigoVisual} - {u.almacen?.nombre}</option>
                        ))}
                    </select>
                </div>

                <TextField
                    label="Cantidad Inicial"
                    tone="light"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ingrese la cantidad"
                    value={formData.cantidadFisica}
                    onChange={(e) => setFormData({ ...formData, cantidadFisica: e.target.value })}
                    required
                />

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
                        {loading ? 'Guardando...' : 'Guardar'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
