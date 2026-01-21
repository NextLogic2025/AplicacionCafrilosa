
import { Minus, Plus, Trash2, Info } from 'lucide-react'
import type { CartItem as CartItemType } from '../../../cart/CartContext'
import { Alert } from 'components/ui/Alert'

interface CartListProps {
    items: CartItemType[]
    updateQuantity: (id: string, quantity: number) => void
    removeItem: (id: string) => void
    warnings?: Array<{ issue: string }>
    removedItems?: Array<{ producto_id: string }>
}

export function CartList({ items, updateQuantity, removeItem, warnings, removedItems }: CartListProps) {
    if (items.length === 0) {
        return (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-600">
                Tu carrito está vacío.
            </div>
        )
    }

    return (
        <div className="lg:col-span-2 space-y-3 max-h-[60vh] overflow-auto pr-2">
            {warnings && warnings.length > 0 ? (
                <div className="mb-3">
                    <Alert type="info" title="Advertencia" message={warnings.map(w => w.issue).join(', ')} />
                </div>
            ) : null}

            {removedItems && removedItems.length > 0 ? (
                <div className="mb-3">
                    <Alert type="error" title="Items eliminados" message={`Algunas líneas fueron eliminadas del carrito: ${removedItems.map(r => r.producto_id).join(', ')}`} />
                </div>
            ) : null}

            {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-neutral-900">{item.name}</p>
                        <p className="text-xs text-neutral-500">Precio unitario: ${item.unitPrice.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            aria-label="Disminuir"
                            onClick={() => updateQuantity(item.id, Math.max(item.quantity - 1, 0))}
                            className="rounded-lg border border-neutral-200 bg-neutral-50 p-1 text-neutral-700 hover:bg-neutral-100"
                        >
                            <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                            type="button"
                            aria-label="Aumentar"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="rounded-lg border border-neutral-200 bg-neutral-50 p-1 text-neutral-700 hover:bg-neutral-100"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="w-24 text-right text-sm font-bold text-neutral-900">
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                    </div>
                    <button
                        type="button"
                        aria-label="Eliminar"
                        onClick={() => removeItem(item.id)}
                        className="rounded-lg bg-red-50 p-2 text-brand-red hover:bg-red-100"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ))}

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-700">
                <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-neutral-500" />
                    <span>Stock sujeto a disponibilidad. El pedido será validado.</span>
                </div>
            </div>
        </div>
    )
}
