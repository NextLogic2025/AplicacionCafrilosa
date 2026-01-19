import { 
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, ForbiddenException, HttpStatus, ParseUUIDPipe 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

import { ClientesService } from './clientes.service';
import { Cliente } from './entities/cliente.entity';
import { CreateClienteDto, UpdateClienteDto } from './dto/create-cliente.dto';

@ApiTags('Clientes')
@ApiBearerAuth()
@Controller('clientes')
export class ClientesController {
  constructor(private svc: ClientesService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'transportista')
  @ApiOperation({ summary: 'Listar todos los clientes activos' })
  @ApiResponse({ status: 200, description: 'Lista de clientes enriquecida.', type: [Cliente] })
  findAll() {
    return this.svc.findAll();
  }

  @Get('bloqueados')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  listarBloqueados() {
    return this.svc.findBlocked();
  }

  @Put(':id/desbloquear')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  desbloquear(@Param('id') id: string) {
    return this.svc.unblock(id);
  }

  @Get('mis')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'vendedor')
  mis(@Req() req: any) {
    const vendedorId = req.user?.userId;
    return this.svc.findForVendedor(vendedorId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'vendedor', 'cliente')
  findOne(@Req() req: any, @Param('id') id: string) {
    const rawRole = req.user?.role;
    const roles = Array.isArray(rawRole)
      ? rawRole.map((r: any) => String(r).toLowerCase())
      : [String(rawRole || '').toLowerCase()];
    const isCliente = roles.includes('cliente');
    const userId = req.user?.userId;

    // Clientes solo pueden ver su propio registro (por usuario_principal_id)
    if (isCliente) {
      return this.svc.findByUsuarioPrincipalId(userId);
    }

    // Otros roles (admin, supervisor, vendedor) buscan por id de cliente
    return this.svc.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  @ApiOperation({ summary: 'Crear nuevo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente creado correctamente.', type: Cliente })
  create(@Body() dto: CreateClienteDto) {
    return this.svc.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'cliente')
  @ApiOperation({ summary: 'Actualizar datos de cliente' })
  async update(
      @Req() req: any, 
      @Param('id', ParseUUIDPipe) id: string, 
      @Body() dto: UpdateClienteDto
  ) {
    const rawRole = req.user?.role;
    const roles = Array.isArray(rawRole)
      ? rawRole.map((r: any) => String(r).toLowerCase())
      : [String(rawRole || '').toLowerCase()];
    const isCliente = roles.includes('cliente');
    const userId = req.user?.userId;
    
    if (isCliente) {
      // Buscar el cliente por usuario_principal_id
      const cliente = await this.svc.findByUsuarioPrincipalId(userId);
      if (!cliente) throw new ForbiddenException('Cliente no encontrado');
      // Actualizar usando el id real del cliente
      return this.svc.update(cliente.id, dto);
    }
    
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'cliente')
  async remove(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    const rawRole = req.user?.role;
    const roles = Array.isArray(rawRole)
      ? rawRole.map((r: any) => String(r).toLowerCase())
      : [String(rawRole || '').toLowerCase()];
    const isCliente = roles.includes('cliente');
    const userId = req.user?.userId;
    
    if (isCliente) {
      // Buscar el cliente por usuario_principal_id
      const cliente = await this.svc.findByUsuarioPrincipalId(userId);
      if (!cliente) throw new ForbiddenException('Cliente no encontrado');
      // Bloquear usando el id real del cliente
      return this.svc.remove(cliente.id);
    }
    
    return this.svc.remove(id);
  }
}
