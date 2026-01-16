jest.mock('../../../../src/services/api/client', () => ({
  apiRequest: jest.fn(),
}))

describe('services/api/CartService', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env.EXPO_PUBLIC_ORDERS_API_URL = 'http://orders.local'
  })

  it('calls apiRequest with /me cart endpoint', async () => {
    const { apiRequest } = jest.requireMock('../../../../src/services/api/client') as { apiRequest: jest.Mock }
    apiRequest.mockResolvedValue({ id: 'c1' })

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { CartService } = require('../../../../src/services/api/CartService')
    await CartService.getCart({ type: 'me' })

    expect(apiRequest).toHaveBeenCalledWith('http://orders.local/orders/cart/me')
  })

  it('calls apiRequest with client cart endpoint', async () => {
    const { apiRequest } = jest.requireMock('../../../../src/services/api/client') as { apiRequest: jest.Mock }
    apiRequest.mockResolvedValue({ id: 'c1' })

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { CartService } = require('../../../../src/services/api/CartService')
    await CartService.getCart({ type: 'client', clientId: 'cl-1' })

    expect(apiRequest).toHaveBeenCalledWith('http://orders.local/orders/cart/client/cl-1')
  })

  it('calls apiRequest with POST body when adding', async () => {
    const { apiRequest } = jest.requireMock('../../../../src/services/api/client') as { apiRequest: jest.Mock }
    apiRequest.mockResolvedValue({ ok: true })

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { CartService } = require('../../../../src/services/api/CartService')
    await CartService.addToCart({ type: 'me' }, { producto_id: 'p1', cantidad: 2 })

    expect(apiRequest).toHaveBeenCalledWith(
      'http://orders.local/orders/cart/me',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ producto_id: 'p1', cantidad: 2 }) })
    )
  })
})

