
import { httpAuth, httpCatalogo, httpOrders } from '../../../services/api/http'
import type { Cliente } from '../../supervisor/services/clientesApi'
import type {
  PerfilCliente,
  Pedido,
  Factura,
  Entrega,
  Producto,
  Notificacion,
  Conversacion,
  Ticket,
} from '../../cliente/types'

// --- Adaptar endpoints a los de vendedor ---

export async function getPerfilVendedor(): Promise<PerfilCliente | null> {
  // Aquí deberías consultar el endpoint real de perfil de vendedor
  // Ejemplo:
  return await httpAuth<PerfilCliente>('/vendedor/perfil').catch(() => null)
}

export async function getPedidos(page = 1): Promise<{ items: Pedido[]; page: number; totalPages: number }> {
  try {
    // Use orders service - vendor can fetch their own orders via /orders/user/history
    const data = await httpOrders<Pedido[]>(`/orders/user/history`).catch(() => null)
    if (!Array.isArray(data)) return { items: [], page, totalPages: 1 }
    return { items: data as Pedido[], page, totalPages: 1 }
  } catch (err) {
    return { items: [], page, totalPages: 1 }
  }
}

export async function getFacturas(): Promise<Factura[]> {
  return await httpCatalogo<Factura[]>('/vendedor/facturas').catch(() => [])
}

export async function getEntregas(): Promise<Entrega[]> {
  return await httpCatalogo<Entrega[]>('/vendedor/entregas').catch(() => [])
}

export async function getProductos(options?: { page?: number; per_page?: number; category?: string; categoryId?: number }): Promise<Producto[]> {
  // Puedes adaptar la lógica según los endpoints de vendedor
  const resp = await httpCatalogo<{ metadata?: any; items?: Producto[] }>(`/api/products?page=${options?.page ?? 1}&per_page=${options?.per_page ?? 20}${options?.category ? `&category=${encodeURIComponent(options.category)}` : ''}`).catch(() => null)
  if (resp && Array.isArray(resp.items)) {
    return resp.items as Producto[]
  }
  return []
}

export async function getProductosPorCliente(clienteId: string, options?: { page?: number; per_page?: number }): Promise<Producto[]> {
  if (!clienteId) return []
  const page = options?.page ?? 1
  const per_page = options?.per_page ?? 50

  // Debug: log entry
  // eslint-disable-next-line no-console
  console.log('[vendedorApi] getProductosPorCliente start', { clienteId, page, per_page })

  // Intentar usar la lista de precios del cliente para listar SOLO productos con precio
  try {
    // Intentar obtener info del cliente (esto puede lanzar 403 si el token no tiene permisos)
    const cliente = await httpCatalogo<any>(`/clientes/${encodeURIComponent(clienteId)}`)
    // eslint-disable-next-line no-console
    console.log('[vendedorApi] cliente info', cliente)
    const listaId = cliente?.lista_precios_id ?? null
    if (listaId) {
      const resp = await httpCatalogo<{ metadata?: any; items?: Producto[] }>(`/precios/lista/${encodeURIComponent(String(listaId))}/productos?page=${page}`)
      // eslint-disable-next-line no-console
      console.log('[vendedorApi] precios.lista response', { listaId, items: Array.isArray(resp?.items) ? resp.items.length : 0 })
      // eslint-disable-next-line no-console
      try {
        console.log('[vendedorApi] precios.lista items sample (raw)', JSON.stringify(resp?.items?.slice ? resp.items.slice(0, 5) : resp?.items, null, 2))
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('[vendedorApi] precios.lista items sample (raw) - stringify failed', resp?.items?.slice ? resp.items.slice(0, 5) : resp?.items)
      }
      if (resp && Array.isArray(resp.items)) return resp.items as Producto[]
    }
  } catch (err: any) {
    // Si recibimos 403, intentamos un fallback público para no bloquear la vista del vendedor.
    // Loguear para facilitar debugging local en devtools.
    // eslint-disable-next-line no-console
    console.warn('[vendedorApi] error fetching precio list or cliente info', err?.status ?? err)
    if (err && err.status === 403) {
      const fallback = await httpCatalogo<{ metadata?: any; items?: Producto[] }>(
        `/api/products?cliente_id=${encodeURIComponent(clienteId)}&page=${page}&per_page=${per_page}`,
        { method: 'GET', auth: false },
      ).catch(() => null)
      // eslint-disable-next-line no-console
      console.log('[vendedorApi] fallback public products response', { items: Array.isArray(fallback?.items) ? fallback.items.length : 0 })
      if (fallback && Array.isArray(fallback.items)) return fallback.items as Producto[]
    }
  }

  // Fallback por defecto: solicitar productos por cliente (primero con auth, luego sin auth)
  let resp = await httpCatalogo<{ metadata?: any; items?: Producto[] }>(`/api/products?cliente_id=${encodeURIComponent(clienteId)}&page=${page}&per_page=${per_page}`).catch(() => null)
  if ((!resp || !Array.isArray(resp.items))) {
    resp = await httpCatalogo<{ metadata?: any; items?: Producto[] }>(
      `/api/products?cliente_id=${encodeURIComponent(clienteId)}&page=${page}&per_page=${per_page}`,
      { method: 'GET', auth: false },
    ).catch(() => null)
  }

  // eslint-disable-next-line no-console
  console.log('[vendedorApi] products final response', { items: Array.isArray(resp?.items) ? resp.items.length : 0 })
  if (resp && Array.isArray(resp.items)) return resp.items as Producto[]
  return []
}

export async function getNotificaciones(): Promise<Notificacion[]> {
  return await httpCatalogo<Notificacion[]>('/vendedor/notificaciones').catch(() => [])
}

export async function getConversaciones(): Promise<Conversacion[]> {
  return await httpCatalogo<Conversacion[]>('/vendedor/conversaciones').catch(() => [])
}

export async function getTickets(): Promise<Ticket[]> {
  return await httpCatalogo<Ticket[]>('/vendedor/tickets').catch(() => [])
}

export async function getClientesAsignados(): Promise<Cliente[]> {
  return httpCatalogo<Cliente[]>('/clientes/mis')
}

// --- Sucursales ---
export async function getSucursales(): Promise<any[]> {
  // Lista todas las sucursales del sistema
  return httpCatalogo<any[]>('/api/sucursales').catch(() => [])
}

export async function getSucursalesPorCliente(clienteId: string): Promise<any[]> {
  if (!clienteId) return []
  return httpCatalogo<any[]>(`/api/clientes/${encodeURIComponent(clienteId)}/sucursales`).catch(() => [])
}

export async function createTicket(nuevo: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'messages'>): Promise<Ticket> {
  return await httpCatalogo<Ticket>('/vendedor/tickets', { method: 'POST', body: nuevo })
}

export async function createPedido(
  items: { id: string; name: string; unitPrice: number; quantity: number }[],
  total: number,
): Promise<Pedido> {
  return await httpCatalogo<Pedido>('/vendedor/pedidos', {
    method: 'POST',
    body: { items, total },
  })
}

type CondicionPago = 'CONTADO' | 'CREDITO' | 'TRANSFERENCIA' | 'CHEQUE'

export async function createPedidoFromCartCliente(
  clienteId: string,
  options: { condicionPago: CondicionPago; sucursalId?: string | null },
): Promise<Pedido> {
  if (!clienteId) throw new Error('Cliente inválido')
  const payload: Record<string, unknown> = { condicion_pago: options.condicionPago }
  if (options.sucursalId) payload.sucursal_id = options.sucursalId
  return await httpOrders<Pedido>(`/orders/from-cart/client/${clienteId}`, {
    method: 'POST',
    body: payload,
  })
}
