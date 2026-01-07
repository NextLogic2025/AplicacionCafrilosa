import { httpAuth, httpCatalogo } from '../../../services/api/http'
import { getToken } from '../../../services/storage/tokenStorage'
import type {
  PerfilCliente,
  Pedido,
  Factura,
  Entrega,
  Producto,
  Notificacion,
  Conversacion,
  Ticket,
} from '../types'

async function fetchClienteByUsuarioId(usuarioId: string) {
  const endpoints = [
    `/clientes/usuario/${usuarioId}`,
    `/clientes/${usuarioId}`,
  ]
  for (const path of endpoints) {
    const resp = await httpCatalogo<any>(path).catch(() => null)
    if (resp) return resp
  }
  return null
}

export async function getPerfilCliente(): Promise<PerfilCliente | null> {
  // First try canonical /cliente/perfil (some backends expose this)
  const direct = await httpCatalogo<PerfilCliente>('/cliente/perfil').catch(() => null)
  if (direct) return direct

  // Next try: call `/auth/me` to obtain the authenticated user's id (more reliable than decoding token)
  try {
    const me = await httpAuth<Record<string, unknown>>('/auth/me').catch(() => null)
    const usuarioId = me && typeof me['sub'] === 'string' ? me['sub'] : undefined
    if (usuarioId) {
      const cliente = await fetchClienteByUsuarioId(usuarioId).catch(() => null)
      if (cliente) {
        const perfil: PerfilCliente = {
          id: cliente.id,
          contactName: cliente.razon_social ?? cliente.nombre_comercial ?? '',
          currentDebt: cliente.saldo_actual ? Number(cliente.saldo_actual) : 0,
          creditLimit: cliente.limite_credito ? Number(cliente.limite_credito) : 0,
        }
        return perfil
      }

      // If catalog lookup failed, fallback to building a minimal perfil from `/auth/me` data
      // so the UI can show sensible information instead of empty state.
      try {
        const perfilFromMe: PerfilCliente = {
          id: usuarioId,
          contactName: (me && (me['nombre'] as string)) || (me && (me['email'] as string)) || '',
          currentDebt: 0,
          creditLimit: 0,
        }
        return perfilFromMe
      } catch {
        // ignore and continue to next fallback
      }
    }
  } catch {
    // continue to token-decode fallback
  }

  // Fallback: decode token to obtain usuario id and query catalog service
  try {
    const token = getToken()
    if (token) {
      const parts = token.split('.')
      if (parts.length >= 2) {
        try {
          const payload = JSON.parse(atob(parts[1])) as Record<string, unknown>
          const usuarioId = typeof payload.sub === 'string' ? payload.sub : undefined
          if (usuarioId) {
            const cliente = await fetchClienteByUsuarioId(usuarioId)
            // Map backend `Cliente` shape to frontend `PerfilCliente`
            const perfil: PerfilCliente = {
              id: cliente.id,
              contactName: cliente.razon_social ?? cliente.nombre_comercial ?? '',
              currentDebt: cliente.saldo_actual ? Number(cliente.saldo_actual) : 0,
              creditLimit: cliente.limite_credito ? Number(cliente.limite_credito) : 0,
            }
            return perfil
          }
        } catch (e) {
          // ignore parse errors and continue to return null
        }
      }
    }
  } catch {
    // ignore any error in fallback
  }

  return null
}

export async function getPedidos(page = 1): Promise<{ items: Pedido[]; page: number; totalPages: number }> {
  return await httpCatalogo<{ items: Pedido[]; page: number; totalPages: number }>(`/cliente/pedidos?page=${page}`).catch(() => ({
    items: [],
    page,
    totalPages: 1,
  }))
}

export async function getFacturas(): Promise<Factura[]> {
  return await httpCatalogo<Factura[]>('/cliente/facturas').catch(() => [])
}

export async function getEntregas(): Promise<Entrega[]> {
  return await httpCatalogo<Entrega[]>('/cliente/entregas').catch(() => [])
}

export async function getProductos(options?: { page?: number; per_page?: number; category?: string; categoryId?: number }): Promise<Producto[]> {
  // Solo usar el endpoint de catálogo
  if (options?.categoryId != null) {
    const resp = await httpCatalogo<{ metadata?: any; items?: Producto[] }>(`/api/products/categoria/${options.categoryId}?page=${options.page ?? 1}&per_page=${options.per_page ?? 20}`).catch(() => null)
    if (resp && Array.isArray(resp.items)) {
      const mapped = resp.items.map((p: any) => {
        const precioOriginal = typeof p.precio_original === 'number' ? p.precio_original : null
        const precioOferta = typeof p.precio_oferta === 'number' ? p.precio_oferta : null
        const fallbackOriginal = Array.isArray(p.precios) && p.precios.length > 0 ? (typeof p.precios[0].precio === 'number' ? p.precios[0].precio : Number(p.precios[0].precio ?? 0)) : null
        const effectiveOriginal = precioOriginal != null ? precioOriginal : fallbackOriginal
        const effectivePrice = precioOferta != null ? precioOferta : (effectiveOriginal != null ? effectiveOriginal : 0)

        return ({
          id: p.id,
          name: (p.nombre ?? p.codigo_sku ?? '').toString(),
          description: (p.descripcion ?? '') as string,
          price: effectivePrice,
          precio_original: effectiveOriginal,
          precio_oferta: precioOferta,
          ahorro: typeof p.ahorro === 'number' ? p.ahorro : (effectiveOriginal != null && precioOferta != null ? Math.round((effectiveOriginal - precioOferta) * 100) / 100 : null),
          promociones: Array.isArray(p.promociones) ? p.promociones : [],
          campania_aplicada_id: p.campania_aplicada_id ?? null,
          image: p.imagen_url ?? null,
          category: (p.categoria && (p.categoria.nombre ?? p.categoria)) ?? '',
          inStock: Boolean(p.activo),
          unidad_medida: p.unidad_medida ?? undefined,
          peso_unitario_kg: p.peso_unitario_kg ?? undefined,
        }) as Producto
      })
      return mapped
    }
  }

  // Fallback: catalog service returns { metadata, items }
  const catalogResp = await httpCatalogo<{ metadata?: any; items?: Producto[] }>(`/api/products?page=${options?.page ?? 1}&per_page=${options?.per_page ?? 20}${options?.category ? `&category=${encodeURIComponent(options.category)}` : ''}`).catch(() => null)
  if (catalogResp && Array.isArray(catalogResp.items)) {
    const mapped = catalogResp.items.map((p: any) => {
      const precioOriginal = typeof p.precio_original === 'number' ? p.precio_original : null
      const precioOferta = typeof p.precio_oferta === 'number' ? p.precio_oferta : null
      const fallbackOriginal = Array.isArray(p.precios) && p.precios.length > 0 ? (typeof p.precios[0].precio === 'number' ? p.precios[0].precio : Number(p.precios[0].precio ?? 0)) : null
      const effectiveOriginal = precioOriginal != null ? precioOriginal : fallbackOriginal
      const effectivePrice = precioOferta != null ? precioOferta : (effectiveOriginal != null ? effectiveOriginal : 0)

      return ({
        id: p.id,
        name: (p.nombre ?? p.codigo_sku ?? '').toString(),
        description: (p.descripcion ?? '') as string,
        price: effectivePrice,
        precio_original: effectiveOriginal,
        precio_oferta: precioOferta,
        ahorro: typeof p.ahorro === 'number' ? p.ahorro : (effectiveOriginal != null && precioOferta != null ? Math.round((effectiveOriginal - precioOferta) * 100) / 100 : null),
        promociones: Array.isArray(p.promociones) ? p.promociones : [],
        campania_aplicada_id: p.campania_aplicada_id ?? null,
        image: p.imagen_url ?? null,
        category: (p.categoria && (p.categoria.nombre ?? p.categoria)) ?? '',
        inStock: Boolean(p.activo),
        unidad_medida: p.unidad_medida ?? undefined,
        peso_unitario_kg: p.peso_unitario_kg ?? undefined,
      }) as Producto
    })
    return mapped
  }

  return []
}

export async function getNotificaciones(): Promise<Notificacion[]> {
  return await httpCatalogo<Notificacion[]>('/cliente/notificaciones').catch(() => [])
}

export async function getConversaciones(): Promise<Conversacion[]> {
  return await httpCatalogo<Conversacion[]>('/cliente/conversaciones').catch(() => [])
}

export async function getTickets(): Promise<Ticket[]> {
  return await httpCatalogo<Ticket[]>('/cliente/tickets').catch(() => [])
}

export async function createTicket(nuevo: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'messages'>): Promise<Ticket> {
  return await httpCatalogo<Ticket>('/cliente/tickets', { method: 'POST', body: nuevo })
}

export async function createPedido(
  items: { id: string; name: string; unitPrice: number; quantity: number }[],
  total: number,
): Promise<Pedido> {
  return await httpCatalogo<Pedido>('/cliente/pedidos', {
    method: 'POST',
    body: { items, total },
  })
}
