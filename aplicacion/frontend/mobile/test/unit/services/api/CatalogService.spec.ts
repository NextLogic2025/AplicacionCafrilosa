jest.mock('../../../../src/services/api/client', () => ({
  apiRequest: jest.fn(),
}))

describe('services/api/CatalogService', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('getProducts returns response items (or empty array)', async () => {
    const { apiRequest } = jest.requireMock('../../../../src/services/api/client') as { apiRequest: jest.Mock }
    apiRequest.mockResolvedValueOnce({ items: [{ id: 'p1' }] })

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { CatalogService } = require('../../../../src/services/api/CatalogService')
    await expect(CatalogService.getProducts()).resolves.toEqual([{ id: 'p1' }])

    apiRequest.mockResolvedValueOnce({ items: undefined })
    await expect(CatalogService.getProducts()).resolves.toEqual([])
  })

  it('getClientProducts transforms prices/promos', async () => {
    const { apiRequest } = jest.requireMock('../../../../src/services/api/client') as { apiRequest: jest.Mock }
    apiRequest.mockResolvedValueOnce({
      metadata: { total_items: 1, page: 1, per_page: 20, total_pages: 1 },
      items: [
        {
          id: 'p1',
          codigo_sku: 'SKU',
          nombre: 'Prod',
          activo: true,
          precio_lista: '10',
          promociones: [{ campana_id: 99, precio_oferta: '7' }],
        },
      ],
    })

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { CatalogService } = require('../../../../src/services/api/CatalogService')
    const res = await CatalogService.getClientProducts(1, 20)

    expect(res.items).toHaveLength(1)
    expect(res.items[0]).toMatchObject({
      id: 'p1',
      precio_original: 10,
      precio_oferta: 7,
      ahorro: 3,
      campania_aplicada_id: 99,
    })
  })

  it('getProductsPaginated returns empty response on error', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const { apiRequest } = jest.requireMock('../../../../src/services/api/client') as { apiRequest: jest.Mock }
    apiRequest.mockRejectedValueOnce(new Error('boom'))

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { CatalogService } = require('../../../../src/services/api/CatalogService')
    const res = await CatalogService.getProductsPaginated(1, 20)

    expect(res.items).toEqual([])
    expect(res.metadata).toMatchObject({ total_items: 0, page: 1, per_page: 20, total_pages: 0 })
    errorSpy.mockRestore()
  })
})

