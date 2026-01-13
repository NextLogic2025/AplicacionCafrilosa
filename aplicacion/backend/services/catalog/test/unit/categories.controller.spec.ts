import { CategoriesController } from '../../src/categories/categories.controller';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  const mockSvc = {
    findAll: jest.fn(),
    findDeleted: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new CategoriesController(mockSvc as any);
  });

  it('should call findAll', async () => {
    mockSvc.findAll.mockResolvedValue([]);
    const res = await controller.findAll();
    expect(mockSvc.findAll).toHaveBeenCalled();
    expect(res).toEqual([]);
  });

  it('should call findOne', async () => {
    mockSvc.findOne.mockResolvedValue({ id: 'c1' });
    const res = await controller.findOne('c1');
    expect(mockSvc.findOne).toHaveBeenCalledWith('c1');
    expect(res).toEqual({ id: 'c1' });
  });
});
