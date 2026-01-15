import { http } from '../api/http'
import type {
  PerfilCliente,
  Pedido,
  Factura,
  Entrega,
  Producto,
  Notificacion,
  Conversacion,
  Ticket,
} from '../../features/cliente/types'

export async function getPerfilCliente(): Promise<PerfilCliente | null> {
  return (await http<PerfilCliente>('/cliente/perfil').catch(() => null))
}

export async function getPedidos(page = 1): Promise<{ items: Pedido[]; page: number; totalPages: number }> {
  return await http<{ items: Pedido[]; page: number; totalPages: number }>(`/cliente/pedidos?page=${page}`).catch(() => ({
    items: [],
    page,
    totalPages: 1,
  }))
}

export async function getFacturas(): Promise<Factura[]> {
  return await http<Factura[]>('/cliente/facturas').catch(() => [])
}

export async function getEntregas(): Promise<Entrega[]> {
  return await http<Entrega[]>('/cliente/entregas').catch(() => [])
}

export async function getProductos(): Promise<Producto[]> {
  return await http<Producto[]>('/cliente/productos').catch(() => [])
}

export async function getNotificaciones(): Promise<Notificacion[]> {
  return await http<Notificacion[]>('/cliente/notificaciones').catch(() => [])
}

export async function getConversaciones(): Promise<Conversacion[]> {
  return await http<Conversacion[]>('/cliente/conversaciones').catch(() => [])
}

export async function getTickets(): Promise<Ticket[]> {
  return await http<Ticket[]>('/cliente/tickets').catch(() => [])
}

export async function createTicket(nuevo: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'messages'>): Promise<Ticket> {
  return await http<Ticket>('/cliente/tickets', { method: 'POST', body: nuevo })
}

export async function createPedido(
  items: { id: string; name: string; unitPrice: number; quantity: number }[],
  total: number,
): Promise<Pedido> {
  return await http<Pedido>('/cliente/pedidos', {
    method: 'POST',
    body: { items, total },
  })
}
