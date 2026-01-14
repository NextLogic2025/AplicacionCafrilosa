// lotes/lotes.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

import { LotesService } from './lotes.service';
import { CreateLoteDto, UpdateLoteDto } from './dto/create-lote.dto';

@Controller('lotes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class LotesController {
    constructor(private readonly service: LotesService) { }

    @Get()
    @Roles('admin', 'supervisor', 'bodeguero')
    findAll(@Query('producto_id') productoId?: string) {
        if (productoId) return this.service.findByProducto(productoId);
        return this.service.findAll();
    }

    @Get(':id')
    @Roles('admin', 'supervisor', 'bodeguero')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Post()
    @Roles('admin', 'supervisor', 'bodeguero')
    create(@Body() dto: CreateLoteDto) {
        return this.service.create(dto);
    }

    @Put(':id')
    @Roles('admin', 'supervisor', 'bodeguero')
    update(@Param('id') id: string, @Body() dto: UpdateLoteDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    @Roles('admin', 'supervisor')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}