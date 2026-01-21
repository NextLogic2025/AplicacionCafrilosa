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
      console.log('[clientApi] fetching /usuarios/me...')
      const me = await httpUsuarios<Record<string, unknown>>('/usuarios/me').catch((e) => {
        console.error('[clientApi] /usuarios/me failed', e)
        return null
      })
      console.log('[clientApi] /usuarios/me result:', me)

      // Log the token to see what user we have
      const token = getToken()
      if (token) {
        try {
          const parts = token.split('.')
          if (parts.length >= 2) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
            console.log('[clientApi] Decoded JWT payload:', payload)
          }
        } catch (e) {
          console.error('[clientApi] Failed to decode token', e)
        }
      }

      let usuarioId = typeof me?.id === 'string' ? (me.id as string) : null
      if (!usuarioId && typeof me?.sub === 'string') usuarioId = me.sub as string
      if (!usuarioId) usuarioId = decodeTokenSub()

      if (!usuarioId) {
        console.warn('[clientApi] No usuarioId found')
        cachedContext = { usuarioId: null, clienteId: null, listaPreciosId: null, usuario: me }
        return cachedContext
      }

      let clienteId: string | null = null
      let listaPreciosId: number | null = null
      const internal = await httpCatalogo<Record<string, unknown>>(`/internal/clients/by-user/${usuarioId}`).catch((e) => {
        console.error('[clientApi] internal/clients/by-user failed', e)
        return null
      })
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
      console.log('[clientApi] Context resolved:', context)
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
      direccion: cliente.direccion ?? cliente.direccion_entrega ?? undefined,
      direccion_texto: cliente.direccion_texto ?? undefined,
      ciudad: cliente.ciudad ?? cliente.municipio ?? undefined,
      estado: cliente.estado ?? cliente.departamento ?? undefined,
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
  console.log('[clientApi] getPedidos start')
  const ctx = await getClienteContext()
  console.log('[clientApi] getPedidos context:', ctx)
  let data = await httpOrders<any[]>('/orders/user/history').catch((err) => {
    console.error('[clientApi] /orders/user/history failed', err)
    return null
  })
  const fallbackId = ctx?.clienteId ?? ctx?.usuarioId
  const callFallback = async () => {
    if (!fallbackId) return null
    return await httpOrders<any[]>(`/orders/client/${fallbackId}`).catch(() => null)
  }

  if (!Array.isArray(data)) {
    data = await callFallback()
  }

  if (Array.isArray(data) && data.length === 0 && fallbackId) {
    const fallbackData = await callFallback()
    if (Array.isArray(fallbackData) && fallbackData.length > 0) data = fallbackData
  }

  if (!Array.isArray(data)) {
    return { items: [], page, totalPages: 1 }
  }

  const items = data.map(mapPedidoFromBackend)
  return { items, page: 1, totalPages: 1 }
}

export async function getPedidoDetalle(pedidoId: string): Promise<Pedido> {
  if (!pedidoId) throw new Error('Pedido inválido')
  const detalle = await httpOrders<any>(`/orders/${pedidoId}`).catch(() => null)
  if (!detalle) throw new Error('No se pudo obtener el detalle del pedido')
  return mapPedidoFromBackend(detalle)
}

export async function deletePedido(orderId: string): Promise<boolean> {
  if (!orderId) return false
  if (!orderId) return false

  // Prefer explicit cancel/status endpoints on orders service (see README)
  try {
    await httpOrders(`/orders/${orderId}/cancel`, {
      method: 'PATCH',
      body: { nuevoEstado: 'CANCELADO', comentario: 'Cancelado desde portal cliente' },
    })
    return true
  } catch (e) {
    try {
      await httpOrders(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { nuevoEstado: 'CANCELADO', comentario: 'Cancelado desde portal cliente' },
      })
      return true
    } catch (ee) {
      try {
        await httpOrders(`/orders/${orderId}`, { method: 'DELETE' })
        return true
      } catch {
        try {
          await httpOrders(`/orders/${orderId}/cancel`, { method: 'POST' })
          return true
        } catch (eee) {
          try {
            if (eee && typeof (eee as any).payload !== 'undefined') console.warn('[clientApi] deletePedido - payload', (eee as any).payload)
          } catch (_) { }
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
  // Usar el endpoint correcto de precios para clientes
  const page = options?.page ?? 1
  const perPage = options?.per_page ?? 20

  // Endpoint correcto: /precios/mis-precios/productos (el controller es 'precios', el método 'mis-precios/productos')
  // Nota: httpCatalogo ya base, pero si requerimos /api/ explícito o no depende de main.ts. 
  // La llamada anterior usaba /api/precios..., voy a asumir que se necesita /precios/mis-precios/productos
  // Si el backend usa 'api' global prefix, podría ser /api/precios/mis-precios/productos via gateway o directo.
  // El error 404 fue en /api/precios/cliente/productos.
  // Probemos cambiar a /precios/mis-precios/productos asumiendo que el proxy maneja el base.
  // O mantengamos /api si es necesario (el error mostrava /api).
  let url = `/precios/mis-precios/productos?page=${page}&per_page=${perPage}`

  // Si hay categoryId, agregarlo como parámetro
  if (options?.categoryId != null) {
    url += `&categoria_id=${options.categoryId}`
  } else if (options?.category && options.category !== 'all') {
    url += `&category=${encodeURIComponent(options.category)}`
  }

  console.log('[clientApi] getProductos - Calling URL:', url)
  console.log('[clientApi] getProductos - Options:', options)

  const catalogResp = await httpCatalogo<{ metadata?: any; items?: any[] }>(url).catch((err) => {
    console.error('[clientApi] getProductos error', err)
    return null
  })

  console.log('[clientApi] getProductos - Response:', catalogResp)

  if (catalogResp && Array.isArray(catalogResp.items)) {
    const mapped = catalogResp.items.map((p: any) => {
      // El backend devuelve precio_lista y promociones
      const precioLista = typeof p.precio_lista === 'number' ? p.precio_lista : 0

      // Calcular precio de oferta desde promociones
      let precioOferta: number | null = null
      if (Array.isArray(p.promociones) && p.promociones.length > 0) {
        // Tomar la primera promoción (o la mejor oferta)
        const promo = p.promociones[0]
        if (typeof promo.precio_oferta === 'number') {
          precioOferta = promo.precio_oferta
        }
      }

      const effectivePrice = precioOferta != null ? precioOferta : precioLista
      const ahorro = precioOferta != null && precioLista > 0 ? Math.round((precioLista - precioOferta) * 100) / 100 : null

      return ({
        id: p.id,
        name: (p.nombre ?? p.codigo_sku ?? '').toString(),
        description: (p.descripcion ?? '') as string,
        price: effectivePrice,
        precio_original: precioLista,
        precio_oferta: precioOferta,
        ahorro: ahorro,
        promociones: Array.isArray(p.promociones) ? p.promociones : [],
        campania_aplicada_id: p.promociones?.[0]?.campana_id ?? null,
        image: p.imagen_url ?? null,
        category: (p.categoria && (p.categoria.nombre ?? p.categoria)) ?? '',
        inStock: Boolean(p.activo ?? true),
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
  const perfil = await getPerfilCliente()
  const clienteId = perfil?.id
  console.log('[clientApi] getSucursalesCliente - Start', { perfil, clienteId })

  if (!clienteId) {
    console.warn('[clientApi] No clienteId found (via getPerfilCliente) for sucursales')
    return []
  }

  const url = `/clientes/${encodeURIComponent(clienteId)}/sucursales`
  console.log('[clientApi] Fetching sucursales from:', url)

  const data = await httpCatalogo<any[]>(url).catch((err) => {
    console.error('[clientApi] getSucursalesCliente error', err)
    return []
  })

  console.log('[clientApi] Raw sucursales data:', data)

  if (!Array.isArray(data)) return []

  const mapped = data
    .map((sucursal): SucursalCliente | null => {
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
    .filter((s): s is SucursalCliente => s !== null)

  console.log('[clientApi] Mapped sucursales:', mapped)
  return mapped
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
  const payload: Record<string, unknown> = { forma_pago_solicitada: condicionPago }
  if (options?.sucursalId) payload.sucursal_id = options.sucursalId

  console.log('[clientApi] createPedidoFromCart - Payload:', payload)

  const backend = await httpOrders<any>('/orders/from-cart/me', { method: 'POST', body: payload }).catch((err) => {
    console.error('[clientApi] createPedidoFromCart - Error:', err)
    console.error('[clientApi] createPedidoFromCart - Error message:', err?.message)
    console.error('[clientApi] createPedidoFromCart - Error response:', err?.response)
    if (err instanceof Error) throw new Error(err.message)
    throw new Error('Error al crear pedido en el servidor')
  })
  if (!backend) throw new Error('No se pudo crear el pedido')
  return mapPedidoFromBackend(backend)
}

function mapPedidoFromBackend(raw: any): Pedido {
  // DEBUG: Log raw backend response for order details
  if (raw && raw.detalles && raw.detalles.length > 0) {
    console.log('[clientApi] mapPedidoFromBackend - Raw Details Sample:', raw.detalles[0]);
  }

  const detalles = Array.isArray(raw?.detalles) ? raw.detalles : []
  return {
    id: String(raw?.id ?? ''),
    orderNumber: String(raw?.codigo_visual ?? raw?.id ?? ''),
    createdAt: String(raw?.created_at ?? new Date().toISOString()),
    totalAmount: Number(raw?.total_final ?? 0),
    status: String(raw?.estado_actual ?? 'PENDIENTE').toUpperCase() as EstadoPedido,
    items: detalles.map((detalle: any) => {
      const unitPrice = Number(detalle?.precio_final ?? detalle?.precio_unitario ?? 0)
      const quantity = Number(detalle?.cantidad ?? 0)

      const cantidadSolicitada = detalle?.cantidad_solicitada ? Number(detalle.cantidad_solicitada) : null
      const motivoAjuste = detalle?.motivo_ajuste ? String(detalle.motivo_ajuste) : null

      return {
        id: String(detalle?.id ?? detalle?.producto_id ?? ''),
        productName: String(detalle?.nombre_producto ?? detalle?.producto_id ?? ''),
        quantity,
        unit: String(detalle?.unidad_medida ?? 'UN'),
        unitPrice,
        subtotal: unitPrice * quantity,
        cantidad_solicitada: cantidadSolicitada,
        motivo_ajuste: motivoAjuste,
      }
    }),
  }
}
