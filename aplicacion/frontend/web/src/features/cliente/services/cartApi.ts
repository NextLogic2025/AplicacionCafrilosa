import { httpOrders } from '../../../services/api/http'

export type BackendCartItem = {
  id?: string
  carrito_id?: string
  producto_id: string
  cantidad: number
  precio_unitario_ref?: number | null
  precio_final?: number | null
  producto_nombre?: string | null
}

export type BackendCart = {
  id: string
  usuario_id?: string
  cliente_id?: string | null
  items: BackendCartItem[]
  removed_items?: Array<{ producto_id: string; campania_aplicada_id?: number | null }>
  warnings?: Array<{ issue: string }>
}

type UpdateCartItemDto = {
  producto_id: string
  cantidad: number
  campania_aplicada_id?: number | null
  motivo_descuento?: string | null
  referido_id?: string | null
  precio_unitario_ref?: number | null
  cliente_id?: string | null
}

function resolveCartPath(clienteId?: string | null) {
  if (clienteId) return `/orders/cart/client/${clienteId}`
  return '/orders/cart/me'
}

export async function getCart(clienteId?: string | null): Promise<BackendCart | null> {
  return await httpOrders<BackendCart>(resolveCartPath(clienteId)).catch(() => null)
}

export async function upsertCartItem(dto: UpdateCartItemDto): Promise<BackendCart | null> {
  const { cliente_id, ...body } = dto
  return await httpOrders<BackendCart>(resolveCartPath(cliente_id), {
    method: 'POST',
    body,
  }).catch(() => null)
}

export async function clearCartRemote(clienteId?: string | null): Promise<void> {
  await httpOrders(resolveCartPath(clienteId), { method: 'DELETE' }).catch(() => null)
}

export async function removeFromCart(productId: string, clienteId?: string | null) {
  const path = resolveCartPath(clienteId)
  return await httpOrders(`${path}/item/${productId}`, { method: 'DELETE' }).catch(() => null)
}
