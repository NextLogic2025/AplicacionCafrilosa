
import { ShoppingCart, Plus, Minus } from 'lucide-react'
import type { Producto, CartItem } from '../types'

interface CartToastProps {
    showToast: boolean
    lastAddedProduct: Producto | null
    cart: CartItem[]
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
    setShowToast: (value: boolean) => void
    goToCrearPedido: () => void
}

export function CartToast({ showToast, lastAddedProduct, cart, setCart, setShowToast, goToCrearPedido }: CartToastProps) {
    if (!showToast || !lastAddedProduct) return null

    const cartItem = cart.find(item => item.producto.id === lastAddedProduct.id)
    const currentQuantity = cartItem?.cantidad || 1

    return (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm transition-all duration-300 translate-y-0 opacity-100">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl">
                <div className="flex items-start gap-3">
                    <div className="rounded-full bg-brand-red/10 p-2 text-brand-red">
                        <ShoppingCart size={18} />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-neutral-900 flex items-center gap-1">
                            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
                            Producto agregado al carrito
                        </p>
                        <p className="text-sm text-neutral-600">{lastAddedProduct.name}</p>
                        <p className="text-xs text-neutral-500">
                            Cantidad total: {currentQuantity}
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label="Cerrar"
                        onClick={() => setShowToast(false)}
                        className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
                    >
                        ✕
                    </button>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl border border-neutral-200 px-3 py-2">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            aria-label="Disminuir"
                            onClick={() => {
                                if (currentQuantity > 1) {
                                    setCart(prev => prev.map(item =>
                                        item.producto.id === lastAddedProduct.id
                                            ? { ...item, cantidad: item.cantidad - 1 }
                                            : item
                                    ))
                                } else {
                                    setCart(prev => prev.filter(item => item.producto.id !== lastAddedProduct.id))
                                    setShowToast(false)
                                }
                            }}
                            className="rounded-lg border border-neutral-200 bg-neutral-50 p-1 text-neutral-700 hover:bg-neutral-100"
                        >
                            <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center text-sm font-semibold">
                            {currentQuantity}
                        </span>
                        <button
                            type="button"
                            aria-label="Aumentar"
                            onClick={() => {
                                setCart(prev => prev.map(item =>
                                    item.producto.id === lastAddedProduct.id
                                        ? { ...item, cantidad: item.cantidad + 1 }
                                        : item
                                ))
                            }}
                            className="rounded-lg border border-neutral-200 bg-neutral-50 p-1 text-neutral-700 hover:bg-neutral-100"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="text-right text-sm">
                        <p className="font-semibold text-neutral-900">
                            ${(currentQuantity * lastAddedProduct.price).toFixed(2)}
                        </p>
                        <p className="text-xs text-neutral-500">
                            Carrito: {cart.reduce((sum, item) => sum + item.cantidad, 0)} productos · ${cart.reduce((sum, item) => sum + (item.producto.price * item.cantidad), 0).toFixed(2)}
                        </p>
                    </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={goToCrearPedido}
                        className="rounded-xl bg-brand-red px-3 py-2 text-sm font-semibold text-white hover:brightness-90"
                    >
                        Ver carrito
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowToast(false)}
                        className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                    >
                        Seguir comprando
                    </button>
                </div>
            </div>
        </div>
    )
}
