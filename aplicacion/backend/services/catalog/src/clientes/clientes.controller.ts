import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
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

  @Get('bloqueados')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  listarBloqueados() {
    return this.svc.findBlocked();
  }

  @Put(':id/desbloquear')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  desbloquear(@Param('id') id: string) {
    return this.svc.unblock(id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'vendedor', 'cliente')
  findOne(@Req() req: any, @Param('id') id: string) {
    const role = String(req.user?.role || '').toLowerCase();
    const userId = req.user?.userId;
    if (role === 'cliente' && userId !== id) throw new ForbiddenException('No autorizado');
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
  @Roles('admin', 'supervisor', 'cliente')
  update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const role = String(req.user?.role || '').toLowerCase();
    const userId = req.user?.userId;
    if (role === 'cliente' && userId !== id) throw new ForbiddenException('No autorizado');
    return this.svc.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'cliente')
  remove(@Req() req: any, @Param('id') id: string) {
    const role = String(req.user?.role || '').toLowerCase();
    const userId = req.user?.userId;
    if (role === 'cliente' && userId !== id) throw new ForbiddenException('No autorizado');
    return this.svc.remove(id);
  }
}
