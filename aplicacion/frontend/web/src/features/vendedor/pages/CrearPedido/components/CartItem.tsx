
import { Trash2, Plus, Minus } from 'lucide-react'
import type { CartItem as CartItemType } from '../types'

interface CartItemProps {
    item: CartItemType
    onUpdateQuantity: (id: string, quantity: number) => void
    onRemove: (id: string) => void
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-900">{item.producto.name}</p>
                <p className="text-xs text-neutral-500">Precio unitario: ${item.producto.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    aria-label="Disminuir"
                    onClick={() => onUpdateQuantity(item.producto.id, Math.max(item.cantidad - 1, 0))}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 p-1 text-neutral-700 hover:bg-neutral-100"
                >
                    <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{item.cantidad}</span>
                <button
                    type="button"
                    aria-label="Aumentar"
                    onClick={() => onUpdateQuantity(item.producto.id, item.cantidad + 1)}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 p-1 text-neutral-700 hover:bg-neutral-100"
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>
            <div className="w-24 text-right text-sm font-bold text-neutral-900">
                ${(item.producto.price * item.cantidad).toFixed(2)}
            </div>
            <button
                type="button"
                aria-label="Eliminar"
                onClick={() => onRemove(item.producto.id)}
                className="rounded-lg bg-red-50 p-2 text-brand-red hover:bg-red-100"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
    )
}
