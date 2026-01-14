import * as React from 'react'

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

  const addItem = React.useCallback((item: CartItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      const next = existing
        ? prev.map(i => (i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i))
        : [...prev, item]
      saveCart(next)
      return next
    })
  }, [])

  const updateQuantity = React.useCallback((productId: string, quantity: number) => {
    setItems(prev => {
      const next = prev
        .map(i => (i.id === productId ? { ...i, quantity } : i))
        .filter(i => i.quantity > 0)
      saveCart(next)
      return next
    })
  }, [])

  const removeItem = React.useCallback((productId: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== productId)
      saveCart(next)
      return next
    })
  }, [])

  const clearCart = React.useCallback(() => {
    setItems([])
    saveCart([])
  }, [])

  const total = React.useMemo(() => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0), [items])

  const value = React.useMemo(
    () => ({ items, total, addItem, updateQuantity, removeItem, clearCart }),
    [items, total, addItem, updateQuantity, removeItem, clearCart]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = React.useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider />')
  return ctx
}
