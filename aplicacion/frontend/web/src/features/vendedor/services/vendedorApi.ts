import { httpAuth, httpCatalogo, httpOrders } from '../../../services/api/http'
import type { Cliente } from '../../supervisor/services/clientesApi'
import {
  type PerfilCliente,
  type Pedido,
  type Factura,
  type Entrega,
  type Producto,
  type Notificacion,
  type Conversacion,
  type Ticket,
  EstadoPedido,
} from '../../cliente/types'

export type { Producto }

// --- Adaptar endpoints a los de vendedor ---

export async function getPerfilVendedor(): Promise<PerfilCliente | null> {
  // Aquí deberías consultar el endpoint real de perfil de vendedor
  // Ejemplo:
  return await httpAuth<PerfilCliente>('/vendedor/perfil').catch(() => null)
}

export async function getPedidos(page = 1): Promise<{ items: Pedido[]; page: number; totalPages: number }> {
  try {
    // El backend devuelve Pedido[] (array plano)
    // Endpoint: /orders/user/history (devuelve pedidos asociados al usuario como cliente o vendedor)
    const rawOrders = await httpOrders<any[]>('/orders/user/history')

    // Mapear respuesta del backend al formato del frontend
    const mappedOrders: Pedido[] = rawOrders.map(order => ({
      id: order.id,
      orderNumber: order.id.split('-')[0].toUpperCase(), // Usar primeros 8 chars del UUID como número
      createdAt: order.created_at,
      totalAmount: parseFloat(order.total_final),
      status: mapBackendStatusToFrontend(order.estado_actual),
      items: (order.detalles || []).map((d: any) => ({
        id: d.id,
        productName: d.nombre_producto || 'Producto sin nombre',
        quantity: d.cantidad,
        unit: d.unidad_medida || 'UN',
        unitPrice: parseFloat(d.precio_final),
        subtotal: parseFloat(d.precio_final) * d.cantidad
      }))
    }))

    // Simular paginación frontend (ya que el backend devuelve todo)
    return {
      items: mappedOrders,
      page: 1,
      totalPages: 1,
    }
  } catch (error) {
    console.warn('Error fetching vendor orders:', error)
    return {
      items: [],
      page,
      totalPages: 1,
    }
  }
}

function mapBackendStatusToFrontend(status: string): EstadoPedido {
  const s = status.toUpperCase()
  if (s === 'PENDIENTE') return EstadoPedido.PENDING
  if (s === 'APROBADO') return EstadoPedido.APPROVED
  if (s === 'EN_PREPARACION') return EstadoPedido.IN_PREPARATION
  if (s === 'EN_RUTA') return EstadoPedido.IN_TRANSIT
  if (s === 'ENTREGADO') return EstadoPedido.DELIVERED
  if (s === 'ANULADO' || s === 'RECHAZADO') return EstadoPedido.CANCELLED
  return EstadoPedido.PENDING
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
