import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

import { PromocionesService } from './promociones.service';
import { CreateCampaniaDto } from './dto/create-campania.dto';
import { UpdateCampaniaDto } from './dto/update-campania.dto';
import { AsignProductoPromoDto } from './dto/asign-producto-promo.dto';
import { AsignClientePromoDto } from './dto/asign-cliente-promo.dto';

@Controller('promociones')
export class PromocionesController {
  constructor(private svc: PromocionesService) {}

  // ===== CAMPAÑAS =====
  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'vendedor')
  listCampanias() {
    return this.svc.findCampanias();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'vendedor')
  getCampania(@Param('id') id: string) {
    return this.svc.findCampania(Number(id));
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  create(@Body() body: CreateCampaniaDto) {
    return this.svc.createCampania(body as any);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  update(@Param('id') id: string, @Body() body: UpdateCampaniaDto) {
    return this.svc.updateCampania(Number(id), body as any);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  remove(@Param('id') id: string) {
    return this.svc.removeCampania(Number(id));
  }

  // ===== PRODUCTOS EN CAMPAÑA =====
  @Post(':id/productos')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  addProducto(@Param('id') id: string, @Body() body: AsignProductoPromoDto) {
    return this.svc.addProductoPromo({ campania_id: Number(id), ...body } as any);
  }

  @Get(':id/productos')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'vendedor')
  getProductos(@Param('id') id: string) {
    return this.svc.findPromosByCampania(Number(id));
  }

  @Delete(':id/productos/:productoId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  removeProducto(@Param('id') id: string, @Param('productoId') productoId: string) {
    return this.svc.removeProductoPromo(Number(id), productoId);
  }

  // ===== CLIENTES PERMITIDOS (para alcance POR_CLIENTE) =====
  @Post(':id/clientes')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  addCliente(@Param('id') id: string, @Body() body: AsignClientePromoDto) {
    return this.svc.addClientePermitido(Number(id), body.cliente_id);
  }

  @Get(':id/clientes')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  getClientes(@Param('id') id: string) {
    return this.svc.findClientesPermitidos(Number(id));
  }

  @Delete(':id/clientes/:clienteId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  removeCliente(@Param('id') id: string, @Param('clienteId') clienteId: string) {
    return this.svc.removeClientePermitido(Number(id), clienteId);
  }
}

