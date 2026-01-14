import { ZonasController } from '../../src/zonas/zonas.controller';

describe('ZonasController', () => {
  let controller: ZonasController;
  const mockSvc = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    approve: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ZonasController(mockSvc as any);
  });

  it('should find all zonas', async () => {
    mockSvc.findAll.mockResolvedValue([]);
    const res = await controller.findAll();
    expect(mockSvc.findAll).toHaveBeenCalled();
    expect(res).toEqual([]);
  });

  it('should call findOne with numeric id', async () => {
    mockSvc.findOne.mockResolvedValue({ id: 2 });
    const res = await controller.findOne(2 as any);
    expect(mockSvc.findOne).toHaveBeenCalledWith(2);
    expect(res).toEqual({ id: 2 });
  });
});
