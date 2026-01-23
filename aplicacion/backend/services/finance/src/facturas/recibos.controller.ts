import { Controller, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { FacturasService } from './facturas.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Recibos')
@ApiBearerAuth()
@Controller('recibos')
export class RecibosController {
  constructor(private readonly facturasService: FacturasService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('vendedor', 'supervisor', 'admin')
  async create(@Body() body: any, @Req() req: any) {
    const clienteId = body.clienteId;
    const vendedorId = body.vendedorId || req.user?.userId || null;
    const total = body.total || 0;
    const meta = body.meta || {};
    const id = await this.facturasService.spReciboCrear(clienteId, vendedorId, total, meta);
    return { id };
  }

  @Post(':id/pagos')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('vendedor', 'supervisor', 'admin')
  async addPago(@Param('id') id: string, @Body() pago: any) {
    await this.facturasService.spReciboAgregarPago(id, pago);
    return { ok: true };
  }

  @Post(':id/confirmar')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('vendedor', 'supervisor', 'admin')
  async confirmar(@Param('id') id: string) {
    await this.facturasService.spReciboConfirmar(id);
    return { ok: true };
  }

  @Post(':id/aplicar-fifo')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('vendedor', 'supervisor', 'admin')
  async aplicar(@Param('id') id: string) {
    const res = await this.facturasService.spReciboAplicarFifo(id);
    return { result: res };
  }

  @Post(':id/anular')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('vendedor', 'supervisor', 'admin')
  async anular(@Param('id') id: string, @Body() body: any) {
    const motivo = body.motivo || null;
    await this.facturasService.spReciboAnular(id, motivo);
    return { ok: true };
  }
}
