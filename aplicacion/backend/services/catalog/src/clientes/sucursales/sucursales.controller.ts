import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req, ForbiddenException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';

import { SucursalesService } from './sucursales.service';
import { ClientesService } from '../clientes.service';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';

@Controller()
export class SucursalesController {
  private readonly logger = new Logger(SucursalesController.name);

  constructor(private readonly service: SucursalesService, private readonly clientesService: ClientesService) {}

  private async ensureClientOwnership(req: any, clienteId: string) {
    const role = String(req.user?.role || '').toLowerCase();
    const userId = req.user?.userId;
    if (role !== 'cliente') return; // only restrict for clients

    if (userId === clienteId) return; // token contains the same id (rare)

    // Try to resolve cliente record linked to this userId
    const cliente = await this.clientesService.findByUsuarioPrincipalId(userId);
    if (!cliente || cliente.id !== clienteId) {
      this.logger.warn(`ownership check failed - token userId=${userId} not linked to clienteId=${clienteId}`);
      throw new ForbiddenException('No autorizado');
    }
  }

  // Create a sucursal for a specific cliente
  @Post('clientes/:clienteId/sucursales')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'cliente')
  async create(@Req() req: any, @Param('clienteId') clienteId: string, @Body() dto: CreateSucursalDto) {
    this.logger.debug(`create called - user=${JSON.stringify(req.user)} clienteIdParam=${clienteId}`);
    // if requester is cliente, ensure they can only create for themselves (or for the cliente linked to their user)
    await this.ensureClientOwnership(req, clienteId);
    dto.cliente_id = clienteId;
    const res = this.service.create(dto);
    this.logger.debug(`create result=${JSON.stringify(res)}`);
    return res;
  }

  // List sucursales for a specific cliente
  @Get('clientes/:clienteId/sucursales')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'cliente', 'vendedor')
  async findAllByCliente(@Req() req: any, @Param('clienteId') clienteId: string) {
    this.logger.debug(`findAllByCliente called - user=${JSON.stringify(req.user)} clienteIdParam=${clienteId}`);
    await this.ensureClientOwnership(req, clienteId);
    const res = await this.service.findAll(clienteId);
    this.logger.debug(`findAllByCliente result_count=${Array.isArray(res) ? res.length : 0}`);
    return res;
  }

  // List deactivated sucursales for a specific cliente
  @Get('clientes/:clienteId/sucursales/desactivadas')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'cliente','vendedor')
  async findDeactivatedByCliente(@Req() req: any, @Param('clienteId') clienteId: string) {
    this.logger.debug(`findDeactivatedByCliente called - user=${JSON.stringify(req.user)} clienteIdParam=${clienteId}`);
    await this.ensureClientOwnership(req, clienteId);
    const res = await this.service.findDeactivated(clienteId);
    this.logger.debug(`findDeactivatedByCliente result_count=${Array.isArray(res) ? res.length : 0}`);
    return res;
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
    this.logger.debug(`findOne called - user=${JSON.stringify(req.user)} sucursalId=${id}`);
    const suc = await this.service.findOne(id);
    if (!suc) {
      this.logger.debug(`findOne result - not found id=${id}`);
      return null;
    }
    await this.ensureClientOwnership(req, suc.cliente_id);
    this.logger.debug(`findOne result - sucursal id=${suc.id} cliente_id=${suc.cliente_id}`);
    return suc;
  }

  // Activate a sucursal (reverse soft-delete) - owner or supervisor/admin
  @Put('sucursales/:id/activar')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'cliente')
  async activate(@Req() req: any, @Param('id') id: string) {
    const suc = await this.service.findOne(id);
    if (!suc) throw new ForbiddenException('Sucursal no encontrada');
    await this.ensureClientOwnership(req, suc.cliente_id);
    return this.service.activate(id);
  }

  @Put('sucursales/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'cliente')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateSucursalDto) {
    const suc = await this.service.findOne(id);
    if (!suc) throw new ForbiddenException('Sucursal no encontrada');
    await this.ensureClientOwnership(req, suc.cliente_id);
    return this.service.update(id, dto);
  }

  @Delete('sucursales/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'cliente')
  async remove(@Req() req: any, @Param('id') id: string) {
    const suc = await this.service.findOne(id);
    if (!suc) throw new ForbiddenException('Sucursal no encontrada');
    await this.ensureClientOwnership(req, suc.cliente_id);
    return this.service.remove(id);
  }
}
