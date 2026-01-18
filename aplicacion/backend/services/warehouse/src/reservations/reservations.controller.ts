import { Controller, Post, Body, Delete, Param, HttpCode, HttpStatus, Get, UseGuards, Req, Query } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { PickingService } from '../picking/picking.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService, private readonly pickingService: PickingService) {}

  @Post()
  create(@Body() body: any) {
    // Accept both OrdersService payload (snake_case) and internal camelCase DTO.
    const mapped: any = {};
    mapped.tempId = body.tempId ?? body.temp_id ?? body.pedido_temp_id ?? undefined;
    const items = (body.items || []).map((it: any) => ({
      productId: it.productId ?? it.product_id ?? it.producto_id,
      sku: it.sku ?? it.codigo_sku ?? null,
      quantity: it.quantity ?? it.cantidad,
    }));
    mapped.items = items;
    return this.reservationsService.create(mapped);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.reservationsService.remove(id);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'bodeguero')
  findAll(@Query('status') status?: string) {
    return this.reservationsService.findAll(status);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'bodeguero')
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  // Internal: confirm reservation by creating a picking from it
  @Post(':id/confirm')
  async confirmReservation(@Param('id') id: string, @Body() body: any) {
    const pedidoId = body?.pedido_id || body?.pedidoId || null;
    return this.pickingService.confirmFromReservation(pedidoId, id);
  }
}
