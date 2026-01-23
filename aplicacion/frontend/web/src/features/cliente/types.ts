import { BRAND_COLORS } from '@cafrilosa/shared-types'

export type PrioridadTicket = 'low' | 'medium' | 'high'

export interface PerfilCliente {
  id: string
  contactName: string
  currentDebt: number
  creditLimit: number
  direccion?: string
  direccion_texto?: string
  ciudad?: string
  estado?: string
}

export interface SucursalCliente {
  id: string
  nombre: string
  direccion?: string | null
  ciudad?: string | null
  estado?: string | null
}

export interface Producto {
  id: string
  name: string
  description: string
  // `price` represents the effective unit price the customer will pay
  price: number
  // Optional fields provided by the catalog service when there are promotions
  precio_original?: number | null
  precio_oferta?: number | null
  ahorro?: number | null
  promociones?: any[]
  campania_aplicada_id?: number | null
  image?: string
  category: string
  inStock: boolean
  rating?: number
  reviews?: number
}

export enum EstadoFactura {
  PAID = 'PAID',
  PENDING = 'PENDING',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export interface ItemFactura {
  id: string
  productId: string
  quantity: number
  unitPrice: number
}

export interface Factura {
  id: string
  invoiceNumber: string
  date: string
  dueDate: string
  status: EstadoFactura
  total: number
  items: ItemFactura[]
  customerId: string
  notes?: string
}

export type EstadoEntrega = 'pending' | 'in_transit' | 'delivered' | 'issue'

export interface Entrega {
  id: string
  orderId: string
  customerId: string
  address: string
  city: string
  state: string
  zipCode: string
  deliveryDate: string
  estimatedDeliveryDate: string
  currentStatus?: EstadoEntrega
  trackingNumber?: string
  carrier?: string
  notes?: string
}

export enum EstadoPedido {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  IN_PREPARATION = 'IN_PREPARATION',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface ItemPedido {
  id: string
  productName: string
  quantity: number
  unit: string
  unitPrice: number
  subtotal: number
  cantidad_solicitada?: number | null
  motivo_ajuste?: string | null
}

export interface Pedido {
  id: string
  orderNumber: string
  createdAt: string
  totalAmount: number
  status: EstadoPedido
  items: ItemPedido[]
}

export enum TipoNotificacion {
  ORDER = 'ORDER',
  INVOICE = 'INVOICE',
  DELIVERY = 'DELIVERY',
  PROMOTIONAL = 'PROMOTIONAL',
  SYSTEM = 'SYSTEM',
  SUPPORT = 'SUPPORT',
}

export interface Notificacion {
  id: string
  customerId: string
  type: TipoNotificacion
  title: string
  message: string
  read: boolean
  createdAt: string
  relatedId?: string | null
}

export interface Conversacion {
  id: string
  vendorName: string
  lastMessage?: string
  unreadCount: number
}

export interface Mensaje {
  id: string
  content: string
  createdAt: string
  isOwn?: boolean
}

export enum EstadoTicket {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export interface MensajeTicket {
  id: string
  ticketId: string
  senderName: string
  message: string
  sentAt: string
  isCustomer: boolean
}

export interface Ticket {
  id: string
  title: string
  description: string
  category: string
  priority: PrioridadTicket
  status: EstadoTicket
  customerId: string
  createdAt: string
  updatedAt: string
  messages: MensajeTicket[]
}

export const COLORES_MARCA = BRAND_COLORS
