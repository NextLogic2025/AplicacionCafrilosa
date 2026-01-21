import * as React from 'react'
import { BackendCart, getCart, upsertCartItem, removeFromCart, clearCartRemote } from '../services/cartApi'
import { getToken } from '../../../services/storage/tokenStorage'

export type CartItem = {
  id: string // product id
  name: string
  unitPrice: number
  quantity: number
}

type CartActionEvent = {
  type: 'add' | 'update'
  itemId: string
  name: string
  quantity: number
  timestamp: number
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
  refreshCart: () => Promise<void>
  lastAction: CartActionEvent | null
  dismissLastAction: () => void
}

const CartContext = React.createContext<CartContextValue | null>(null)

const noop = () => {}
const noopAsync = async () => {}

const fallbackCartValue: CartContextValue = {
  items: [],
  total: 0,
  addItem: noop,
  updateQuantity: noop,
  removeItem: noop,
  clearCart: noop,
  warnings: [],
  removedItems: [],
  refreshCart: noopAsync,
  lastAction: null,
  dismissLastAction: noop,
}

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

function mapServerItems(cart: BackendCart, previous: CartItem[]): CartItem[] {
  if (!cart || !Array.isArray(cart.items)) return []
  const prevNameMap = new Map(previous.map(item => [item.id, item.name]))
  const prevPriceMap = new Map(previous.map(item => [item.id, item.unitPrice]))

  return cart.items
    .map((backendItem) => {
      const id = (backendItem.producto_id ?? backendItem.id ?? '').toString()
      if (!id) return null

      const quantity = Number(backendItem.cantidad ?? 0)
      if (!Number.isFinite(quantity) || quantity <= 0) return null

      const priceCandidate =
        backendItem.precio_unitario_ref ??
        backendItem.precio_final ??
        (backendItem as any).precio_unitario ??
        (backendItem as any).precio ??
        null
      const unitPrice = priceCandidate != null ? Number(priceCandidate) : prevPriceMap.get(id) ?? 0
      const name = (backendItem.producto_nombre ?? prevNameMap.get(id) ?? id).toString()

      return { id, name, unitPrice, quantity }
    })
    .filter((item): item is CartItem => Boolean(item))
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>(() => loadCart())
  const [warnings, setWarnings] = React.useState<Array<{ issue: string }>>([])
  const [removedItems, setRemovedItems] = React.useState<Array<{ producto_id: string; campania_aplicada_id?: number | null }>>([])
  const [lastAction, setLastAction] = React.useState<CartActionEvent | null>(null)
  const pendingRemovalsRef = React.useRef(new Set<string>())
  const inflightUpsertsRef = React.useRef(new Map<string, Promise<void>>())

  const applyServerSnapshot = React.useCallback((cart: BackendCart) => {
    setItems(prev => {
      const mapped = mapServerItems(cart, prev)
      const mappedIsEmpty = mapped.length === 0
      const hasLocalItems = prev.length > 0

      if (hasLocalItems && mappedIsEmpty) {
        // Preferimos mantener el carrito local cuando el backend devuelve un snapshot vacío/incompleto
        // para evitar que desaparezca después de agregar artículos desde el catálogo.
        return prev
      }

      saveCart(mapped)
      return mapped
    })
    setWarnings(Array.isArray(cart?.warnings) ? cart.warnings : [])
    setRemovedItems(Array.isArray(cart?.removed_items) ? cart.removed_items : [])
  }, [])

  const syncCartFromServer = React.useCallback(async () => {
    if (!getToken()) return
    try {
      const remote = await getCart()
      if (remote) applyServerSnapshot(remote)
    } catch {
      // ignore sync errors
    }
  }, [applyServerSnapshot])

  React.useEffect(() => {
    syncCartFromServer()
  }, [syncCartFromServer])

  const dismissLastAction = React.useCallback(() => setLastAction(null), [])

  const syncItemQuantity = React.useCallback(
    (productId: string, quantity: number) => {
      if (!getToken()) return
      const operation = (async () => {
        try {
          const resp = await upsertCartItem({ producto_id: productId, cantidad: quantity })
          if (resp) applyServerSnapshot(resp)
        } catch {
          // ignore server errors, keep optimistic state
        } finally {
          inflightUpsertsRef.current.delete(productId)
        }
      })()
      inflightUpsertsRef.current.set(productId, operation)
    },
    [applyServerSnapshot],
  )

  const removeItem = React.useCallback(
    (productId: string) => {
      setItems(prev => {
        const next = prev.filter(i => i.id !== productId)
        saveCart(next)
        return next
      })

      const executeRemoteRemoval = () => {
        if (!getToken()) return
        if (pendingRemovalsRef.current.has(productId)) return
        pendingRemovalsRef.current.add(productId)
        removeFromCart(productId)
          .catch(() => null)
          .finally(() => {
            pendingRemovalsRef.current.delete(productId)
            syncCartFromServer()
          })
      }

      const pendingUpsert = inflightUpsertsRef.current.get(productId)
      if (pendingUpsert) {
        pendingUpsert.finally(() => executeRemoteRemoval())
        return
      }
      executeRemoteRemoval()
    },
    [syncCartFromServer],
  )

  const addItem = React.useCallback(
    (item: CartItem) => {
      let nextQuantity = item.quantity
      setItems(prev => {
        const existing = prev.find(i => i.id === item.id)
        nextQuantity = (existing?.quantity ?? 0) + item.quantity
        const next = existing
          ? prev.map(i => (i.id === item.id ? { ...i, quantity: nextQuantity } : i))
          : [...prev, { ...item, quantity: nextQuantity }]
        saveCart(next)
        return next
      })
      setLastAction({ type: 'add', itemId: item.id, name: item.name, quantity: nextQuantity, timestamp: Date.now() })
      syncItemQuantity(item.id, nextQuantity)
    },
    [syncItemQuantity],
  )

  const updateQuantity = React.useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId)
        return
      }

      const existing = items.find(i => i.id === productId)
      setItems(prev => {
        const hasItem = prev.some(i => i.id === productId)
        const next = hasItem
          ? prev.map(i => (i.id === productId ? { ...i, quantity } : i))
          : [...prev, { id: productId, name: existing?.name ?? 'Producto', unitPrice: existing?.unitPrice ?? 0, quantity }]
        saveCart(next)
        return next
      })

      setLastAction({ type: 'update', itemId: productId, name: existing?.name ?? 'Producto', quantity, timestamp: Date.now() })
      syncItemQuantity(productId, quantity)
    },
    [items, removeItem, syncItemQuantity],
  )

  const clearCart = React.useCallback(() => {
    setItems([])
    saveCart([])
    setWarnings([])
    setRemovedItems([])
    setLastAction(null)
    if (!getToken()) return
    clearCartRemote().catch(() => {})
  }, [])

  const total = React.useMemo(() => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0), [items])

  const refreshCart = React.useCallback(() => syncCartFromServer(), [syncCartFromServer])

  const value = React.useMemo(
    () => ({
      items,
      total,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      warnings,
      removedItems,
      refreshCart,
      lastAction,
      dismissLastAction,
    }),
    [items, total, addItem, updateQuantity, removeItem, clearCart, warnings, removedItems, refreshCart, lastAction, dismissLastAction],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = React.useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider />')
  return ctx
}

export function useCartOptional() {
  const ctx = React.useContext(CartContext)
  if (!ctx) {
    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[CartContext] useCartOptional se llamó sin <CartProvider />, utilizando fallback sin estado')
    }
    return fallbackCartValue
  }
  return ctx
}
