// picking/picking.controller.ts
import { Controller, Get, Post, Put, Param, Body, UseGuards, Query, Req, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

import { PickingService } from './picking.service';
import { CreatePickingDto } from './dto/create-picking.dto';
import { ServiceAuthGuard } from '../auth/guards/service-auth.guard';

@Controller('picking')
export class PickingController {
    constructor(private readonly service: PickingService) { }

    @Get()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin', 'supervisor', 'bodeguero')
    findAll(@Query('estado') estado?: string, @Query('all') all?: string, @Req() req?: any) {
        // If requester is a bodeguero and did not explicitly request all entries,
        // return only orders assigned to or available for that bodeguero.
        const user = req?.user;
        const roles = Array.isArray(user?.role) ? user.role : [user?.role];
        const hasRoleBodeguero = roles.map(r => String(r || '').toLowerCase()).includes('bodeguero');
        const hasRolIdBodeguero = Number(user?.rolId) === 3;

        if ((hasRoleBodeguero || hasRolIdBodeguero) && !all) {
            // Bodegueros should see only orders that do NOT have a bodeguero assigned (available to take)
            return this.service.findAvailable();
        }

        return this.service.findAll(estado);
    }

    @Get('stats/general')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin', 'supervisor')
    getStats() {
        return this.service.getStatsPorBodeguero();
    }

    @Get('mis-ordenes')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('bodeguero')
    misOrdenes(@Req() req: any) {
        const bodegueroId = req.user?.userId;
        return this.service.findByBodeguero(bodegueroId);
    }

    @Get(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin', 'supervisor', 'bodeguero')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Post()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin', 'supervisor')
    create(@Body() dto: CreatePickingDto) {
        return this.service.create(dto);
    }

    @Post('confirm')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin', 'supervisor')
    async confirm(@Body() body: any) {
        const pedidoId = body.pedido_id || body.pedidoId;
        const reservationId = body.reservation_id || body.reservationId || body.reserva_id;
        if (!reservationId) {
            throw new BadRequestException('reservation_id is required');
        }
        return this.service.confirmFromReservation(pedidoId, reservationId);
    }

    // Internal helper for local testing: no auth, directly confirm a reservation.
    @Post('internal/confirm-open')
    @UseGuards(ServiceAuthGuard)
    async confirmOpen(@Body() body: any) {
        const pedidoId = body.pedido_id || body.pedidoId;
        const reservationId = body.reservation_id || body.reservationId || body.reserva_id;
        if (!reservationId) throw new BadRequestException('reservation_id is required');
        return this.service.confirmFromReservation(pedidoId, reservationId);
    }

    @Get('internal/:id')
    @UseGuards(ServiceAuthGuard)
    async findOneInternal(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Put(':id/asignar')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin', 'supervisor')
    asignar(@Param('id') id: string, @Body() body: { bodegueroId: string }) {
        return this.service.asignarBodeguero(id, body.bodegueroId);
    }

    @Post(':id/tomar')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('bodeguero')
    tomar(@Param('id') id: string, @Req() req: any) {
        const usuarioId = req.user?.userId;
        const authHeader = req.headers?.authorization || null;
        return this.service.asignarBodeguero(id, usuarioId, authHeader);
    }

    @Post(':id/iniciar')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('bodeguero')
    iniciar(@Param('id') id: string, @Req() req: any) {
        const usuarioId = req.user?.userId;
        return this.service.iniciarPicking(id, usuarioId);
    }

    @Post(':id/completar')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('bodeguero')
    completar(@Param('id') id: string, @Req() req: any, @Body() body?: any) {
        const usuarioId = req.user?.userId;
        const observacionesBodega = body?.observacionesBodega || body?.observaciones_bodega || null;
        return this.service.completarPicking(id, usuarioId, observacionesBodega);
    }

    @Post(':id/items/:itemId/pickear')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('bodeguero')
    pickearItem(
        @Param('id') pickingId: string,
        @Param('itemId') itemId: string,
        @Body() body: { cantidadPickeada: number; loteConfirmado?: string },
    ) {
        return this.service.registrarPickeo(pickingId, itemId, body.cantidadPickeada, body.loteConfirmado);
    }
}