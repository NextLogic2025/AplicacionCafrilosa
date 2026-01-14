// devoluciones/devoluciones.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

import { DevolucionesService } from './devoluciones.service';
import { CreateDevolucionDto, ProcesarDevolucionDto } from './dto/create-devolucion.dto';

@Controller('devoluciones')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DevolucionesController {
    constructor(private readonly service: DevolucionesService) { }

    @Get()
    @Roles('admin', 'supervisor', 'bodeguero')
    findAll() {
        return this.service.findAll();
    }

    @Get(':id')
    @Roles('admin', 'supervisor', 'bodeguero')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Post()
    @Roles('admin', 'supervisor', 'bodeguero')
    create(@Body() dto: CreateDevolucionDto, @Req() req: any) {
        const usuarioId = req.user?.userId;
        return this.service.create(dto, usuarioId);
    }

    @Put(':id/procesar')
    @Roles('admin', 'supervisor', 'bodeguero')
    procesar(@Param('id') id: string, @Body() dto: ProcesarDevolucionDto, @Req() req: any) {
        const usuarioId = req.user?.userId;
        return this.service.procesar(id, dto, usuarioId);
    }

    @Delete(':id')
    @Roles('admin', 'supervisor')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}