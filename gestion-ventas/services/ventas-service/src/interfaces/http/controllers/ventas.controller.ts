import { CreateVentaDTO } from '../../../application/dtos/create-venta.dto'
import { InMemoryVentasRepository } from '../../../infrastructure/repositories/in-memory-ventas.repository'

const repo = new InMemoryVentasRepository()

export const createVenta = async (req: any, res: any) => {
  const dto: CreateVentaDTO = req.body
  const venta = await repo.createVenta(dto)
  res.status(201).json(venta)
}

export const getVenta = async (req: any, res: any) => {
  const { id } = req.params
  const venta = await repo.getVentaById(id)
  if (!venta) return res.status(404).json({ message: 'Not found' })
  res.json(venta)
}
