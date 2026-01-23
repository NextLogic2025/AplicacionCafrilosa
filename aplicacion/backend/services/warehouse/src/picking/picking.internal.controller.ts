// picking/picking.internal.controller.ts
import { Controller, Post, UseGuards, Body, Get, Param, BadRequestException } from '@nestjs/common';

import { PickingService } from './picking.service';
import { ServiceAuthGuard } from '../auth/guards/service-auth.guard';

@Controller('picking/internal')
@UseGuards(ServiceAuthGuard)
export class PickingInternalController {
    constructor(private readonly service: PickingService) { }

    // reservation-based confirmation removed; callers should POST to `create` with explicit items

    @Get(':id')
    async findOneInternal(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Get('by-bodeguero/:bodegueroId')
    async findByBodegueroInternal(@Param('bodegueroId') bodegueroId: string) {
        // Return minimal picking records (pedidoId + picking id) for a given bodeguero
        const rows = await this.service.findByBodeguero(bodegueroId);
        return rows.map(r => ({ id: (r as any).id, pedidoId: (r as any).pedidoId }));
    }
}
