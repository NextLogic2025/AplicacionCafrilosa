import { Controller, Get, Post, Delete, Body, Param, UseGuards, Put } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

import { AsignacionService } from './asignacion.service';

@Controller('asignacion')
export class AsignacionController {
  constructor(private svc: AsignacionService) {}

  @Get()
  list() {
    return this.svc.findAll();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  create(@Body() body: any) {
    return this.svc.create(body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  remove(@Param('id') id: number) {
    return this.svc.remove(Number(id));
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  update(@Param('id') id: number, @Body() body: any) {
    return this.svc.update(Number(id), body);
  }
}
