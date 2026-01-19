jest.mock('../../../../src/services/api/client', () => ({
  apiRequest: jest.fn(),
}))

import { ApiError } from '../../../../src/services/api/ApiError'

describe('services/api/OrderService API methods', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env.EXPO_PUBLIC_ORDERS_API_URL = 'http://orders.local'
  })

  it('createOrderFromCart(me) posts default payload and normalizes order', async () => {
    const { apiRequest } = jest.requireMock('../../../../src/services/api/client') as { apiRequest: jest.Mock }
    apiRequest.mockResolvedValueOnce({
      id: 'o1',
      codigo_visual: 1,
      cliente_id: 'c1',
      vendedor_id: 'v1',
      estado_actual: 'EN_RUTA',
      subtotal: 10,
      descuento_total: 0,
      impuestos_total: 0,
      total_final: 10,
      created_at: '2026-01-01T10:00:00.000Z',
      updated_at: '2026-01-01T10:00:00.000Z',
    })

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { OrderService } = require('../../../../src/services/api/OrderService')
    const res = await OrderService.createOrderFromCart({ type: 'me' })

    expect(res.status).toBe('shipped')
    expect(apiRequest).toHaveBeenCalledWith(
      'http://orders.local/orders/from-cart/me',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ condicion_pago: 'CONTADO' }) })
    )
  })

  it('getOrderDetails maps backend detail to OrderDetail[]', async () => {
    const { apiRequest } = jest.requireMock('../../../../src/services/api/client') as { apiRequest: jest.Mock }
    apiRequest.mockResolvedValueOnce({
      id: 'o1',
      fecha_creacion: '2026-01-01T00:00:00.000Z',
      detalles: [
        { producto_id: 'p1', cantidad: 2, precio_unitario: 3, subtotal: 6 },
        { producto_id: 'p2', cantidad: 1, precio_unitario: 5, subtotal: 5 },
      ],
    })

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { OrderService } = require('../../../../src/services/api/OrderService')
    const res = await OrderService.getOrderDetails('o1')

    expect(res).toHaveLength(2)
    expect(res[0]).toMatchObject({
      id: 'o1:p1:0',
      pedido_id: 'o1',
      producto_id: 'p1',
      cantidad: 2,
      precio_lista: 3,
      subtotal_linea: 6,
      created_at: '2026-01-01T00:00:00.000Z',
    })
  })

  it('getOrders falls back to history on 403/404', async () => {
    const { apiRequest } = jest.requireMock('../../../../src/services/api/client') as { apiRequest: jest.Mock }
    apiRequest
      .mockRejectedValueOnce(new ApiError('Forbidden', 403))
      .mockResolvedValueOnce([
        {
          id: 'o2',
          codigo_visual: 2,
          cliente_id: 'c1',
          vendedor_id: 'v1',
          estado_actual: 'PENDIENTE',
          subtotal: 1,
          descuento_total: 0,
          impuestos_total: 0,
          total_final: 1,
          created_at: '2026-01-01T10:00:00.000Z',
          updated_at: '2026-01-01T10:00:00.000Z',
        },
      ])

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { OrderService } = require('../../../../src/services/api/OrderService')
    const res = await OrderService.getOrders({ vendedor_id: 'v1' })

    expect(res).toHaveLength(1)
    expect(apiRequest).toHaveBeenCalledWith('http://orders.local/orders?vendedor_id=v1', { method: 'GET' })
    expect(apiRequest).toHaveBeenCalledWith('http://orders.local/orders/user/history')
  })

  it('getTrackingInfo falls back when tracking endpoint returns 404', async () => {
    const { apiRequest } = jest.requireMock('../../../../src/services/api/client') as { apiRequest: jest.Mock }
    apiRequest
      .mockResolvedValueOnce({
        id: 'o1',
        codigo_visual: 1,
        cliente_id: 'c1',
        vendedor_id: 'v1',
        estado_actual: 'EN_RUTA',
        subtotal: 10,
        descuento_total: 0,
        impuestos_total: 0,
        total_final: 10,
        created_at: '2026-01-01T10:00:00.000Z',
        updated_at: '2026-01-02T10:00:00.000Z',
      })
      .mockRejectedValueOnce(new ApiError('Not found', 404))

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { OrderService } = require('../../../../src/services/api/OrderService')
    const res = await OrderService.getTrackingInfo('o1')

    expect(res).toMatchObject({
      status: 'shipped',
      dates: expect.objectContaining({ confirmed: '2026-01-01T10:00:00.000Z' }),
    })
  })
})
