import { OrderService, type Order } from '../../../../src/services/api/OrderService'

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'o1',
    codigo_visual: 123,
    cliente_id: 'c1',
    vendedor_id: 'v1',
    estado_actual: 'PENDIENTE',
    subtotal: 10,
    descuento_total: 0,
    impuestos_total: 0,
    total_final: 10,
    created_at: '2026-01-01T10:00:00.000Z',
    updated_at: '2026-01-02T10:00:00.000Z',
    ...overrides,
  }
}

describe('services/api/OrderService', () => {
  it('normalizeOrder derives clientName/numero/total/itemsCount/status', () => {
    const order = makeOrder({
      estado_actual: 'EN_RUTA',
      detalles: [{ id: 'd1' } as any, { id: 'd2' } as any],
      cliente: { id: 'c1', razon_social: 'RS', identificacion: 'X', nombre_comercial: 'Comercial' },
    })

    const normalized = OrderService.normalizeOrder(order)
    expect(normalized.clientName).toBe('Comercial')
    expect(normalized.itemsCount).toBe(2)
    expect(normalized.total).toBe(order.total_final)
    expect(normalized.numero).toBe(order.codigo_visual)
    expect(normalized.fecha_creacion).toBe(order.created_at)
    expect(normalized.status).toBe('shipped')
  })

  it('getOrderStats counts by estado and sums total_final', () => {
    const stats = OrderService.getOrderStats([
      makeOrder({ id: 'o1', estado_actual: 'PENDIENTE', total_final: 10 }),
      makeOrder({ id: 'o2', estado_actual: 'PENDIENTE', total_final: 5 }),
      makeOrder({ id: 'o3', estado_actual: 'ENTREGADO', total_final: 7 }),
    ])

    expect(stats.total).toBe(3)
    expect(stats.porEstado.PENDIENTE).toBe(2)
    expect(stats.porEstado.ENTREGADO).toBe(1)
    expect(stats.totalVentas).toBe(22)
  })
})

