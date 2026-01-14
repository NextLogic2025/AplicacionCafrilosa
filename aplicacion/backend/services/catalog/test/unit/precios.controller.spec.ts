import { PreciosController } from '../../src/precios/precios.controller';

describe('PreciosController', () => {
  let controller: PreciosController;
  const mockPrecios = {
    asignarPrecio: jest.fn(),
    obtenerPreciosDeProductoParaLista: jest.fn(),
    obtenerPreciosDeProducto: jest.fn(),
    removePrecio: jest.fn(),
    findAllListas: jest.fn(),
    createLista: jest.fn(),
    updateLista: jest.fn(),
    deleteLista: jest.fn(),
    productosConPrecioParaLista: jest.fn(),
  };

  const mockClientes = {
    findByUsuarioPrincipalId: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new PreciosController(mockPrecios as any, mockClientes as any);
  });

  it('should assign price', async () => {
    const dto: any = { productoId: 'p1', listaId: 1, precio: 10 };
    mockPrecios.asignarPrecio.mockResolvedValue({ ok: true });
    const res = await controller.asignar(dto);
    expect(mockPrecios.asignarPrecio).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ ok: true });
  });

  it('should resolve client lista and call obtenerPreciosDeProductoParaLista for cliente', async () => {
    const fakeReq: any = { user: { role: 'cliente', userId: 'u1' } };
    mockClientes.findByUsuarioPrincipalId.mockResolvedValue({ lista_precios_id: 5 });
    mockPrecios.obtenerPreciosDeProductoParaLista.mockResolvedValue([{ lista_id: 5, precio: 100 }]);
    const res = await controller.verPrecios('p1', fakeReq);
    expect(mockClientes.findByUsuarioPrincipalId).toHaveBeenCalledWith('u1');
    expect(mockPrecios.obtenerPreciosDeProductoParaLista).toHaveBeenCalledWith('p1', 5);
    expect(res).toEqual([{ lista_id: 5, precio: 100 }]);
  });
});
