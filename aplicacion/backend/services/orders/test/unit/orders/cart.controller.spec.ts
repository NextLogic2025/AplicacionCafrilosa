import { CartController } from '../../../src/orders/controllers/cart.controller';

describe('CartController', () => {
  let controller: CartController;
  const mockCartService = {
    getOrCreateCart: jest.fn(),
    addItem: jest.fn(),
    clearCart: jest.fn(),
    removeItem: jest.fn(),
    setClienteId: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new CartController(mockCartService as any);
  });

  it('should call getOrCreateCart for my cart', async () => {
    mockCartService.getOrCreateCart.mockResolvedValue({ id: 'c1' });
    const mockReq = { user: { userId: 'user-1' } };
    const res = await controller.getMyCart(mockReq);
    expect(mockCartService.getOrCreateCart).toHaveBeenCalledWith('user-1', undefined);
    expect(res).toEqual({ id: 'c1' });
  });

  it('should call addItem for my cart', async () => {
    const dto = { producto_id: 'p1', cantidad: 1 };
    mockCartService.addItem.mockResolvedValue({ id: 'item-1' });
    const mockReq = { user: { userId: 'user-1' } };
    const res = await controller.addToMyCart(dto as any, mockReq);
    expect(mockCartService.addItem).toHaveBeenCalledWith('user-1', dto, undefined);
    expect(res).toEqual({ id: 'item-1' });
  });

  it('should call clearCart for my cart', async () => {
    mockCartService.clearCart.mockResolvedValue(undefined);
    const mockReq = { user: { userId: 'user-1' } };
    const res = await controller.clearMyCart(mockReq);
    expect(mockCartService.clearCart).toHaveBeenCalledWith('user-1', undefined);
    expect(res).toBeUndefined();
  });

  it('should call removeItem for my cart', async () => {
    mockCartService.removeItem.mockResolvedValue({ success: true });
    const mockReq = { user: { userId: 'user-1' } };
    const res = await controller.removeFromMyCart('p1', mockReq);
    expect(mockCartService.removeItem).toHaveBeenCalledWith('user-1', 'p1', undefined);
    expect(res).toEqual({ success: true });
  });

  it('should call setClienteId', async () => {
    // setCartCliente endpoint removed; ensure controller does not expose it anymore
    expect((controller as any).setCartCliente).toBeUndefined();
  });
});
