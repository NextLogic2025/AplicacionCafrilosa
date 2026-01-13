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

  it('should call getOrCreateCart', async () => {
    mockCartService.getOrCreateCart.mockResolvedValue({ id: 'c1' });
    const res = await controller.getCart('user-1');
    expect(mockCartService.getOrCreateCart).toHaveBeenCalledWith('user-1');
    expect(res).toEqual({ id: 'c1' });
  });

  it('should call addItem', async () => {
    const dto = { producto_id: 'p1', cantidad: 1 };
    mockCartService.addItem.mockResolvedValue({ id: 'item-1' });
    const res = await controller.addToCart('user-1', dto as any);
    expect(mockCartService.addItem).toHaveBeenCalledWith('user-1', dto);
    expect(res).toEqual({ id: 'item-1' });
  });

  it('should call clearCart', async () => {
    mockCartService.clearCart.mockResolvedValue(undefined);
    const res = await controller.clearCart('user-1');
    expect(mockCartService.clearCart).toHaveBeenCalledWith('user-1');
    expect(res).toBeUndefined();
  });

  it('should call removeItem', async () => {
    mockCartService.removeItem.mockResolvedValue({ success: true });
    const res = await controller.removeFromCart('user-1', 'p1');
    expect(mockCartService.removeItem).toHaveBeenCalledWith('user-1', 'p1');
    expect(res).toEqual({ success: true });
  });

  it('should call setClienteId', async () => {
    // setCartCliente endpoint removed; ensure controller does not expose it anymore
    expect((controller as any).setCartCliente).toBeUndefined();
  });
});
