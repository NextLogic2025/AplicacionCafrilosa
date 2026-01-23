// picking/picking.internal.controller.ts
import { Controller, Post, UseGuards, Body, Get, Param, BadRequestException } from '@nestjs/common';

import { PickingService } from './picking.service';
import { ServiceAuthGuard } from '../auth/guards/service-auth.guard';

@Controller('picking/internal')
@UseGuards(ServiceAuthGuard)
export class PickingInternalController {
    constructor(private readonly service: PickingService) { }

    @Post('confirm')
    async confirmOpen(@Body() body: any) {
        const pedidoId = body.pedido_id || body.pedidoId;
        const reservationId = body.reservation_id || body.reservationId || body.reserva_id;
        if (!reservationId) throw new BadRequestException('reservation_id is required');
        return this.service.confirmFromReservation(pedidoId, reservationId);
    }

    @Get(':id')
    async findOneInternal(@Param('id') id: string) {
        return this.service.findOne(id);
    }
}
