import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';

import { SucursalesService } from './sucursales.service';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';

@Controller()
export class SucursalesController {
  constructor(private readonly service: SucursalesService) {}

  // Create a sucursal for a specific cliente
  @Post('clientes/:clienteId/sucursales')
  create(@Param('clienteId') clienteId: string, @Body() dto: CreateSucursalDto) {
    dto.cliente_id = clienteId;
    return this.service.create(dto);
  }

  // List sucursales for a specific cliente
  @Get('clientes/:clienteId/sucursales')
  findAllByCliente(@Param('clienteId') clienteId: string) {
    return this.service.findAll(clienteId);
  }

  // List deactivated sucursales for a specific cliente
  @Get('clientes/:clienteId/sucursales/desactivadas')
  findDeactivatedByCliente(@Param('clienteId') clienteId: string) {
    return this.service.findDeactivated(clienteId);
  }

  // List all active sucursales (global)
  @Get('sucursales')
  findAll() {
    return this.service.findAll();
  }

  // List all deactivated sucursales (global)
  @Get('sucursales/desactivadas')
  findAllDeactivated() {
    return this.service.findDeactivated();
  }

  // Get a sucursal by id
  @Get('sucursales/:id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // Activate a sucursal (reverse soft-delete)
  @Put('sucursales/:id/activar')
  activate(@Param('id') id: string) {
    return this.service.activate(id);
  }

  @Put('sucursales/:id')
  update(@Param('id') id: string, @Body() dto: UpdateSucursalDto) {
    return this.service.update(id, dto);
  }

  @Delete('sucursales/:id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
