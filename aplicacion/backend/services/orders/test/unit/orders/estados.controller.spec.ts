import { EstadosController } from '../../../src/orders/controllers/estados.controller';

describe('EstadosController', () => {
  let controller: EstadosController;
  const mockOrdersService = {
    getOrderDetailProfessional: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new EstadosController(mockOrdersService as any);
  });

  it('changeState should call updateStatus with usuarioId from req', async () => {
    mockOrdersService.updateStatus.mockResolvedValue({ id: 'o1', estado_actual: 'EN_RUTA' });
    const fakeReq: any = { user: { sub: 'user-123' } };
    const res = await controller.changeState('order-1', fakeReq, 'ENTREGADO', 'Entregado ok');
    expect(mockOrdersService.updateStatus).toHaveBeenCalledWith('order-1', 'ENTREGADO', 'user-123', 'Entregado ok');
    expect(res).toEqual({ id: 'o1', estado_actual: 'EN_RUTA' });
  });
});
