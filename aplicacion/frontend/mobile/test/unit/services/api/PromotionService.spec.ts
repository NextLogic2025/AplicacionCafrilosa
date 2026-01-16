jest.mock('../../../../src/services/api/client', () => ({
  apiRequest: jest.fn(),
}))

describe('services/api/PromotionService', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('getProducts maps API items to PromotionProduct', async () => {
    const { apiRequest } = jest.requireMock('../../../../src/services/api/client') as { apiRequest: jest.Mock }
    apiRequest.mockResolvedValueOnce({
      items: [
        {
          id: 'p1',
          codigo_sku: 'SKU1',
          nombre: 'Prod 1',
          descripcion: 'd',
          unidad_medida: 'KG',
          imagen_url: 'http://img',
          activo: true,
          precios: [{ lista_id: 1, precio: 10 }],
          categoria: { id: 1, nombre: 'Cat' },
          promociones: [],
          precio_oferta: 7,
        },
      ],
    })

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PromotionService } = require('../../../../src/services/api/PromotionService')
    const res = await PromotionService.getProducts(99)

    expect(res).toHaveLength(1)
    expect(res[0]).toMatchObject({
      campania_id: 99,
      producto_id: 'p1',
      precio_oferta_fijo: 7,
      producto: {
        id: 'p1',
        codigo_sku: 'SKU1',
        nombre: 'Prod 1',
        activo: true,
      },
    })
  })

  it('getProducts returns [] when items missing', async () => {
    const { apiRequest } = jest.requireMock('../../../../src/services/api/client') as { apiRequest: jest.Mock }
    apiRequest.mockResolvedValueOnce({ nope: true })

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PromotionService } = require('../../../../src/services/api/PromotionService')
    await expect(PromotionService.getProducts(1)).resolves.toEqual([])
  })

  it('addProduct sends precio_oferta_fijo only when provided', async () => {
    const { apiRequest } = jest.requireMock('../../../../src/services/api/client') as { apiRequest: jest.Mock }
    apiRequest.mockResolvedValue({})

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PromotionService } = require('../../../../src/services/api/PromotionService')

    await PromotionService.addProduct(5, 'p1', 3)
    expect(apiRequest).toHaveBeenCalledWith(
      '/api/promociones/5/productos',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ producto_id: 'p1', precio_oferta_fijo: 3 }) })
    )

    await PromotionService.addProduct(5, 'p2', null)
    expect(apiRequest).toHaveBeenCalledWith(
      '/api/promociones/5/productos',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ producto_id: 'p2' }) })
    )
  })
})

