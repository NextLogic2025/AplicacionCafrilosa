import { 
    Controller, Get, Post, Body, Param, Put, Delete, UseGuards, 
    Req, ForbiddenException, Logger, ParseUUIDPipe, HttpStatus 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ClientesService } from '../clientes.service';

import { SucursalesService } from './sucursales.service';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';
import { SucursalCliente } from './entities/sucursal.entity';

@ApiTags('Sucursales')
@ApiBearerAuth()
@Controller()
export class SucursalesController {
  private readonly logger = new Logger(SucursalesController.name);

  constructor(
      private readonly service: SucursalesService, 
      private readonly clientesService: ClientesService
  ) {}

  /**
   * Verifica que el usuario (si es cliente) sea dueño del recurso
   */
  private async ensureClientOwnership(req: any, clienteIdTarget: string) {
    const rawRole = req.user?.role;
    const roles = Array.isArray(rawRole) 
        ? rawRole.map(r => String(r).toLowerCase()) 
        : [String(rawRole || '').toLowerCase()];
    
    // Si no es cliente (es admin/supervisor/vendedor), pase.
    if (!roles.includes('cliente')) return;

    const userId = req.user?.userId;

    // Caso 1: El token ya trae el ID del cliente (raro pero posible)
    if (userId === clienteIdTarget) return;

    // Caso 2: Resolver ID de cliente a partir del usuario
    const cliente = await this.clientesService.findByUsuarioPrincipalId(userId);
    
    if (!cliente || cliente.id !== clienteIdTarget) {
      this.logger.warn(`Intento de acceso no autorizado. User: ${userId} intentó acceder a Cliente: ${clienteIdTarget}`);
      throw new ForbiddenException('No tienes permiso para gestionar sucursales de este cliente');
    }
  }

  // --- Endpoints ---

  @Post('clientes/:clienteId/sucursales')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'cliente')
  @ApiOperation({ summary: 'Crear sucursal para un cliente' })
  @ApiResponse({ status: 201, description: 'Sucursal creada', type: SucursalCliente })
  async create(
      @Req() req: any, 
      @Param('clienteId', ParseUUIDPipe) clienteId: string, 
      @Body() dto: CreateSucursalDto
  ) {
    await this.ensureClientOwnership(req, clienteId);
    // Forzamos el ID de la URL por seguridad
    dto.cliente_id = clienteId; 
    return this.service.create(dto);
  }

  @Get('clientes/:clienteId/sucursales')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'cliente', 'vendedor')
  @ApiOperation({ summary: 'Listar sucursales de un cliente' })
  async findAllByCliente(
      @Req() req: any, 
      @Param('clienteId', ParseUUIDPipe) clienteId: string
  ) {
    await this.ensureClientOwnership(req, clienteId);
    return this.service.findAll(clienteId);
  }

  @Get('clientes/:clienteId/sucursales/desactivadas')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'cliente', 'vendedor')
  @ApiOperation({ summary: 'Ver papelera de sucursales de un cliente' })
  async findDeactivatedByCliente(
      @Req() req: any, 
      @Param('clienteId', ParseUUIDPipe) clienteId: string
  ) {
    await this.ensureClientOwnership(req, clienteId);
    return this.service.findDeactivated(clienteId);
  }

  @Get('sucursales')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  @ApiOperation({ summary: 'Listar TODAS las sucursales (Global)' })
  findAll() {
    return this.service.findAll();
  }

  @Get('sucursales/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'cliente', 'vendedor')
  @ApiOperation({ summary: 'Obtener detalle de sucursal' })
  async findOne(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    const suc = await this.service.findOne(id);
    if (!suc) throw new ForbiddenException('Sucursal no encontrada');
    await this.ensureClientOwnership(req, suc.cliente_id);
    return suc;
  }

  @Put('sucursales/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'cliente')
  @ApiOperation({ summary: 'Actualizar sucursal' })
  async update(
      @Req() req: any, 
      @Param('id', ParseUUIDPipe) id: string, 
      @Body() dto: UpdateSucursalDto
  ) {
    const suc = await this.service.findOne(id);
    if (!suc) throw new ForbiddenException('Sucursal no encontrada');
    await this.ensureClientOwnership(req, suc.cliente_id);
    return this.service.update(id, dto);
  }

  @Delete('sucursales/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'cliente')
  @ApiOperation({ summary: 'Eliminar sucursal (Soft Delete)' })
  async remove(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    const suc = await this.service.findOne(id);
    if (!suc) throw new ForbiddenException('Sucursal no encontrada');
    await this.ensureClientOwnership(req, suc.cliente_id);
    return this.service.remove(id);
  }

  @Put('sucursales/:id/activar')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'cliente')
  @ApiOperation({ summary: 'Restaurar sucursal eliminada' })
  async activate(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    const suc = await this.service.findOne(id);
    if (!suc) throw new ForbiddenException('Sucursal no encontrada');
    await this.ensureClientOwnership(req, suc.cliente_id);
    return this.service.activate(id);
  }
}
