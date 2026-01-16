jest.mock('../../../../src/services/api/client', () => ({
  apiRequest: jest.fn(),
}))

describe('services/api/SucursalService', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('createSucursal injects cliente_id into body', async () => {
    const { apiRequest } = jest.requireMock('../../../../src/services/api/client') as { apiRequest: jest.Mock }
    apiRequest.mockResolvedValue({ id: 's1' })

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { SucursalService } = require('../../../../src/services/api/SucursalService')
    await SucursalService.createSucursal('c1', { nombre_sucursal: 'S1' })

    expect(apiRequest).toHaveBeenCalledWith(
      '/api/clientes/c1/sucursales',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ nombre_sucursal: 'S1', cliente_id: 'c1' }),
      })
    )
  })
})

