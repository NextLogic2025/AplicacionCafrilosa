import { httpCatalogo, httpUsuarios, httpOrders } from '../../../services/api/http'
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
  EstadoPedido,
  SucursalCliente,
} from '../types'

type ClienteContext = {
  usuarioId: string | null
  clienteId: string | null
  listaPreciosId: number | null
  usuario?: Record<string, unknown> | null
}

let cachedContext: ClienteContext | null = null
let contextPromise: Promise<ClienteContext | null> | null = null

function decodeTokenSub(): string | null {
  const token = getToken()
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const decode = (globalThis as any).atob
    if (typeof decode !== 'function') return null
    const payload = JSON.parse(decode(base64)) as Record<string, unknown>
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}

export async function getClienteContext(forceRefresh = false): Promise<ClienteContext | null> {
  if (!forceRefresh && cachedContext) return cachedContext
  if (!forceRefresh && contextPromise) return contextPromise

  contextPromise = (async () => {
    try {
      const me = await httpUsuarios<Record<string, unknown>>('/usuarios/me').catch(() => null)
      let usuarioId = typeof me?.id === 'string' ? (me.id as string) : null
      if (!usuarioId && typeof me?.sub === 'string') usuarioId = me.sub as string
      if (!usuarioId) usuarioId = decodeTokenSub()

      if (!usuarioId) {
        cachedContext = { usuarioId: null, clienteId: null, listaPreciosId: null, usuario: me }
        return cachedContext
      }

      let clienteId: string | null = null
      let listaPreciosId: number | null = null
      const internal = await httpCatalogo<Record<string, unknown>>(`/internal/clients/by-user/${usuarioId}`).catch(() => null)
      if (internal) {
        if (typeof internal.id === 'string') clienteId = internal.id
        if (internal.lista_precios_id != null) listaPreciosId = Number(internal.lista_precios_id)
      }

      const context: ClienteContext = {
        usuarioId,
        clienteId,
        listaPreciosId,
        usuario: me,
      }
      cachedContext = context
      return context
    } finally {
      contextPromise = null
    }
  })()

  return contextPromise
}

export function clearClienteContextCache() {
  cachedContext = null
}

async function fetchClienteDetalleByCandidates(candidates: (string | null | undefined)[]): Promise<any | null> {
  for (const candidate of candidates) {
    if (!candidate) continue
    const data = await httpCatalogo<any>(`/clientes/${candidate}`).catch(() => null)
    if (data) return data
  }
  return null
}

export async function fetchClienteByUsuarioId(possibleId: string) {
  const ctx = await getClienteContext()
  const candidates = [ctx?.clienteId, possibleId, ctx?.usuarioId]
  return fetchClienteDetalleByCandidates(candidates)
}

export async function getPerfilCliente(): Promise<PerfilCliente | null> {
  const ctx = await getClienteContext()
  if (!ctx?.usuarioId) return null

  const cliente = await fetchClienteByUsuarioId(ctx.clienteId ?? ctx.usuarioId)
  if (cliente) {
    return {
      id: String(cliente.id ?? ctx.clienteId ?? ctx.usuarioId),
      contactName: (cliente.razon_social ?? cliente.nombre_comercial ?? ctx.usuario?.nombreCompleto ?? ctx.usuario?.email ?? '') as string,
      currentDebt: cliente.saldo_actual ? Number(cliente.saldo_actual) : 0,
      creditLimit: cliente.limite_credito ? Number(cliente.limite_credito) : 0,
    }
  }

  const fallbackName = (ctx.usuario?.nombreCompleto ?? ctx.usuario?.email ?? '') as string
  return {
    id: String(ctx.usuarioId),
    contactName: fallbackName,
    currentDebt: 0,
    creditLimit: 0,
  }
}

export async function getPedidos(page = 1): Promise<{ items: Pedido[]; page: number; totalPages: number }> {
  const ctx = await getClienteContext()
  console.log('[clientApi] getPedidos -> /orders/user/history')
  let data = await httpOrders<any[]>('/orders/user/history').catch((err) => {
    console.warn('[clientApi] /orders/user/history failed', err)
    return null
  })
  const fallbackId = ctx?.clienteId ?? ctx?.usuarioId
  const callFallback = async () => {
    if (!fallbackId) return null
    console.log('[clientApi] getPedidos fallback -> /orders/client/' + fallbackId)
    return await httpOrders<any[]>(`/orders/client/${fallbackId}`).catch((err) => {
      console.warn('[clientApi] /orders/client fallback failed', err)
      return null
    })
  }

  if (!Array.isArray(data)) {
    data = await callFallback()
  }

  if (Array.isArray(data) && data.length === 0 && fallbackId) {
    console.log('[clientApi] getPedidos recibió 0 pedidos, intentando fallback explícito')
    const fallbackData = await callFallback()
    if (Array.isArray(fallbackData) && fallbackData.length > 0) data = fallbackData
  }

  if (!Array.isArray(data)) {
    console.warn('[clientApi] getPedidos result no es array, devolveremos lista vacía')
    return { items: [], page, totalPages: 1 }
  }

  console.log('[clientApi] getPedidos recibió', data.length, 'pedidos')

  const items = data.map(mapPedidoFromBackend)
  return { items, page: 1, totalPages: 1 }
}

export async function getPedidoDetalle(pedidoId: string): Promise<Pedido> {
  if (!pedidoId) throw new Error('Pedido inválido')
  const detalle = await httpOrders<any>(`/orders/${pedidoId}`).catch((err) => {
    console.warn('[clientApi] getPedidoDetalle failed', err)
    return null
  })
  if (!detalle) throw new Error('No se pudo obtener el detalle del pedido')
  console.log('[clientApi] getPedidoDetalle - raw detalle:', detalle)
  // Map backend structure to normalized Pedido
  const mapped = mapPedidoFromBackend(detalle)
  console.log('[clientApi] getPedidoDetalle - mapped:', mapped)

  // Try to enrich mapped items: if productName looks like an ID or is empty, attempt to resolve via Catalogo
  async function fetchProductNameById(id: string): Promise<string | null> {
    if (!id) return null
    const candidates = [`/productos/${encodeURIComponent(id)}`, `/products/${encodeURIComponent(id)}`, `/products?ids=${encodeURIComponent(id)}`]
    for (const path of candidates) {
      try {
        const p = await httpCatalogo<any>(path).catch(() => null)
        if (!p) continue
        // p may be a single product or an object with items
        if (p?.id && (p?.nombre || p?.name)) return String(p.nombre ?? p.name)
        if (Array.isArray(p?.items) && p.items.length > 0) {
          const found = p.items[0]
          if (found?.nombre || found?.name) return String(found.nombre ?? found.name)
        }
      } catch {
        // ignore and try next
      }
    }
    return null
  }

  const needResolveIds = mapped.items
    .filter(it => !it.productName || /^[0-9a-fA-F-]{8,}$/.test(String(it.productName)))
    .map(it => String(it.id))
    .filter(Boolean)

  if (needResolveIds.length > 0) {
    try {
      const uniqueIds = Array.from(new Set(needResolveIds))
      const results = await Promise.allSettled(uniqueIds.map(id => fetchProductNameById(id)))
      const nameById: Record<string, string> = {}
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled' && r.value) nameById[uniqueIds[idx]] = r.value as string
      })
      // apply resolved names
      mapped.items = mapped.items.map(it => ({
        ...it,
        productName: (nameById[String(it.id)] ?? it.productName ?? String(it.id))
      }))
    } catch (e) {
      // ignore resolution errors
    }
  }

  // Enrich cliente info if missing in detalle
  if (!detalle?.cliente_info && (detalle?.cliente_id || detalle?.cliente || detalle?.usuario_id)) {
    try {
      const fetched = await fetchClienteDetalleByCandidates([detalle?.cliente_id, detalle?.cliente, detalle?.usuario_id])
      if (fetched) {
        // merge cliente_info into detalle so UI components can access it
        detalle.cliente_info = { ...(detalle.cliente_info ?? {}), ...fetched }
      }
    } catch {
      // ignore
    }
  }

  // Return merged object: include raw detalle and mapped normalized fields (mapped.items assigned)
  return Object.assign({}, detalle, mapped, { items: mapped.items })
}

export async function deletePedido(orderId: string): Promise<boolean> {
  if (!orderId) return false
  if (!orderId) return false

  // Prefer explicit cancel/status endpoints on orders service (see README)
  try {
    console.log('[clientApi] deletePedido - request PATCH cancel', `/orders/${orderId}/cancel`)
    await httpOrders(`/orders/${orderId}/cancel`, {
      method: 'PATCH',
      body: { nuevoEstado: 'CANCELADO', comentario: 'Cancelado desde portal cliente' },
    })
    console.log('[clientApi] deletePedido - cancel PATCH succeeded', orderId)
    return true
  } catch (e) {
    console.warn('[clientApi] deletePedido - PATCH cancel failed, trying status endpoint', orderId)
    try {
      console.log('[clientApi] deletePedido - request PATCH status', `/orders/${orderId}/status`)
      await httpOrders(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { nuevoEstado: 'CANCELADO', comentario: 'Cancelado desde portal cliente' },
      })
      console.log('[clientApi] deletePedido - status PATCH succeeded', orderId)
      return true
    } catch (ee) {
      console.warn('[clientApi] deletePedido - status PATCH failed, attempting legacy fallbacks', orderId)
      try {
        console.log('[clientApi] deletePedido - request DELETE', `/orders/${orderId}`)
        await httpOrders(`/orders/${orderId}`, { method: 'DELETE' })
        console.log('[clientApi] deletePedido - deleted', orderId)
        return true
      } catch {
        try {
          console.log('[clientApi] deletePedido - request POST cancel', `/orders/${orderId}/cancel`)
          await httpOrders(`/orders/${orderId}/cancel`, { method: 'POST' })
          console.log('[clientApi] deletePedido - cancel POST succeeded', orderId)
          return true
        } catch (eee) {
          try {
            if (eee instanceof Error) console.warn('[clientApi] deletePedido - error', eee.message)
            if (eee && typeof (eee as any).payload !== 'undefined') console.warn('[clientApi] deletePedido - payload', (eee as any).payload)
          } catch (_) {}
          return false
        }
      }
    }
  }
}

export async function getFacturas(): Promise<Factura[]> {
  return []
}

export async function getEntregas(): Promise<Entrega[]> {
  return []
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
  return []
}

export async function getConversaciones(): Promise<Conversacion[]> {
  return []
}

export async function getTickets(): Promise<Ticket[]> {
  return []
}

export async function getSucursalesCliente(): Promise<SucursalCliente[]> {
  const ctx = await getClienteContext()
  const clienteId = ctx?.clienteId ?? ctx?.usuarioId
  if (!clienteId) return []
  const data = await httpCatalogo<any[]>(`/clientes/${encodeURIComponent(clienteId)}/sucursales`).catch(() => [])
  if (!Array.isArray(data)) return []
  const mappedRaw = data.map(sucursal => {
    const id = sucursal?.id ?? sucursal?.sucursal_id
    if (!id) return null
    return {
      id: String(id),
      nombre: String(
        sucursal?.nombre_sucursal ??
          sucursal?.nombre ??
          sucursal?.alias ??
          (sucursal?.contacto_nombre ? `Sucursal ${sucursal.contacto_nombre}` : 'Sucursal'),
      ),
      direccion: sucursal?.direccion_entrega ?? sucursal?.direccion ?? sucursal?.direccion_exacta ?? null,
      ciudad: sucursal?.municipio ?? sucursal?.ciudad ?? null,
      estado: sucursal?.departamento ?? sucursal?.estado ?? null,
    }
  })
  return mappedRaw.filter(Boolean) as SucursalCliente[]
}

export async function createTicket(_: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'messages'>): Promise<Ticket> {
  throw new Error('La creación de tickets no está disponible en este entorno')
}

export async function createPedido(
  items: { id: string; name: string; unitPrice: number; quantity: number }[],
  total: number,
): Promise<Pedido> {
  const ctx = await getClienteContext()
  if (!ctx?.usuarioId) throw new Error('No se encontró el usuario autenticado')

  const cliente = await fetchClienteByUsuarioId(ctx.clienteId ?? ctx.usuarioId).catch(() => null)
  const vendedorId = cliente?.vendedor_asignado_id ? String(cliente.vendedor_asignado_id) : ctx.usuarioId

  const payload = {
    cliente_id: ctx.usuarioId,
    vendedor_id: vendedorId,
    items: items.map((item) => ({
      producto_id: item.id,
      cantidad: item.quantity,
      precio_unitario: item.unitPrice,
      precio_original: item.unitPrice,
      nombre_producto: item.name,
    })),
    descuento_total: Math.max(0, items.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0) - total),
    origen_pedido: 'PORTAL_CLIENTE',
  }

  const backend = await httpOrders<any>('/orders', { method: 'POST', body: payload }).catch(() => null)
  if (!backend) throw new Error('No se pudo crear el pedido')
  return mapPedidoFromBackend(backend)
}

type CondicionPago = 'CONTADO' | 'CREDITO' | 'TRANSFERENCIA' | 'CHEQUE'

export async function createPedidoFromCart(options?: { condicionPago?: CondicionPago; sucursalId?: string | null }): Promise<Pedido> {
  const ctx = await getClienteContext()
  if (!ctx?.usuarioId) throw new Error('No se encontró el usuario autenticado')

  // Read local cart stored by CartContext
  let cartItems: any[] = []
  try {
    const raw = localStorage.getItem('cafrilosa:cart')
    cartItems = raw ? JSON.parse(raw) : []
  } catch {
    cartItems = []
  }

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error('El carrito está vacío')
  }

  const condicionPago: CondicionPago = options?.condicionPago ?? 'CONTADO'
  const payload: Record<string, unknown> = { condicion_pago: condicionPago }
  if (options?.sucursalId) payload.sucursal_id = options.sucursalId

  const backend = await httpOrders<any>('/orders/from-cart/me', { method: 'POST', body: payload }).catch((err) => {
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Error al crear pedido en el servidor')
  })
  if (!backend) throw new Error('No se pudo crear el pedido')
  return mapPedidoFromBackend(backend)
}

function mapPedidoFromBackend(raw: any): Pedido {
  const detalles = Array.isArray(raw?.detalles) ? raw.detalles : []
  return {
    id: String(raw?.id ?? ''),
    orderNumber: String(raw?.codigo_visual ?? raw?.id ?? ''),
    createdAt: String(raw?.created_at ?? new Date().toISOString()),
    totalAmount: Number(raw?.total_final ?? 0),
    status: String(raw?.estado_actual ?? 'PENDIENTE').toUpperCase() as EstadoPedido,
    items: detalles.map((detalle: any) => {
      const unitPrice = Number(detalle?.precio_final ?? detalle?.precio_unitario ?? detalle?.precio ?? 0)
      const quantity = Number(detalle?.cantidad ?? detalle?.qty ?? detalle?.quantity ?? 0)

      const productName = (
        detalle?.nombre_producto ?? detalle?.producto_nombre ?? detalle?.nombre ??
        detalle?.producto?.nombre ?? detalle?.producto?.nombre_producto ?? detalle?.producto?.titulo ??
        detalle?.producto_id ?? detalle?.producto ?? detalle?.id ?? ''
      )

      return {
        id: String(detalle?.id ?? detalle?.producto_id ?? detalle?.producto ?? ''),
        productName: String(productName),
        quantity,
        unit: String(detalle?.unidad_medida ?? 'UN'),
        unitPrice,
        subtotal: unitPrice * quantity,
      }
    }),
  }
}
