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
  try {
    const res = await httpOrders<BackendCart>(resolveCartPath(clienteId))
    // eslint-disable-next-line no-console
    try {
      console.log('[cartApi] getCart', { path: resolveCartPath(clienteId), payload: JSON.stringify(res, null, 2) })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('[cartApi] getCart (raw)', { path: resolveCartPath(clienteId), payload: res })
    }
    return res
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[cartApi] getCart failed', { path: resolveCartPath(clienteId), err })
    return null
  }
}

export async function upsertCartItem(dto: UpdateCartItemDto): Promise<BackendCart | null> {
  const { cliente_id, ...body } = dto
  try {
    const res = await httpOrders<BackendCart>(resolveCartPath(cliente_id), {
      method: 'POST',
      body,
    })
    // eslint-disable-next-line no-console
    try {
      console.log('[cartApi] upsertCartItem', { path: resolveCartPath(cliente_id), body: JSON.stringify(body, null, 2), payload: JSON.stringify(res, null, 2) })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('[cartApi] upsertCartItem (raw)', { path: resolveCartPath(cliente_id), body, payload: res })
    }
    return res
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[cartApi] upsertCartItem failed', { path: resolveCartPath(cliente_id), body, err })
    return null
  }
}

export async function clearCartRemote(clienteId?: string | null): Promise<void> {
  await httpOrders(resolveCartPath(clienteId), { method: 'DELETE' }).catch(() => null)
}

export async function removeFromCart(productId: string, clienteId?: string | null) {
  const path = resolveCartPath(clienteId)
  try {
    // Check remote cart first to avoid 404 when the item is not present
    const remote = await httpOrders<{ items?: BackendCartItem[] }>(path).catch(() => null)
    // eslint-disable-next-line no-console
    console.log('[cartApi] removeFromCart remote snapshot', { path, items: Array.isArray(remote?.items) ? remote.items.length : 0 })
    const exists = remote && Array.isArray(remote.items) && remote.items.some(i => String(i.producto_id) === String(productId))
    if (!exists) return null
    return await httpOrders(`${path}/item/${productId}`, { method: 'DELETE' }).catch(() => null)
  } catch {
    return null
  }
}
