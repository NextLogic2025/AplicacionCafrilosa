jest.mock('../../../../src/services/api/client', () => ({
  apiRequest: jest.fn(),
}))

describe('services/api/PriceService', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('calls apiRequest with list endpoints and methods', async () => {
    const { apiRequest } = jest.requireMock('../../../../src/services/api/client') as { apiRequest: jest.Mock }
    apiRequest.mockResolvedValue({})

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PriceService } = require('../../../../src/services/api/PriceService')

    await PriceService.getLists()
    expect(apiRequest).toHaveBeenCalledWith('/api/precios/listas')

    await PriceService.createList({ nombre: 'L1' })
    expect(apiRequest).toHaveBeenCalledWith(
      '/api/precios/listas',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ nombre: 'L1' }) })
    )

    await PriceService.updateList(5, { activa: false })
    expect(apiRequest).toHaveBeenCalledWith(
      '/api/precios/listas/5',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ activa: false }) })
    )

    await PriceService.deleteList(5)
    expect(apiRequest).toHaveBeenCalledWith('/api/precios/listas/5', expect.objectContaining({ method: 'DELETE' }))
  })
})

