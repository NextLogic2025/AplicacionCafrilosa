import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

import { PreciosService } from './precios.service';
import { AsignarPrecioDto } from './dto/asignar-precio.dto';

@Controller('precios')
export class PreciosController {
  constructor(private readonly preciosService: PreciosService) {}

  // POST /precios -> Para guardar o actualizar un precio individual
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  asignar(@Body() dto: AsignarPrecioDto) {
    return this.preciosService.asignarPrecio(dto);
  }

  // GET /precios/producto/:id -> Para ver la tabla de precios al editar
  @Get('producto/:id')
  verPrecios(@Param('id') id: string) {
    return this.preciosService.obtenerPreciosDeProducto(id);
  }
}
