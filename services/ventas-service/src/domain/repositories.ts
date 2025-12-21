export interface VentasRepository {
  createVenta(data: any): Promise<any>
  getVentaById(id: string): Promise<any | null>
}
