import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';

import { SucursalesService } from './sucursales.service';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';

@Controller()
export class SucursalesController {
  constructor(private readonly service: SucursalesService) {}

  // Create a sucursal for a specific cliente
  @Post('clientes/:clienteId/sucursales')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'cliente')
  create(@Req() req: any, @Param('clienteId') clienteId: string, @Body() dto: CreateSucursalDto) {
    // if requester is cliente, ensure they can only create for themselves
    const role = String(req.user?.role || '').toLowerCase();
    const userId = req.user?.userId;
    if (role === 'cliente' && userId !== clienteId) throw new ForbiddenException('No autorizado');
    dto.cliente_id = clienteId;
    return this.service.create(dto);
  }

  // List sucursales for a specific cliente
  @Get('clientes/:clienteId/sucursales')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'cliente')
  findAllByCliente(@Req() req: any, @Param('clienteId') clienteId: string) {
    const role = String(req.user?.role || '').toLowerCase();
    const userId = req.user?.userId;
    if (role === 'cliente' && userId !== clienteId) throw new ForbiddenException('No autorizado');
    return this.service.findAll(clienteId);
  }

  // List deactivated sucursales for a specific cliente
  @Get('clientes/:clienteId/sucursales/desactivadas')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'cliente')
  findDeactivatedByCliente(@Req() req: any, @Param('clienteId') clienteId: string) {
    const role = String(req.user?.role || '').toLowerCase();
    const userId = req.user?.userId;
    if (role === 'cliente' && userId !== clienteId) throw new ForbiddenException('No autorizado');
    return this.service.findDeactivated(clienteId);
  }

  // List all active sucursales (global) - supervisor/admin only
  @Get('sucursales')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  findAll() {
    return this.service.findAll();
  }

  // List all deactivated sucursales (global) - supervisor/admin only
  @Get('sucursales/desactivadas')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  findAllDeactivated() {
    return this.service.findDeactivated();
  }

  // Get a sucursal by id - owner or supervisor/admin
  @Get('sucursales/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'cliente')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const suc = await this.service.findOne(id);
    if (!suc) return null;
    const role = String(req.user?.role || '').toLowerCase();
    const userId = req.user?.userId;
    if (role === 'cliente' && userId !== suc.cliente_id) throw new ForbiddenException('No autorizado');
    return suc;
  }

  // Activate a sucursal (reverse soft-delete) - owner or supervisor/admin
  @Put('sucursales/:id/activar')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'cliente')
  async activate(@Req() req: any, @Param('id') id: string) {
    const suc = await this.service.findOne(id);
    if (!suc) throw new ForbiddenException('Sucursal no encontrada');
    const role = String(req.user?.role || '').toLowerCase();
    const userId = req.user?.userId;
    if (role === 'cliente' && userId !== suc.cliente_id) throw new ForbiddenException('No autorizado');
    return this.service.activate(id);
  }

  @Put('sucursales/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'cliente')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateSucursalDto) {
    const suc = await this.service.findOne(id);
    if (!suc) throw new ForbiddenException('Sucursal no encontrada');
    const role = String(req.user?.role || '').toLowerCase();
    const userId = req.user?.userId;
    if (role === 'cliente' && userId !== suc.cliente_id) throw new ForbiddenException('No autorizado');
    return this.service.update(id, dto);
  }

  @Delete('sucursales/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'cliente')
  async remove(@Req() req: any, @Param('id') id: string) {
    const suc = await this.service.findOne(id);
    if (!suc) throw new ForbiddenException('Sucursal no encontrada');
    const role = String(req.user?.role || '').toLowerCase();
    const userId = req.user?.userId;
    if (role === 'cliente' && userId !== suc.cliente_id) throw new ForbiddenException('No autorizado');
    return this.service.remove(id);
  }
}
