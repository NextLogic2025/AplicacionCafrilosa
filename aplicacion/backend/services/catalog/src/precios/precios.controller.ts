import { Controller, Post, Body, Get, Param, UseGuards, Req, Patch, Delete, Query, ParseIntPipe, BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServiceAuthGuard } from '../auth/guards/service-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ClientesService } from '../clientes/clientes.service';

import { PreciosService } from './precios.service';
import { CreatePrecioDto } from './dto/create-precio.dto';
import { CreateListaPrecioDto } from './dto/create-lista-precio.dto';

@Controller('precios')
export class PreciosController {
  constructor(
    private readonly preciosService: PreciosService,
    private readonly clientesService: ClientesService
  ) { }

  // --- GESTIÓN DE PRECIOS ---

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  asignar(@Body() dto: CreatePrecioDto) {
    return this.preciosService.asignarPrecio(dto);
  }

  @Get('producto/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'vendedor', 'cliente')
  async verPrecios(@Param('id') id: string, @Req() req: any) {
    // Verificar si es cliente y restringir
    const clientListaId = await this.resolveClientListaId(req);

    if (clientListaId) {
      // Si es cliente, pedir directamente al servicio el precio para su lista
      return this.preciosService.obtenerPreciosDeProductoParaLista(id, clientListaId);
    }

    // Admin/Staff ven todos
    return this.preciosService.obtenerPreciosDeProducto(id);
  }

  // Internal S2S endpoint: permite llamadas desde otros servicios con SERVICE_TOKEN
  @Get('internal/producto/:id')
  @UseGuards(ServiceAuthGuard)
  async verPreciosInternal(@Param('id') id: string, @Req() req: any) {
    return this.preciosService.obtenerPreciosDeProducto(id);
  }

  @Delete('lista/:listaId/producto/:productoId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  removePrecio(
    @Param('listaId', ParseIntPipe) listaId: number,
    @Param('productoId') productoId: string
  ) {
    return this.preciosService.removePrecio(listaId, productoId);
  }

  // --- GESTIÓN DE LISTAS ---

  @Get('listas')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'vendedor')
  listarListas() {
    return this.preciosService.findAllListas();
  }

  @Post('listas')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  crearLista(@Body() dto: CreateListaPrecioDto) {
    return this.preciosService.createLista(dto);
  }

  @Patch('listas/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  actualizarLista(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateListaPrecioDto>) {
    return this.preciosService.updateLista(id, dto);
  }

  @Delete('listas/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  eliminarLista(@Param('id', ParseIntPipe) id: number) {
    return this.preciosService.deleteLista(id);
  }

  // --- VISTAS ESPECIALES ---

  @Get('lista/:id/productos')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'vendedor')
  listarProductosConPrecio(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page: string,
    @Query('q') q: string
  ) {
    return this.preciosService.productosConPrecioParaLista(id, {
      page: Number(page),
      q
    });
  }

  // Nueva ruta: Obtener productos con precio y promociones en base al cliente
  // Soporta ambas rutas: cuando el cliente consulta desde su token
  // y cuando un admin/supervisor/vendedor consulta para un cliente específico
  @Get('cliente/productos')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'vendedor', 'cliente')
  async listarProductosParaCliente(
    @Query('page') page: string,
    @Query('q') q: string,
    @Req() req: any,
    @Param('clienteId') clienteId?: string,
  ) {

    const user = req.user;
    const roles = Array.isArray(user?.role)
      ? user.role.map((r: any) => String(r).toLowerCase())
      : [String(user?.role || '').toLowerCase()];

    if (!user || !roles.includes('cliente') || !user.userId) {
      throw new BadRequestException('Cliente no proporcionado en token');
    }

    const clienteToken = await this.clientesService.findByUsuarioPrincipalId(user.userId);
    if (!clienteToken) throw new NotFoundException('Cliente no encontrado');

    const listaId = clienteToken.lista_precios_id ?? 1;
    return this.preciosService.productosConPrecioParaLista(listaId, {
      page: Number(page),
      q,
    });
  }

  // Ruta explícita para consultar precios de un cliente por su id
  // para ser usada por vendedores/supervisores (token del user no es necesario)
  @Get('cliente/:clienteId/productos')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'vendedor')
  async listarProductosParaClientePorId(
    @Param('clienteId') clienteId: string,
    @Query('page') page: string,
    @Query('q') q: string,
  ) {
    const cliente = await this.clientesService.findOne(clienteId);
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    const listaId = cliente.lista_precios_id ?? 1;
    return this.preciosService.productosConPrecioParaLista(listaId, {
      page: Number(page),
      q,
    });
  }

  // --- HELPER PRIVADO ---

  private async resolveClientListaId(req: any): Promise<number | null> {
    const user = req.user;
    const roles = Array.isArray(user?.role)
      ? user.role.map((r: any) => String(r).toLowerCase())
      : [String(user?.role || '').toLowerCase()];

    if (roles.includes('cliente')) {
      // Buscar lista asignada al cliente
      const cliente = await this.clientesService.findByUsuarioPrincipalId(user.userId);
      return cliente?.lista_precios_id || null;
    }
    return null;
  }
}