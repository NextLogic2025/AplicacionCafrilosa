import * as React from 'react'
import { getCart, upsertCartItem, removeFromCart, addToCartForUser } from '../services/cartApi'
import { getToken } from '../../../services/storage/tokenStorage'
import { getClienteContext } from '../services/clientApi'
import { httpCatalogo } from '../../../services/api/http'

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

  // NOTE: Removed automatic server sync on mount to avoid calling
  // `/orders/cart/:userId` from the client. Cart stays local and
  // server sync is performed only on explicit user actions.

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
      // include cliente_id and usuario_id when available so backend can operate on behalf of the client
      const ctx = await getClienteContext().catch(() => null)
      const clienteId = ctx?.clienteId ?? null
      const usuarioId = ctx?.usuarioId ?? null
      const resp: any = await upsertCartItem({ producto_id: item.id, cantidad: item.quantity, cliente_id: clienteId, usuario_id: usuarioId })
        if (resp && Array.isArray(resp.items)) {
          const mapped = resp.items.map((i: any) => ({ id: i.producto_id, name: i.producto_id, unitPrice: Number(i.precio_unitario_ref ?? 0), quantity: Number(i.cantidad) }))
          // enrich names from catalog if possible
          try {
            const ids = Array.from(new Set(mapped.map((m: any) => String(m.id))))
            const namesMap: Record<string, string> = {}
            await Promise.all(ids.map(async (pid: string) => {
              try {
                const p: any = await httpCatalogo(`/api/products/${pid}`).catch(() => null)
                if (p && (p.nombre || p.name || p.codigo_sku)) namesMap[pid] = String(p.nombre ?? p.name ?? p.codigo_sku)
              } catch {}
            }))
            if (Object.keys(namesMap).length > 0) mapped.forEach((m: any) => { const k = String(m.id); if (namesMap[k]) m.name = namesMap[k] })
          } catch {}
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
      const ctx = await getClienteContext().catch(() => null)
      const clienteId = ctx?.clienteId ?? null
      const usuarioId = ctx?.usuarioId ?? null
      const resp: any = await upsertCartItem({ producto_id: productId, cantidad: quantity, cliente_id: clienteId, usuario_id: usuarioId })
        if (resp && Array.isArray(resp.items)) {
          const mapped = resp.items.map((i: any) => ({ id: i.producto_id, name: i.producto_id, unitPrice: Number(i.precio_unitario_ref ?? 0), quantity: Number(i.cantidad) }))
          // enrich names if possible
          try {
            const ids = Array.from(new Set(mapped.map((m: any) => String(m.id))))
            const namesMap: Record<string, string> = {}
            await Promise.all(ids.map(async (pid: string) => {
              try {
                const p: any = await httpCatalogo(`/api/products/${pid}`).catch(() => null)
                if (p && (p.nombre || p.name || p.codigo_sku)) namesMap[pid] = String(p.nombre ?? p.name ?? p.codigo_sku)
              } catch {}
            }))
            if (Object.keys(namesMap).length > 0) mapped.forEach((m: any) => { const k = String(m.id); if (namesMap[k]) m.name = namesMap[k] })
          } catch {}
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
        try {
          if (getToken()) {
            getClienteContext()
              .then((c) => {
                const uid = c?.usuarioId ?? null
                if (uid) removeFromCart(uid, productId).catch(() => {})
              })
              .catch(() => {
                // no-op when client context cannot be resolved
              })
          }
        } catch {}
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

const t = localStorage.getItem('cafrilosa.token')
const payload = t ? JSON.parse(atob(t.split('.')[1])) : null
console.log('token sub, rol:', payload?.sub, payload?.role ?? payload?.roles ?? payload)
