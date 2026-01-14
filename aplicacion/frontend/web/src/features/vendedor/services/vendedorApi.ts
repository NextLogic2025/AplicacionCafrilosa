
import { httpAuth, httpCatalogo } from '../../../services/api/http'
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
  return await httpCatalogo<{ items: Pedido[]; page: number; totalPages: number }>(`/vendedor/pedidos?page=${page}`).catch(() => ({
    items: [],
    page,
    totalPages: 1,
  }))
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
  const resp = await httpCatalogo<{ metadata?: any; items?: Producto[] }>(`/api/products?cliente_id=${encodeURIComponent(clienteId)}&page=${page}&per_page=${per_page}`).catch(() => null)
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
