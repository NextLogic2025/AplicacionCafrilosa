import * as React from 'react'
import { getCart, upsertCartItem, removeFromCart } from '../services/cartApi'
import { getToken } from '../../../services/storage/tokenStorage'

export type CartItem = {
  id: string // product id
  name: string
  unitPrice: number
  quantity: number
}

type CartContextValue = {
  items: CartItem[]
  total: number
  addItem: (item: CartItem) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  warnings: Array<{ issue: string }>
  removedItems: Array<{ producto_id: string; campania_aplicada_id?: number | null }>
}

const CartContext = React.createContext<CartContextValue | null>(null)

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem('cafrilosa:cart')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem('cafrilosa:cart', JSON.stringify(items))
  } catch {
    // ignore
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>(() => loadCart())
  const [warnings, setWarnings] = React.useState<Array<{ issue: string }>>([])
  const [removedItems, setRemovedItems] = React.useState<Array<{ producto_id: string; campania_aplicada_id?: number | null }>>([])

  // Try to sync with backend when user is authenticated
  React.useEffect(() => {
    const token = getToken()
    if (!token) return
    // Try fetching server cart and merge
    ;(async () => {
      try {
        // backend determines user from token via /orders/cart/items polymorphic endpoint
        const server = await getCart('me')
        if (server && Array.isArray(server.items)) {
          const mapped = server.items.map(i => ({ id: i.producto_id, name: i.producto_id, unitPrice: Number(i.precio_unitario_ref ?? 0), quantity: Number(i.cantidad) }))
          setItems(() => {
            // server takes precedence
            saveCart(mapped)
            return mapped
          })
          setWarnings(Array.isArray((server as any).warnings) ? (server as any).warnings : [])
          setRemovedItems(Array.isArray((server as any).removed_items) ? (server as any).removed_items : [])
        }
      } catch {
        // ignore
      }
    })()
  }, [])

  const addItem = React.useCallback((item: CartItem) => {
    ;(async () => {
      // Optimistic local update while backend recalculates
      setItems(prev => {
        const existing = prev.find(i => i.id === item.id)
        const next = existing
          ? prev.map(i => (i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i))
          : [...prev, item]
        saveCart(next)
        return next
      })

      try {
        if (!getToken()) return
        const resp: any = await upsertCartItem({ producto_id: item.id, cantidad: item.quantity })
        if (resp && Array.isArray(resp.items)) {
          const mapped = resp.items.map((i: any) => ({ id: i.producto_id, name: i.producto_id, unitPrice: Number(i.precio_unitario_ref ?? 0), quantity: Number(i.cantidad) }))
          setItems(mapped)
          saveCart(mapped)
          setWarnings(Array.isArray((resp).warnings) ? (resp).warnings : [])
          setRemovedItems(Array.isArray((resp).removed_items) ? (resp).removed_items : [])
        }
      } catch {
        // ignore backend failures; keep optimistic state
      }
    })()
  }, [])

  const updateQuantity = React.useCallback((productId: string, quantity: number) => {
    ;(async () => {
      setItems(prev => {
        const next = prev
          .map(i => (i.id === productId ? { ...i, quantity } : i))
          .filter(i => i.quantity > 0)
        saveCart(next)
        return next
      })

      try {
        if (!getToken()) return
        const resp: any = await upsertCartItem({ producto_id: productId, cantidad: quantity })
        if (resp && Array.isArray(resp.items)) {
          const mapped = resp.items.map((i: any) => ({ id: i.producto_id, name: i.producto_id, unitPrice: Number(i.precio_unitario_ref ?? 0), quantity: Number(i.cantidad) }))
          setItems(mapped)
          saveCart(mapped)
          setWarnings(Array.isArray((resp).warnings) ? (resp).warnings : [])
          setRemovedItems(Array.isArray((resp).removed_items) ? (resp).removed_items : [])
        }
      } catch {
        // ignore
      }
    })()
  }, [])

  const removeItem = React.useCallback((productId: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== productId)
      saveCart(next)
      try { if (getToken()) removeFromCart('me', productId) } catch {}
      return next
    })
  }, [])

  const clearCart = React.useCallback(() => {
    setItems([])
    saveCart([])
  }, [])

  const total = React.useMemo(() => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0), [items])

  const value = React.useMemo(
    () => ({ items, total, addItem, updateQuantity, removeItem, clearCart, warnings, removedItems }),
    [items, total, addItem, updateQuantity, removeItem, clearCart, warnings, removedItems]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = React.useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider />')
  return ctx
}
