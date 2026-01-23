import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { FacturasService } from './facturas.service';
import { ServiceAuthGuard } from '../auth/guards/service-auth.guard';

@Controller('facturas')
export class FacturasInternalController {
  constructor(private readonly facturasService: FacturasService) {}

  @Post('internal')
  @UseGuards(ServiceAuthGuard)
  async createInternal(@Body() createDto: any) {
    return this.facturasService.create(createDto);
  }

  @Get('internal/pedido/:pedidoId')
  @UseGuards(ServiceAuthGuard)
  async findByPedidoInternal(@Param('pedidoId') pedidoId: string) {
    const f = await this.facturasService.findByPedidoId(pedidoId);
    if (!f) return null;
    return f;
  }
}
