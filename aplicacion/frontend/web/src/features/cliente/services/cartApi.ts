import { httpOrders } from '../../../services/api/http'

export type BackendCartItem = {
  id: string
  carrito_id: string
  producto_id: string
  cantidad: number
  precio_unitario_ref?: number | null
}

export type BackendCart = {
  id: string
  usuario_id: string
  cliente_id?: string | null
  items: BackendCartItem[]
  removed_items?: Array<{ producto_id: string; campania_aplicada_id?: number | null }>
  warnings?: Array<{ issue: string }>
}

export async function getCart(userId: string): Promise<BackendCart | null> {
  return await httpOrders<BackendCart>(`/orders/cart/${userId}`).catch(() => null)
}

export async function upsertCartItem(dto: { producto_id: string; cantidad: number; cliente_id?: string | null }) {
  // Polymorphic endpoint uses token identity. Backend recalculates price/promo and may return removed_items/warnings
  return await httpOrders<BackendCart | { removed_items?: any; warnings?: any } | null>('/orders/cart/items', { method: 'POST', body: dto }).catch(() => null)
}

export async function addToCartForUser(userId: string, dto: { producto_id: string; cantidad: number; precio_unitario_ref?: number; cliente_id?: string | null }) {
  return await httpOrders(`/orders/cart/${userId}`, { method: 'POST', body: dto }).catch(() => null)
}

export async function removeFromCart(userId: string, productId: string) {
  return await httpOrders(`/orders/cart/${userId}/item/${productId}`, { method: 'DELETE' }).catch(() => null)
}
