import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, Query, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PreciosService } from '../precios/precios.service';

import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';

@Controller('products')
export class ProductsController {
  constructor(private readonly svc: ProductsService, private readonly preciosService: PreciosService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'bodeguero', 'vendedor', 'cliente')
  findAll(@Query('page') page: string, @Query('per_page') per_page: string, @Query('q') q: string, @Req() req: any) {
    const roles = Array.isArray(req.user?.role) ? req.user.role.map((r: any) => String(r).toLowerCase()) : [String(req.user?.role).toLowerCase()];
    const pageNum = page ? Number(page) : undefined;
    const perPageNum = per_page ? Number(per_page) : undefined;
    // If user is cliente, try to obtain cliente.lista_precios_id via injected ClientesModule (available in module)
    const clienteListaId = req.user && req.user.role && roles.includes('cliente') ? (req.user['lista_precios_id'] ?? null) : null;
    return this.svc.findAll({ page: pageNum, per_page: perPageNum, q, role: roles, userId: req.user?.userId, clienteListaId });
  }

  @Get('deleted')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  findDeleted() {
    return this.svc.findDeleted();
  }

  @Post(':id/restore')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  restore(@Param('id') id: string) {
    return this.svc.restore(id);
  }

  @Get('lista/:listaId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'vendedor', 'cliente')
  productosPorLista(@Param('listaId') listaId: string, @Query('page') page: string, @Query('per_page') per_page: string, @Query('q') q: string, @Req() req: any) {
    const roles = Array.isArray(req.user?.role) ? req.user.role.map((r: any) => String(r).toLowerCase()) : [String(req.user?.role).toLowerCase()];
    const pageNum = page ? Number(page) : undefined;
    const perPageNum = per_page ? Number(per_page) : undefined;
    const clienteListaId = req.user && req.user.role && roles.includes('cliente') ? (req.user['lista_precios_id'] ?? null) : null;
    return this.preciosService.productosConPrecioParaLista(Number(listaId), { page: pageNum, per_page: perPageNum, q, role: roles, userId: req.user?.userId, clienteListaId });
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'bodeguero', 'vendedor', 'cliente')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  create(@Body() dto: Partial<Product>) {
    return this.svc.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  update(@Param('id') id: string, @Body() dto: Partial<Product>) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  remove(@Param('id') id: string) {
    return this.svc.softDelete(id);
  }
}
