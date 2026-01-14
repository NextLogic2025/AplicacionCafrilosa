import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { OrderOwnershipGuard } from '../guards/order-ownership.guard';
import { CartService } from '../services/cart.service';
import { UpdateCartItemDto } from '../dto/requests/update-cart.dto';

@Controller('orders/cart')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * GET /orders/cart/me
   * Cliente obtiene su propio carrito (usuario_id del JWT, vendedor_id=null)
   */
  @Get('me')
  @Roles('admin', 'cliente', 'vendedor')
  getMyCart(@Req() req: any) {
    const userId = req?.user?.userId || req?.user?.sub;
    return this.cartService.getOrCreateCart(userId, undefined);
  }

  /**
   * POST /orders/cart/me
   * Cliente agrega producto a su carrito (usuario_id del JWT, vendedor_id=null)
   */
  @Post('me')
  @Roles('admin', 'cliente', 'vendedor')
  addToMyCart(@Body() dto: UpdateCartItemDto, @Req() req: any) {
    const userId = req?.user?.userId || req?.user?.sub;
    return this.cartService.addItem(userId, dto, undefined);
  }

  /**
   * DELETE /orders/cart/me
   * Cliente vacía su carrito (usuario_id del JWT, vendedor_id=null)
   */
  @Delete('me')
  @Roles('admin', 'cliente', 'vendedor')
  clearMyCart(@Req() req: any) {
    const userId = req?.user?.userId || req?.user?.sub;
    return this.cartService.clearCart(userId, undefined);
  }

  /**
   * DELETE /orders/cart/me/item/:productId
   * Cliente elimina un producto de su carrito
   */
  @Delete('me/item/:productId')
  @Roles('admin', 'cliente', 'vendedor')
  removeFromMyCart(@Param('productId') productId: string, @Req() req: any) {
    const userId = req?.user?.userId || req?.user?.sub;
    return this.cartService.removeItem(userId, productId, undefined);
  }

  /**
   * GET /orders/cart/client/:clienteId
   * Vendedor obtiene carrito de cliente (resuelve usuario_id desde cliente_id, vendedor_id del JWT)
   */
  @Get('client/:clienteId')
  @UseGuards(OrderOwnershipGuard)
  @Roles('admin', 'vendedor')
  getClientCart(@Param('clienteId') clienteId: string, @Req() req: any) {
    const vendedorId = req?.user?.userId || req?.user?.sub;
    return this.cartService.getOrCreateCart(clienteId, vendedorId);
  }

  /**
   * POST /orders/cart/client/:clienteId
   * Vendedor agrega producto al carrito del cliente (resuelve usuario_id desde cliente_id, vendedor_id del JWT)
   */
  @Post('client/:clienteId')
  @UseGuards(OrderOwnershipGuard)
  @Roles('admin', 'vendedor')
  addToClientCart(@Param('clienteId') clienteId: string, @Body() dto: UpdateCartItemDto, @Req() req: any) {
    const vendedorId = req?.user?.userId || req?.user?.sub;
    return this.cartService.addItem(clienteId, dto, vendedorId);
  }

  /**
   * DELETE /orders/cart/client/:clienteId
   * Vendedor vacía el carrito del cliente (resuelve usuario_id desde cliente_id, vendedor_id del JWT)
   */
  @Delete('client/:clienteId')
  @UseGuards(OrderOwnershipGuard)
  @Roles('admin', 'vendedor')
  clearClientCart(@Param('clienteId') clienteId: string, @Req() req: any) {
    const vendedorId = req?.user?.userId || req?.user?.sub;
    return this.cartService.clearCart(clienteId, vendedorId);
  }

  /**
   * DELETE /orders/cart/client/:clienteId/item/:productId
   * Vendedor elimina un producto del carrito del cliente
   */
  @Delete('client/:clienteId/item/:productId')
  @UseGuards(OrderOwnershipGuard)
  @Roles('admin', 'vendedor')
  removeFromClientCart(@Param('clienteId') clienteId: string, @Param('productId') productId: string, @Req() req: any) {
    const vendedorId = req?.user?.userId || req?.user?.sub;
    return this.cartService.removeItem(clienteId, productId, vendedorId);
  }
}

