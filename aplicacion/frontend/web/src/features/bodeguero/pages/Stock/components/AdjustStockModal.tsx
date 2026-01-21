
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from 'components/ui/Modal'
import { Button } from 'components/ui/Button'
import { adjustStock, StockItem } from '../../../services/stockApi'

interface AdjustStockModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    stockItem: StockItem
}

export function AdjustStockModal({ isOpen, onClose, onSuccess, stockItem }: AdjustStockModalProps) {
    const { register, handleSubmit, watch, reset } = useForm<{ tipo: 'add' | 'remove'; cantidad: number }>()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const tipo = watch('tipo', 'add')

    const onSubmit = async (data: any) => {
        setLoading(true)
        setError(null)
        try {
            const delta = data.tipo === 'add' ? Number(data.cantidad) : -Number(data.cantidad)

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
