import { Controller, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { OrdersService } from '../services/orders.service';
import { ServiceAuthGuard } from '../../auth/guards/service-auth.guard';

@Controller('internal')
export class InternalController {
  constructor(private readonly ordersService: OrdersService) {}

  @Patch(':id/status')
  @UseGuards(ServiceAuthGuard)
  async updateStatusInternal(@Param('id') id: string, @Body() body: { status: string }) {
    return this.ordersService.updateStatus(id, body.status, null);
  }
}
