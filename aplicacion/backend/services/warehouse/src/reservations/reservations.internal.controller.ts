// reservations/reservations.internal.controller.ts
import { Controller, Post, Body, Delete, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { PickingService } from '../picking/picking.service';
import { ServiceAuthGuard } from '../auth/guards/service-auth.guard';

@Controller('reservations/internal')
@UseGuards(ServiceAuthGuard)
export class ReservationsInternalController {
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

  // Internal: confirm reservation by creating a picking from it
  @Post(':id/confirm')
  async confirmReservation(@Param('id') id: string, @Body() body: any) {
    const pedidoId = body?.pedido_id || body?.pedidoId || null;
    return this.pickingService.confirmFromReservation(pedidoId, id);
  }
}
