import { AsignacionController } from '../../src/asignacion/asignacion.controller';

describe('AsignacionController', () => {
  let controller: AsignacionController;
  const mockSvc = {
    findAll: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AsignacionController(mockSvc as any);
  });

  it('should list assignments', async () => {
    mockSvc.findAll.mockResolvedValue([]);
    const res = await controller.list();
    expect(mockSvc.findAll).toHaveBeenCalled();
    expect(res).toEqual([]);
  });

  it('should create assignment', async () => {
    const body = { vendedor: 'v1' };
    mockSvc.create.mockResolvedValue({ id: 1, ...body });
    const res = await controller.create(body);
    expect(mockSvc.create).toHaveBeenCalledWith(body);
    expect(res).toEqual({ id: 1, ...body });
  });
});
