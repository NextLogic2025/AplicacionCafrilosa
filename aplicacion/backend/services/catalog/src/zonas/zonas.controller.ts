import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

import { ZonasService } from './zonas.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('zonas')
export class ZonasController {
  constructor(private svc: ZonasService) {}

  @Get()
  @Roles('admin', 'supervisor', 'transportista', 'cliente')
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  @Roles('admin', 'supervisor', 'transportista', 'cliente')
  findOne(@Param('id') id: number) {
    return this.svc.findOne(Number(id));
  }

  @Post()
  @Roles('admin', 'supervisor')
  create(@Body() body: any) {
    return this.svc.create(body);
  }

  @Put(':id')
  @Roles('admin', 'supervisor')
  update(@Param('id') id: number, @Body() body: any) {
    return this.svc.update(Number(id), body);
  }

  @Delete(':id')
  @Roles('admin', 'supervisor')
  remove(@Param('id') id: number) {
    return this.svc.remove(Number(id));
  }

  @Put(':id/aprobar')
  @Roles('admin', 'supervisor')
  aprobar(@Param('id') id: number) {
    return this.svc.approve(Number(id));
  }
}
