// picking/picking.controller.ts
import { Controller, Get, Post, Put, Param, Body, UseGuards, Query, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

import { PickingService } from './picking.service';
import { CreatePickingDto } from './dto/create-picking.dto';

@Controller('picking')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PickingController {
    constructor(private readonly service: PickingService) { }

    @Get()
    @Roles('admin', 'supervisor', 'bodeguero')
    findAll(@Query('estado') estado?: string) {
        return this.service.findAll(estado);
    }

    @Get('mis-ordenes')
    @Roles('bodeguero')
    misOrdenes(@Req() req: any) {
        const bodegueroId = req.user?.userId;
        return this.service.findByBodeguero(bodegueroId);
    }

    @Get(':id')
    @Roles('admin', 'supervisor', 'bodeguero')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Post()
    @Roles('admin', 'supervisor')
    create(@Body() dto: CreatePickingDto) {
        return this.service.create(dto);
    }

    @Put(':id/asignar')
    @Roles('admin', 'supervisor')
    asignar(@Param('id') id: string, @Body() body: { bodegueroId: string }) {
        return this.service.asignarBodeguero(id, body.bodegueroId);
    }

    @Post(':id/iniciar')
    @Roles('bodeguero')
    iniciar(@Param('id') id: string, @Req() req: any) {
        const usuarioId = req.user?.userId;
        return this.service.iniciarPicking(id, usuarioId);
    }

    @Post(':id/completar')
    @Roles('bodeguero')
    completar(@Param('id') id: string, @Req() req: any) {
        const usuarioId = req.user?.userId;
        return this.service.completarPicking(id, usuarioId);
    }

    @Post(':id/items/:itemId/pickear')
    @Roles('bodeguero')
    pickearItem(
        @Param('id') pickingId: string,
        @Param('itemId') itemId: string,
        @Body() body: { cantidadPickeada: number; loteConfirmado?: string },
    ) {
        return this.service.registrarPickeo(pickingId, itemId, body.cantidadPickeada, body.loteConfirmado);
    }
}