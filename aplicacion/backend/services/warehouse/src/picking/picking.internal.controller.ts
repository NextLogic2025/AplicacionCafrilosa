// picking/picking.internal.controller.ts
import { Controller, Post, UseGuards, Body, Get, Param, BadRequestException, Req } from '@nestjs/common';

import { PickingService } from './picking.service';
import { ServiceAuthGuard } from '../auth/guards/service-auth.guard';
import { CreatePickingDto } from './dto/create-picking.dto';

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
    @Post()
    create(@Body() dto: CreatePickingDto, @Req() req: any) {
        // Prefer forwarded header `x-user-id` (sent by Orders) to assign bodeguero without replacing service auth
        const forwardedUserId = req?.headers?.['x-user-id'] || req?.headers?.['x-userid'] || null;
        const tokenUserId = forwardedUserId || req?.user?.sub || req?.user?.id || null;
        if (tokenUserId && !(dto as any).bodegueroId) {
            (dto as any).bodegueroId = String(tokenUserId);
        }
        return this.service.create(dto as any);
    }
    @Post(':id/tomar')
    tomar(@Param('id') id: string, @Req() req: any) {
        const usuarioId = req.user?.userId;
        return this.service.asignarBodeguero(id, usuarioId);
    }
}
