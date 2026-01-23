import { Controller, Post, Patch, Param, Body, UseGuards, Get } from '@nestjs/common';
import { OrdersService } from '../services/orders.service';
import { ServiceAuthGuard } from '../../auth/guards/service-auth.guard';

@UseGuards(ServiceAuthGuard)
@Controller('/pedidos/internal')
export class InternalController {
  constructor(private readonly ordersService: OrdersService) {}

  @Patch(':id/status')
  async updateStatusInternal(@Param('id') id: string, @Body() body: { status: string }) {
    return this.ordersService.updateStatus(id, body.status, null);
  }

  @Get(':id')
  async getOrderInternal(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post(':id/apply-picking')
  async applyPickingInternal(@Param('id') id: string, @Body() body: any) {
    return this.ordersService.applyPickingResult(id, body || {});
  }
}
