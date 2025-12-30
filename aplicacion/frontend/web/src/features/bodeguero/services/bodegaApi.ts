import { 
  Producto, 
  Lote, 
  Recepcion, 
  PedidoBodega, 
  Despacho, 
  Devolucion, 
  Trazabilidad,
  StatsInventario 
} from '../types'

// Mock data para desarrollo
export const bodegaApi = {
  // Dashboard
  async getStats(): Promise<StatsInventario> {
    return {
      stockTotal: 15420,
      productosActivos: 124,
      lotesActivos: 86,
      lotesProximosVencer: 12,
      pedidosPendientes: 8,
      lotesVencidos: 3,
    }
  },

  // Inventario
  async getProductos(): Promise<Producto[]> {
    return [
      {
        id: '1',
        codigo: 'EMB-001',
        nombre: 'Chorizo Parrillero Premium',
        categoria: 'Embutidos',
        stockTotal: 450,
        stockMinimo: 100,
        unidadMedida: 'kg',
      },
      {
        id: '2',
        codigo: 'EMB-002',
        nombre: 'Salchicha Frankfurt',
        categoria: 'Embutidos',
        stockTotal: 320,
        stockMinimo: 150,
        unidadMedida: 'kg',
      },
    ]
  },

  // Lotes
  async getLotes(): Promise<Lote[]> {
    return [
      {
        id: '1',
        numeroLote: 'L-2024-001',
        productoId: '1',
        productoNombre: 'Chorizo Parrillero Premium',
        fechaCaducidad: '2025-02-15',
        cantidadActual: 200,
        cantidadInicial: 500,
        estado: 'ACTIVO' as any,
        createdAt: new Date().toISOString(),
      },
    ]
  },

  async createLote(data: Partial<Lote>): Promise<Lote> {
    return { ...data, id: Date.now().toString() } as Lote
  },

  async updateLote(id: string, data: Partial<Lote>): Promise<Lote> {
    return { ...data, id } as Lote
  },

  // Recepciones
  async getRecepciones(): Promise<Recepcion[]> {
    return []
  },

  async createRecepcion(data: Partial<Recepcion>): Promise<Recepcion> {
    return { ...data, id: Date.now().toString() } as Recepcion
  },

  // Pedidos
  async getPedidosAPeparar(): Promise<PedidoBodega[]> {
    return []
  },

  async prepararPedido(id: string, lotesAsignados: any): Promise<PedidoBodega> {
    return {} as PedidoBodega
  },

  // Despachos
  async getDespachos(): Promise<Despacho[]> {
    return []
  },

  async createDespacho(data: Partial<Despacho>): Promise<Despacho> {
    return { ...data, id: Date.now().toString() } as Despacho
  },

  // Devoluciones
  async getDevoluciones(): Promise<Devolucion[]> {
    return []
  },

  async validarDevolucion(id: string, accion: string): Promise<Devolucion> {
    return {} as Devolucion
  },

  // Trazabilidad
  async getTrazabilidad(filtro: { lote?: string; producto?: string; pedido?: string }): Promise<Trazabilidad[]> {
    return []
  },
}
