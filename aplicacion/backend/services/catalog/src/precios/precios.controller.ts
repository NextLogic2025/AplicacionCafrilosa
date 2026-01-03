import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

import { PreciosService } from './precios.service';
import { AsignarPrecioDto } from './dto/asignar-precio.dto';
import { ClientesService } from '../clientes/clientes.service';

@Controller('precios')
export class PreciosController {
  constructor(private readonly preciosService: PreciosService, private readonly clientesService: ClientesService) {}

  // POST /precios -> Para guardar o actualizar un precio individual
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  asignar(@Body() dto: AsignarPrecioDto) {
    return this.preciosService.asignarPrecio(dto);
  }

  // GET /precios/producto/:id -> Para ver la tabla de precios al editar
  @Get('producto/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'vendedor', 'cliente')
  async verPrecios(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    // If the requester is a cliente, limit prices to the client's assigned price list
    const roles = Array.isArray(user?.role) ? user.role.map((r: any) => String(r).toLowerCase()) : [String(user?.role).toLowerCase()];
    if (roles.includes('cliente')) {
      const cliente = await this.clientesService.findByUsuarioPrincipalId(user.userId);
      const listaId = cliente?.lista_precios_id;
      if (listaId) return this.preciosService.obtenerPreciosDeProductoParaLista(id, listaId);
      // If client has no price list assigned, return empty array
      return [];
    }

    return this.preciosService.obtenerPreciosDeProducto(id);
  }
}
