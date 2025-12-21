import { VentasRepository } from '../../domain/repositories'

export class InMemoryVentasRepository implements VentasRepository {
  private store: any[] = []

  async createVenta(data: any) {
    const id = String(this.store.length + 1)
    const record = { id, ...data }
    this.store.push(record)
    return record
  }

  async getVentaById(id: string) {
    return this.store.find((s) => s.id === id) || null
  }
}
