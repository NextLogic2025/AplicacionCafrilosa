import { ProductsController } from '../../src/products/products.controller';

describe('ProductsController', () => {
  let controller: ProductsController;
  const mockSvc = {
    findAll: jest.fn(),
    findByCategory: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
  };

  const mockClientes = { findByUsuarioPrincipalId: jest.fn(), findOne: jest.fn() };
  const mockPrecios = {};

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ProductsController(mockSvc as any, mockClientes as any, mockPrecios as any);
  });

  it('should call findAll with resolved client context', async () => {
    mockSvc.findAll.mockResolvedValue({ items: [] });
    const fakeReq: any = { user: { role: 'admin' } };
    const res = await controller.findAll('1', '20', 'q', fakeReq);
    expect(mockSvc.findAll).toHaveBeenCalled();
    expect(res).toEqual({ items: [] });
  });

  it('should call findOne', async () => {
    mockSvc.findOne.mockResolvedValue({ id: 'p1' });
    const fakeReq: any = { user: { role: 'cliente' } };
    const res = await controller.findOne('p1', fakeReq);
    expect(mockSvc.findOne).toHaveBeenCalledWith('p1', expect.any(Object));
    expect(res).toEqual({ id: 'p1' });
  });
});
