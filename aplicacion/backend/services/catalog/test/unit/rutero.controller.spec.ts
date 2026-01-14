import { RuteroController } from '../../src/rutero/rutero.controller';

describe('RuteroController', () => {
  let controller: RuteroController;
  const mockSvc = {
    findAll: jest.fn(),
    findForCliente: jest.fn(),
    findForVendedor: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new RuteroController(mockSvc as any);
  });

  it('should call findAll', async () => {
    mockSvc.findAll.mockResolvedValue([]);
    const res = await controller.all();
    expect(mockSvc.findAll).toHaveBeenCalled();
    expect(res).toEqual([]);
  });

  it('should resolve forCliente', async () => {
    mockSvc.findForCliente.mockResolvedValue([{ id: 'r1' }]);
    const res = await controller.forCliente('c1');
    expect(mockSvc.findForCliente).toHaveBeenCalledWith('c1');
    expect(res).toEqual([{ id: 'r1' }]);
  });

  it('mio should use req.user userId or sub', async () => {
    mockSvc.findForVendedor.mockResolvedValue([{ id: 'r2' }]);
    const fakeReq: any = { user: { userId: 'v1' } };
    const res = await controller.mio(fakeReq);
    expect(mockSvc.findForVendedor).toHaveBeenCalledWith('v1');
    expect(res).toEqual([{ id: 'r2' }]);
  });
});
