import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

import { ClientesService } from './clientes.service';

@Controller('clientes')
export class ClientesController {
  constructor(private svc: ClientesService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'transportista')
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'vendedor')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Get('mis')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'vendedor')
  mis(@Req() req: any) {
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
