export enum EstadoLote {
  ACTIVO = 'ACTIVO',
  BLOQUEADO = 'BLOQUEADO',
  VENCIDO = 'VENCIDO',
}

export enum EstadoPedidoBodega {
  APROBADO = 'APROBADO',
  EN_PREPARACION = 'EN_PREPARACION',
  PREPARADO = 'PREPARADO',
  DESPACHADO = 'DESPACHADO',
}

export enum EstadoDevolucion {
  SOLICITADA = 'SOLICITADA',
  VALIDADA = 'VALIDADA',
  REINGRESADA = 'REINGRESADA',
  RECHAZADA = 'RECHAZADA',
}

export enum TipoMovimiento {
  RECEPCION = 'RECEPCION',
  DESPACHO = 'DESPACHO',
  DEVOLUCION = 'DEVOLUCION',
  AJUSTE = 'AJUSTE',
}

export interface Producto {
  id: string
  codigo: string
  nombre: string
  categoria: string
  stockTotal: number
  stockMinimo: number
  unidadMedida: string
}

export interface Lote {
  id: string
  numeroLote: string
  productoId: string
  productoNombre: string
  fechaCaducidad: string
  cantidadActual: number
  cantidadInicial: number
  estado: EstadoLote
  createdAt: string
}

export interface Recepcion {
  id: string
  fecha: string
  proveedor: string
  documento: string
  items: RecepcionItem[]
  observaciones?: string
}

export interface RecepcionItem {
  productoId: string
  productoNombre: string
  loteId: string
  numeroLote: string
  cantidad: number
  fechaCaducidad: string
}

export interface PedidoBodega {
  id: string
  numeroPedido: string
  clienteId: string
  clienteNombre: string
  zona: string
  fechaPedido: string
  estado: EstadoPedidoBodega
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA'
  items: PedidoBodegaItem[]
}

export interface PedidoBodegaItem {
  id: string
  productoId: string
  productoNombre: string
  cantidad: number
  unidad: string
  loteAsignado?: string
}

export interface Despacho {
  id: string
  pedidoId: string
  numeroPedido: string
  clienteNombre: string
  transportistaId?: string
  transportistaNombre?: string
  guiaRemision: string
  fechaDespacho: string
  items: DespachoItem[]
}

export interface DespachoItem {
  productoNombre: string
  cantidad: number
  numeroLote: string
}

export interface Devolucion {
  id: string
  pedidoId: string
  numeroPedido: string
  clienteNombre: string
  fechaSolicitud: string
  motivo: string
  estado: EstadoDevolucion
  items: DevolucionItem[]
}

export interface DevolucionItem {
  productoNombre: string
  numeroLote: string
  cantidad: number
  accion?: 'REINGRESAR' | 'BLOQUEAR' | 'DESCARTAR'
}

export interface Trazabilidad {
  productoId: string
  productoNombre: string
  loteId: string
  numeroLote: string
  historial: EventoTrazabilidad[]
}

export interface EventoTrazabilidad {
  id: string
  tipo: TipoMovimiento
  fecha: string
  cantidad: number
  usuario: string
  referencia: string
  detalle: string
}

export interface StatsInventario {
  stockTotal: number
  productosActivos: number
  lotesActivos: number
  lotesProximosVencer: number
  pedidosPendientes: number
  lotesVencidos: number
}
