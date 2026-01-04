import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { SucursalesService } from './sucursales.service';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';

@Controller('clientes/sucursales')
export class SucursalesController {
  constructor(private readonly service: SucursalesService) {}

  @Post()
  create(@Body() dto: CreateSucursalDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('clienteId') clienteId?: string) {
    return this.service.findAll(clienteId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSucursalDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
