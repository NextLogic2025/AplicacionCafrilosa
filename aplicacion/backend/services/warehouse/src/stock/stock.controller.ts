// stock/stock.controller.ts
import { Controller, Get, Post, Put, Param, Body, UseGuards, Query, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

import { StockService } from './stock.service';
import { CreateStockDto, AjusteStockDto } from './dto/create-stock.dto';

@Controller('stock')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class StockController {
    constructor(private readonly service: StockService) { }

    @Get()
    @Roles('admin', 'supervisor', 'bodeguero', 'vendedor')
    findAll() {
        return this.service.findAll();
    }

    @Get('ubicacion/:id')
    @Roles('admin', 'supervisor', 'bodeguero')
    findByUbicacion(@Param('id') id: string) {
        return this.service.findByUbicacion(id);
    }

    @Get('producto/:id')
    @Roles('admin', 'supervisor', 'bodeguero', 'vendedor')
    findByProducto(@Param('id') id: string) {
        return this.service.findByProducto(id);
    }

    @Post()
    @Roles('admin', 'supervisor', 'bodeguero')
    create(@Body() dto: CreateStockDto, @Req() req: any) {
        const usuarioId = req.user?.userId;
        return this.service.create(dto, usuarioId);
    }

    @Post('ajustar')
    @Roles('admin', 'supervisor', 'bodeguero')
    ajustar(@Body() dto: AjusteStockDto) {
        return this.service.ajustarStock(dto);
    }
}