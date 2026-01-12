// kardex/kardex.controller.ts
import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

import { KardexService } from './kardex.service';

@Controller('kardex')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class KardexController {
    constructor(private readonly service: KardexService) { }

    @Get()
    @Roles('admin', 'supervisor', 'bodeguero')
    findAll(@Query('fecha_inicio') fechaInicio?: string, @Query('fecha_fin') fechaFin?: string) {
        return this.service.findAll(fechaInicio, fechaFin);
    }

    @Get('producto/:id')
    @Roles('admin', 'supervisor', 'bodeguero')
    findByProducto(
        @Param('id') id: string,
        @Query('fecha_inicio') fechaInicio?: string,
        @Query('fecha_fin') fechaFin?: string,
    ) {
        return this.service.findByProducto(id, fechaInicio, fechaFin);
    }

    @Get('lote/:id')
    @Roles('admin', 'supervisor', 'bodeguero')
    findByLote(@Param('id') id: string) {
        return this.service.findByLote(id);
    }

    @Get('tipo/:tipo')
    @Roles('admin', 'supervisor')
    findByTipo(@Param('tipo') tipo: string, @Query('limit') limit?: string) {
        return this.service.findByTipo(tipo, limit ? Number(limit) : 50);
    }
}