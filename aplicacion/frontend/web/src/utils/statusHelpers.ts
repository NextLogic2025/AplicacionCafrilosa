import { EstadoPedido, EstadoFactura, EstadoTicket, PrioridadTicket } from '../features/cliente/types'

// Formateo de estados de pedido
export function formatEstadoPedido(estado: EstadoPedido): string {
  const labels: Record<EstadoPedido, string> = {
    [EstadoPedido.PENDING]: 'Pendiente',
    [EstadoPedido.APPROVED]: 'Aprobado',
    [EstadoPedido.IN_PREPARATION]: 'En preparación',
    [EstadoPedido.IN_TRANSIT]: 'En ruta',
    [EstadoPedido.DELIVERED]: 'Entregado',
    [EstadoPedido.CANCELLED]: 'Cancelado',
  }
  return labels[estado] || estado
}

// Colores para estados de pedido
export function getEstadoPedidoColor(estado: EstadoPedido): string {
  const colores: Record<EstadoPedido, string> = {
    [EstadoPedido.PENDING]: '#fbbf24',
    [EstadoPedido.APPROVED]: '#10b981',
    [EstadoPedido.IN_PREPARATION]: '#3b82f6',
    [EstadoPedido.IN_TRANSIT]: '#8b5cf6',
    [EstadoPedido.DELIVERED]: '#059669',
    [EstadoPedido.CANCELLED]: '#ef4444',
  }
  return colores[estado] || '#6b7280'
}

// Config de estados de factura
export const facturaStatusConfig: Record<EstadoFactura, { label: string; color: string }> = {
  [EstadoFactura.PAID]: { label: 'Pagada', color: 'bg-emerald-100 text-emerald-800' },
  [EstadoFactura.PENDING]: { label: 'Pendiente', color: 'bg-blue-100 text-blue-800' },
  [EstadoFactura.OVERDUE]: { label: 'Vencida', color: 'bg-red-100 text-red-800' },
  [EstadoFactura.CANCELLED]: { label: 'Cancelada', color: 'bg-gray-100 text-gray-800' },
}

// Config de estados de ticket
export const ticketStatusConfig: Record<EstadoTicket, { label: string; color: string }> = {
  [EstadoTicket.OPEN]: { label: 'Abierto', color: 'bg-blue-100 text-blue-800' },
  [EstadoTicket.IN_PROGRESS]: { label: 'En proceso', color: 'bg-yellow-100 text-yellow-800' },
  [EstadoTicket.RESOLVED]: { label: 'Resuelto', color: 'bg-emerald-100 text-emerald-800' },
  [EstadoTicket.CLOSED]: { label: 'Cerrado', color: 'bg-gray-100 text-gray-800' },
}

// Config de prioridad de ticket
export const ticketPriorityConfig: Record<PrioridadTicket, { label: string; color: string; bg: string }> = {
  low: { label: 'Baja', color: 'text-gray-600', bg: 'bg-gray-100' },
  medium: { label: 'Media', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  high: { label: 'Alta', color: 'text-brand-red', bg: 'bg-red-100' },
}
