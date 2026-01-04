import { Controller, Post, Body, Get, Param, UseGuards, Req, Patch, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ClientesService } from '../clientes/clientes.service';

import { PreciosService } from './precios.service';
import { AsignarPrecioDto } from './dto/asignar-precio.dto';
import { ListaPrecioDto } from './dto/lista-precio.dto';
import { UpdateListaPrecioDto } from './dto/update-lista-precio.dto';

@Controller('precios')
export class PreciosController {
  constructor(private readonly preciosService: PreciosService, private readonly clientesService: ClientesService) { }

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

  // CRUD para listas de precios
  @Get('listas')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  listarListas() {
    return this.preciosService.listAllListas();
  }

  @Post('listas')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  crearLista(@Body() body: ListaPrecioDto) {
    return this.preciosService.createLista(body as any);
  }

  @Patch('listas/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  actualizarLista(@Param('id') id: string, @Body() body: UpdateListaPrecioDto) {
    return this.preciosService.updateLista(Number(id), body as any);
  }

  @Delete('listas/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  eliminarLista(@Param('id') id: string) {
    return this.preciosService.deleteLista(Number(id));
  }

  // Listado: solo productos que tengan precio en la lista (ej. para clientes mayoristas)
  @Get('lista/:id/productos')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'vendedor', 'cliente')
  listarProductosConPrecio(@Param('id') id: string) {
    return this.preciosService.productosConPrecioParaLista(Number(id));
  }

  // Eliminar un precio asignado a un producto en una lista
  @Delete('lista/:listaId/producto/:productoId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  removePrecio(@Param('listaId') listaId: string, @Param('productoId') productoId: string) {
    return this.preciosService.removePrecio(Number(listaId), productoId);
  }

  // Listado: todos los productos y, si existe, su precio según la lista (para supervisor)
  @Get('lista/:id/productos-all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  async listarTodosProductosConPrecio(@Param('id') id: string) {
    return this.preciosService.todosProductosConPrecioParaLista(Number(id));
  }
}