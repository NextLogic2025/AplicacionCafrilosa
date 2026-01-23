
import { Info } from 'lucide-react'
import { CartItem } from './CartItem'
import type { CartItem as CartItemType } from '../types'

interface CartItemListProps {
    cart: CartItemType[]
    onUpdateQuantity: (id: string, quantity: number) => void
    onRemove: (id: string) => void
}

export function CartItemList({ cart, onUpdateQuantity, onRemove }: CartItemListProps) {
    if (cart.length === 0) {
        return (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-600">
                El carrito está vacío.
            </div>
        )
    }

    return (
        <div className="lg:col-span-2 space-y-3 max-h-[60vh] overflow-auto pr-2">
            {cart.map(item => (
                <CartItem
                    key={item.producto.id}
                    item={item}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemove={onRemove}
                />
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
