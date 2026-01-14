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

  @Get(':userId')
  @UseGuards(OrderOwnershipGuard)
  @Roles('admin', 'cliente', 'vendedor')
  getCart(@Param('userId') userId: string) {
    return this.cartService.getOrCreateCart(userId);
  }

  @Post(':userId')
  @UseGuards(OrderOwnershipGuard)
  @Roles('admin', 'cliente', 'vendedor')
  addToCart(@Param('userId') userId: string, @Body() dto: UpdateCartItemDto) {
    return this.cartService.addItem(userId, dto);
  }

  @Delete(':userId')
  @UseGuards(OrderOwnershipGuard)
  @Roles('admin', 'cliente', 'vendedor')
  clearCart(@Param('userId') userId: string) {
    return this.cartService.clearCart(userId);
  }

  @Delete(':userId/item/:productId')
  @UseGuards(OrderOwnershipGuard)
  @Roles('admin', 'cliente', 'vendedor')
  removeFromCart(@Param('userId') userId: string, @Param('productId') productId: string) {
    return this.cartService.removeItem(userId, productId);
  }
}

