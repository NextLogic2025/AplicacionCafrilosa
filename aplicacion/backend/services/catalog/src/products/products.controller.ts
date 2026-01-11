import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, Query, Req, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ClientesService } from '../clientes/clientes.service';
import { PreciosService } from '../precios/precios.service';

import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto'; // Importa tu DTO

@Controller('products')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(
    private readonly svc: ProductsService,
    private readonly clientesService: ClientesService,
    private readonly preciosService: PreciosService,
  ) {}

  @Get()
  @Roles('admin', 'supervisor', 'bodeguero', 'vendedor', 'cliente')
  async findAll(
    @Query('page') page: string, 
    @Query('per_page') perPage: string, 
    @Query('q') q: string, 
    @Req() req: any
  ) {
    const { roles, clienteListaId, clienteId } = await this.resolveClientContext(req);
    
    return this.svc.findAll({
      page: Number(page) || 1,
      per_page: Number(perPage) || 20,
      q,
      roles,
      clienteListaId,
      clienteId,
    });
  }

  @Get('deleted')
  @Roles('admin', 'supervisor')
  findDeleted() {
    return this.svc.findDeleted();
  }

  @Get('categoria/:categoriaId')
  @Roles('admin', 'supervisor', 'bodeguero', 'vendedor', 'cliente')
  async productosPorCategoria(
    @Param('categoriaId') categoriaId: string,
    @Query('page') page: string,
    @Query('per_page') perPage: string,
    @Query('q') q: string,
    @Req() req: any,
  ) {
    const { roles, clienteListaId, clienteId } = await this.resolveClientContext(req);
    return this.svc.findByCategory(Number(categoriaId), {
      page: Number(page) || 1,
      per_page: Number(perPage) || 20,
      q,
      roles,
      clienteListaId,
      clienteId,
    });
  }

  @Get(':id')
  @Roles('admin', 'supervisor', 'bodeguero', 'vendedor', 'cliente')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const { roles, clienteListaId, clienteId } = await this.resolveClientContext(req);
    return this.svc.findOne(id, { roles, clienteListaId, clienteId });
  }

  @Post()
  @Roles('admin', 'supervisor')
  create(@Body() body: any) {
    // Normalizar payload aceptando snake_case desde el cliente
    const dto: any = {
      codigoSku: body.codigo_sku ?? body.codigoSku,
      nombre: body.nombre,
      descripcion: body.descripcion ?? body.description ?? null,
      categoriaId: body.categoria_id ?? body.categoriaId ?? undefined,
      pesoUnitarioKg: body.peso_unitario_kg != null ? Number(body.peso_unitario_kg) : (body.pesoUnitarioKg != null ? Number(body.pesoUnitarioKg) : undefined),
      volumenM3: body.volumen_m3 != null ? Number(body.volumen_m3) : (body.volumenM3 != null ? Number(body.volumenM3) : undefined),
      requiereFrio: body.requiere_frio ?? body.requiereFrio ?? false,
      unidadMedida: body.unidad_medida ?? body.unidadMedida ?? undefined,
      imagenUrl: body.imagen_url ?? body.imagenUrl ?? null,
    };

    return this.svc.create(dto as CreateProductDto);
  }

  @Put(':id')
  @Roles('admin', 'supervisor')
  update(@Param('id') id: string, @Body() dto: Partial<CreateProductDto>) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'supervisor')
  remove(@Param('id') id: string) {
    return this.svc.softDelete(id);
  }

  @Post(':id/restore')
  @Roles('admin', 'supervisor')
  restore(@Param('id') id: string) {
    return this.svc.restore(id);
  }

  // --- Helper Privado para Contexto ---
  private async resolveClientContext(req: any) {
    const roles = Array.isArray(req.user?.role) 
      ? req.user.role.map((r: any) => String(r).toLowerCase()) 
      : [String(req.user?.role || '').toLowerCase()];

    let clienteListaId: number | null = null;
    let clienteId: string | undefined = undefined;

    if (roles.includes('cliente')) {
      // 1. Intentar obtener del token
      clienteListaId = req.user['lista_precios_id'] ?? null;
      clienteId = req.user?.userId ?? undefined;

      // 2. Si no está en token, buscar en DB
      if (!clienteListaId && req.user?.userId) {
        const cliente = await this.clientesService.findByUsuarioPrincipalId(req.user.userId);
        if (cliente) {
          clienteListaId = (cliente as any).lista_precios_id ?? null;
          clienteId = (cliente as any).id ?? clienteId;
        }
      }
    }

    return { roles, clienteListaId, clienteId };
  }
}