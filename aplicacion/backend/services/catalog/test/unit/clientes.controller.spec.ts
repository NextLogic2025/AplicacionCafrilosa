import { ClientesController } from '../../src/clientes/clientes.controller';

describe('ClientesController', () => {
  let controller: ClientesController;
  const mockSvc = {
    findAll: jest.fn(),
    findBlocked: jest.fn(),
    unblock: jest.fn(),
    findForVendedor: jest.fn(),
    findByUsuarioPrincipalId: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ClientesController(mockSvc as any);
  });

  it('should call findAll', async () => {
    mockSvc.findAll.mockResolvedValue([]);
    const res = await controller.findAll();
    expect(mockSvc.findAll).toHaveBeenCalled();
    expect(res).toEqual([]);
  });

  it('should return cliente for cliente role in findOne', async () => {
    const fakeReq: any = { user: { role: 'cliente', userId: 'u1' } };
    mockSvc.findByUsuarioPrincipalId.mockResolvedValue({ id: 'cliente-1' });
    const res = await controller.findOne(fakeReq, 'ignored');
    expect(mockSvc.findByUsuarioPrincipalId).toHaveBeenCalledWith('u1');
    expect(res).toEqual({ id: 'cliente-1' });
  });
});
