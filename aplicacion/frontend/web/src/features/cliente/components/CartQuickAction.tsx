import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Plus, Minus, X, CheckCircle2 } from 'lucide-react'

import { useCart } from '../cart/CartContext'

export function CartQuickAction() {
  const { lastAction, dismissLastAction, items, updateQuantity } = useCart()
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<number | null>(null)
  const navigate = useNavigate()

  const currentItem = useMemo(() => {
    if (!lastAction) return null
    const match = items.find(item => item.id === lastAction.itemId)
    if (match) return match
    return {
      id: lastAction.itemId,
      name: lastAction.name,
      unitPrice: 0,
      quantity: lastAction.quantity,
    }
  }, [items, lastAction])

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])
  const cartTotal = useMemo(() => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [items])

  useEffect(() => {
    if (!lastAction) {
      setVisible(false)
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = null
      return
    }
    setVisible(true)
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      setVisible(false)
      dismissLastAction()
      timerRef.current = null
    }, 6000)
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [lastAction, dismissLastAction])

  if (!lastAction || !currentItem) return null

  const handleClose = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = null
    setVisible(false)
    dismissLastAction()
  }

  const handleQuantityChange = (delta: number) => {
    const next = Math.max(0, currentItem.quantity + delta)
    updateQuantity(currentItem.id, next)
  }

  const goToCart = () => {
    handleClose()
    navigate('/cliente/carrito')
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 w-full max-w-sm transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <div
        className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl"
        onMouseEnter={() => {
          if (timerRef.current) {
            window.clearTimeout(timerRef.current)
            timerRef.current = null
          }
        }}
        onMouseLeave={() => {
          if (!lastAction || timerRef.current) return
          timerRef.current = window.setTimeout(() => {
            setVisible(false)
            dismissLastAction()
            timerRef.current = null
          }, 4000)
        }}
      >
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-brand-red/10 p-2 text-brand-red">
            <ShoppingCart size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-neutral-900 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Producto agregado al carrito
            </p>
            <p className="text-sm text-neutral-600">{currentItem.name}</p>
            <p className="text-xs text-neutral-500">Cantidad total: {currentItem.quantity}</p>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={handleClose}
            className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-neutral-200 px-3 py-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Disminuir"
              onClick={() => handleQuantityChange(-1)}
              className="rounded-lg border border-neutral-200 bg-neutral-50 p-1 text-neutral-700 hover:bg-neutral-100"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-sm font-semibold">{currentItem.quantity}</span>
            <button
              type="button"
              aria-label="Aumentar"
              onClick={() => handleQuantityChange(1)}
              className="rounded-lg border border-neutral-200 bg-neutral-50 p-1 text-neutral-700 hover:bg-neutral-100"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold text-neutral-900">
              ${(currentItem.unitPrice * currentItem.quantity).toFixed(2)}
            </p>
            <p className="text-xs text-neutral-500">
              Carrito: {totalItems} productos · ${cartTotal.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={goToCart}
            className="rounded-xl bg-brand-red px-3 py-2 text-sm font-semibold text-white hover:brightness-90"
          >
            Ver carrito
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Seguir comprando
          </button>
        </div>
      </div>
    </div>
  )
}

export default CartQuickAction
