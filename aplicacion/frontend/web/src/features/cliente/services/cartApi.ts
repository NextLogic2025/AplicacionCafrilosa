import { httpOrders, ApiError } from '../../../services/api/http'

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

export async function upsertCartItem(dto: { producto_id: string; cantidad: number; precio_unitario_ref?: number | null; cliente_id?: string | null; usuario_id?: string | null; campania_aplicada_id?: number | null; motivo_descuento?: string | null; referido_id?: string | null }) {
  // Polymorphic endpoint uses token identity. Backend recalculates price/promo and may return removed_items/warnings
  try {
    // NOTE: Remote cart syncing is disabled from the frontend to avoid
    // triggering server-side DB schema errors (e.g. missing columns).
    // We keep optimistic local updates only and do not call `/orders/cart/:userId`.
    // eslint-disable-next-line no-console
    console.warn('[cartApi] upsertCartItem - server sync disabled; skipping server call', { body: dto })
    return null
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[cartApi] upsertCartItem - error', e instanceof Error ? e.message : e)
    // If server rejects with 403 (not owner), try the explicit user cart endpoint when we have cliente_id
    try {
      if (e instanceof ApiError && e.status === 403) {
        // Prefer retrying with usuario_id (this should match token sub)
        if (dto?.usuario_id) {
          // eslint-disable-next-line no-console
          console.log('[cartApi] upsertCartItem - retrying with addToCartForUser using usuario_id', dto.usuario_id)
          // Per-user endpoint usually expects producto_id + cantidad (no cliente_id)
          const body: any = { producto_id: dto.producto_id, cantidad: dto.cantidad }
          if (dto.precio_unitario_ref != null) body.precio_unitario_ref = dto.precio_unitario_ref
          const retry = await addToCartForUser(dto.usuario_id, body)
          return retry
        }
        // Fallback: try with cliente_id path if provided
        if (dto?.cliente_id) {
          // eslint-disable-next-line no-console
          console.log('[cartApi] upsertCartItem - retrying with addToCartForUser using cliente_id', dto.cliente_id)
          const body2: any = { producto_id: dto.producto_id, cantidad: dto.cantidad }
          if (dto.precio_unitario_ref != null) body2.precio_unitario_ref = dto.precio_unitario_ref
          const retry = await addToCartForUser(dto.cliente_id, body2)
          return retry
        }
      }
    } catch (e2) {
      // ignore retry errors
    }
    return null
  }
}

export async function addToCartForUser(userId: string, dto: { producto_id: string; cantidad: number; precio_unitario_ref?: number | null }) {
  try {
    // eslint-disable-next-line no-console
    console.log('[cartApi] addToCartForUser - request', { path: `/orders/cart/${userId}`, body: dto })
    const bodyToSend: any = { producto_id: dto.producto_id, cantidad: dto.cantidad }
    if ((dto as any).precio_unitario_ref != null) bodyToSend.precio_unitario_ref = (dto as any).precio_unitario_ref
    const res = await httpOrders(`/orders/cart/${userId}`, { method: 'POST', body: bodyToSend })
    // eslint-disable-next-line no-console
    console.log('[cartApi] addToCartForUser - response', res)
    return res
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[cartApi] addToCartForUser - error', e instanceof Error ? e.message : e)
    // If ApiError, include payload for debug
    try {
      if (e instanceof ApiError) console.warn('[cartApi] addToCartForUser - api payload', (e as ApiError).payload)
    } catch (_) {}
    return null
  }
}

export async function removeFromCart(userId: string, productId: string) {
  return await httpOrders(`/orders/cart/${userId}/item/${productId}`, { method: 'DELETE' }).catch(() => null)
}
