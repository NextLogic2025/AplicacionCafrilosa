import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

import { PromocionesService } from './promociones.service';

@Controller('promociones')
export class PromocionesController {
  constructor(private svc: PromocionesService) {}

  @Get()
  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'vendedor')
  listCampanias() {
    return this.svc.findCampanias();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'vendedor')
  @Get(':id')
  getCampania(@Param('id') id: number) {
    return this.svc.findCampania(Number(id));
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  create(@Body() body: any) {
    return this.svc.createCampania(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  update(@Param('id') id: number, @Body() body: any) {
    return this.svc.updateCampania(Number(id), body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: number) {
    return this.svc.removeCampania(Number(id));
  }

  @Post(':id/productos')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  addProducto(@Param('id') id: number, @Body() body: any) {
    // body should include producto_id and precio_oferta_fijo
    return this.svc.addProductoPromo({ campania_id: Number(id), ...body });
  }

  @Get(':id/productos')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'vendedor')
  @Get(':id/productos')
  productos(@Param('id') id: number) {
    return this.svc.findPromosByCampania(Number(id));
  }
}
