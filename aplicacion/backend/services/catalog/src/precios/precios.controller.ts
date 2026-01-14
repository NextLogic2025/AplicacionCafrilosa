import { Controller, Post, Body, Get, Param, UseGuards, Req, Patch, Delete, Query, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

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
  ) {}

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
  async verPreciosInternal(@Param('id') id: string, @Req() req: any) {
    const serviceToken = process.env.SERVICE_TOKEN;
    const auth = (req.headers?.authorization || '').toString();
    if (serviceToken) {
      const expected = 'Bearer ' + serviceToken;
      if (auth !== expected) throw new BadRequestException('Unauthorized internal access');
    }
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