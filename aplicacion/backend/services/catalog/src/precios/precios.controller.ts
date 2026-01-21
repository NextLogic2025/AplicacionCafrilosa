import { Controller, Post, Body, Get, Param, UseGuards, Req, Patch, Delete, Query, ParseIntPipe, BadRequestException, NotFoundException, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServiceAuthGuard } from '../auth/guards/service-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ClientesService } from '../clientes/clientes.service';
import { PreciosService } from './precios.service';
import { CreatePrecioDto } from './dto/create-precio.dto';
import { CreateListaPrecioDto } from './dto/create-lista-precio.dto';
import { IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// DTO para validar el endpoint batch (S2S)
class BatchItemDto {
  @IsUUID()
  id: string; // producto_id
  @IsOptional()
  cantidad?: number;
}
class BatchCalculationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchItemDto)
  items: BatchItemDto[];

  @IsOptional()
  @IsUUID()
  cliente_id?: string;
}

@Controller('precios')
export class PreciosController {
  constructor(
    private readonly preciosService: PreciosService,
    private readonly clientesService: ClientesService
  ) { }

  // --- GESTIÓN DE PRECIOS (ADMIN) ---

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  asignar(@Body() dto: CreatePrecioDto) {
    return this.preciosService.asignarPrecio(dto);
  }

  @Delete('lista/:listaId/producto/:productoId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  removePrecio(
    @Param('listaId', ParseIntPipe) listaId: number,
    @Param('productoId', ParseUUIDPipe) productoId: string
  ) {
    return this.preciosService.removePrecio(listaId, productoId);
  }

  // --- CONSULTAS PÚBLICAS Y MIXTAS ---

  @Get('producto/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'vendedor', 'cliente')
  async verPrecios(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const user = req.user;
    const isClient = this.checkRole(user, 'cliente');

    // Si es cliente, solo ve SU precio final calculado
    if (isClient) {
      const listaId = await this.resolveListaIdForUser(user.userId);
      return this.preciosService.obtenerPreciosDeProductoParaLista(id, listaId);
    }

    // Admin/Vendedor ven la tabla cruda de precios de todas las listas
    return this.preciosService.obtenerPreciosDeProducto(id);
  }

  // --- ENDPOINTS INTERNOS (S2S) ---

  @Post('internal/batch-calculator')
  @UseGuards(ServiceAuthGuard)
  async batchCalculate(@Body() dto: BatchCalculationDto) {
    let listaId = 1; // Default
    if (dto.cliente_id) {
       // Optimización: Intentar resolver lista, si falla usar default silenciosamente
       try {
         const cliente = await this.clientesService.findOne(dto.cliente_id);
         if (cliente?.lista_precios_id) listaId = cliente.lista_precios_id;
       } catch (e) {}
    }
    // IMPORTANTE: El servicio debe soportar cálculo masivo optimizado (ver abajo)
    return this.preciosService.calculateBatchForLista(dto.items, listaId);
  }

  // --- VISTAS DE CATÁLOGO ---

  // 1. Cliente viendo SU propio catálogo
  @Get('mis-precios/productos')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('cliente')
  async listarMisProductos(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('q') q: string,
    @Req() req: any,
  ) {
    const listaId = await this.resolveListaIdForUser(req.user.userId);
    return this.preciosService.productosConPrecioParaLista(listaId, { page, q });
  }

  // 2. Vendedor simulando ver el catálogo de un cliente específico
  @Get('cliente/:clienteId/productos')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'vendedor')
  async listarProductosComoCliente(
    @Param('clienteId', ParseUUIDPipe) clienteId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('q') q: string,
  ) {
    const cliente = await this.clientesService.findOne(clienteId);
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    
    const listaId = cliente.lista_precios_id ?? 1;
    return this.preciosService.productosConPrecioParaLista(listaId, { page, q });
  }

  // --- HELPERS ---

  private checkRole(user: any, role: string): boolean {
      if (!user?.role) return false;
      const roles = Array.isArray(user.role) ? user.role : [user.role];
      return roles.map(r => String(r).toLowerCase()).includes(role.toLowerCase());
  }

  private async resolveListaIdForUser(usuarioId: string): Promise<number> {
    const cliente = await this.clientesService.findByUsuarioPrincipalId(usuarioId);
    if (!cliente) throw new NotFoundException('Perfil de cliente no encontrado');
    return cliente.lista_precios_id ?? 1;
  }
}