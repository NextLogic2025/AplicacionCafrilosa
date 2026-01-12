// ubicaciones/ubicaciones.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

import { UbicacionesService } from './ubicaciones.service';
import { CreateUbicacionDto, UpdateUbicacionDto } from './dto/create-ubicacion.dto';

@Controller('ubicaciones')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UbicacionesController {
    constructor(private readonly service: UbicacionesService) { }

    @Get()
    @Roles('admin', 'supervisor', 'bodeguero')
    findAll(@Query('almacen_id') almacenId?: string) {
        if (almacenId) return this.service.findByAlmacen(Number(almacenId));
        return this.service.findAll();
    }

    @Get(':id')
    @Roles('admin', 'supervisor', 'bodeguero')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Post()
    @Roles('admin', 'supervisor')
    create(@Body() dto: CreateUbicacionDto) {
        return this.service.create(dto);
    }

    @Put(':id')
    @Roles('admin', 'supervisor')
    update(@Param('id') id: string, @Body() dto: UpdateUbicacionDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    @Roles('admin')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}