// almacenes/almacenes.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

import { AlmacenesService } from './almacenes.service';
import { CreateAlmacenDto, UpdateAlmacenDto } from './dto/create-almacen.dto';

@Controller('almacenes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AlmacenesController {
    constructor(private readonly service: AlmacenesService) { }

    @Get()
    @Roles('admin', 'supervisor', 'bodeguero')
    findAll() {
        return this.service.findAll();
    }

    @Get(':id')
    @Roles('admin', 'supervisor', 'bodeguero')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }

    @Post()
    @Roles('admin','bodeguero')
    create(@Body() dto: CreateAlmacenDto) {
        return this.service.create(dto);
    }

    @Put(':id')
    @Roles('admin', 'bodeguero')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAlmacenDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id',)
    @Roles('admin', 'bodeguero')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.service.remove(id);
    }
}
