import { PromocionesController } from '../../src/promociones/promociones.controller';

describe('PromocionesController', () => {
  let controller: PromocionesController;
  const mockSvc = {
    findCampanias: jest.fn(),
    findCampania: jest.fn(),
    createCampania: jest.fn(),
    updateCampania: jest.fn(),
    removeCampania: jest.fn(),
    addProductoPromo: jest.fn(),
    findPromosByCampania: jest.fn(),
    addClientePermitido: jest.fn(),
    findClientesPermitidos: jest.fn(),
    removeClientePermitido: jest.fn(),
    removeProductoPromo: jest.fn(),
  };

  const mockPrecios = { obtenerPreciosDeProducto: jest.fn() };
  const mockClientes = { findByUsuarioPrincipalId: jest.fn(), findOne: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new PromocionesController(mockSvc as any, mockPrecios as any, mockClientes as any);
  });

  it('should list campanias', async () => {
    mockSvc.findCampanias.mockResolvedValue([]);
    const res = await controller.listCampanias();
    expect(mockSvc.findCampanias).toHaveBeenCalled();
    expect(res).toEqual([]);
  });

  it('getProductos returns empty array when no promos', async () => {
    mockSvc.findPromosByCampania.mockResolvedValue([]);
    const res = await controller.getProductos('1');
    expect(mockSvc.findPromosByCampania).toHaveBeenCalledWith(1);
    expect(res).toEqual([]);
  });
});
