import { Controller, Get, Post, Body, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class OrdersController {
  constructor(private readonly svc: OrdersService) {}

  @Get()
  @Roles('admin', 'supervisor', 'vendedor')
  list() {
    return this.svc.listPedidos();
  }

  @Get(':id')
  @Roles('admin', 'supervisor', 'vendedor', 'transportista', 'cliente')
  get(@Param('id') id: string) {
    return this.svc.getPedido(id);
  }

  @Post()
  @Roles('admin', 'vendedor', 'cliente')
  create(@Body() body: any) {
    return this.svc.createPedido(body);
  }

  // CART endpoints (MVP)
  @Get('/cart/:userId')
  @Roles('admin', 'vendedor', 'cliente')
  async getCart(@Param('userId') userId: string, @Req() req: any) {
    const user = req.user;
    const isAdmin = Array.isArray(user?.role) ? user.role.map((r: any) => String(r).toLowerCase()).includes('admin') : String(user?.role).toLowerCase() === 'admin';
    if (!isAdmin && user?.userId !== userId) {
      // only admin or owner
      return { status: 403, message: 'Forbidden' };
    }
    return this.svc.getCartForUser(userId);
  }

  @Post('/cart/:userId')
  @Roles('admin', 'vendedor', 'cliente')
  async addCartItem(@Param('userId') userId: string, @Body() body: any, @Req() req: any) {
    const user = req.user;
    const isAdmin = Array.isArray(user?.role) ? user.role.map((r: any) => String(r).toLowerCase()).includes('admin') : String(user?.role).toLowerCase() === 'admin';
    if (!isAdmin && user?.userId !== userId) return { status: 403, message: 'Forbidden' };
    return this.svc.addOrUpdateCartItem(userId, body);
  }

  @Post('/cart/:userId/items/:itemId/delete')
  @Roles('admin', 'vendedor', 'cliente')
  async deleteCartItem(@Param('userId') userId: string, @Param('itemId') itemId: string, @Req() req: any) {
    const user = req.user;
    const isAdmin = Array.isArray(user?.role) ? user.role.map((r: any) => String(r).toLowerCase()).includes('admin') : String(user?.role).toLowerCase() === 'admin';
    if (!isAdmin && user?.userId !== userId) return { status: 403, message: 'Forbidden' };
    return this.svc.deleteCartItem(userId, itemId);
  }

  @Patch(':id')
  @Roles('admin', 'vendedor')
  update(@Param('id') id: string, @Body() body: any) {
    return this.svc.updatePedido(id, body);
  }

  @Post(':id/detalles')
  @Roles('admin', 'vendedor', 'cliente')
  addDetalle(@Param('id') id: string, @Body() body: any) {
    return this.svc.addDetalle(id, body);
  }
}
