import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

import { RuteroService } from './rutero.service';

@Controller('rutero')
export class RuteroController {
  constructor(private svc: RuteroService) {}

  @Get()
  all() {
    return this.svc.findAll();
  }

  @Get('cliente/:id')
  forCliente(@Param('id') id: string) {
    return this.svc.findForCliente(id);
  }

  @Get('mio')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'vendedor')
  mio(@Req() req: any) {
    const vendedorId = req.user?.userId;
    return this.svc.findForVendedor(vendedorId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  create(@Body() body: any) {
    return this.svc.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  update(@Param('id') id: string, @Body() body: any) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
