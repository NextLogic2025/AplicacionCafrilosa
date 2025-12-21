export interface CreateVentaDTO {
  clienteId: string
  items: Array<{ productoId: string; cantidad: number; precio: number }>
  total: number
}
