import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

import { RuteroService } from './rutero.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('rutero')
export class RuteroController {
  constructor(private svc: RuteroService) {}

  @Get()

  @Roles('admin', 'supervisor', 'vendedor')
  all() {
    return this.svc.findAll();
  }

  @Get('cliente/:id')
  @Roles('admin', 'supervisor', 'vendedor')
  forCliente(@Param('id') id: string) {
    return this.svc.findForCliente(id);
  }

  @Get('mio')
  @Roles('admin', 'supervisor', 'vendedor')
  mio(@Req() req: any) {
    // Support tokens that set the subject as `sub` or `userId`
    const vendedorId = req.user?.userId ?? req.user?.sub;
    return this.svc.findForVendedor(vendedorId);
  }

  @Post()
  @Roles('admin', 'supervisor')
  create(@Body() body: any) {
    return this.svc.create(body);
  }

  @Put(':id')
  @Roles('admin', 'supervisor')
  update(@Param('id') id: string, @Body() body: any) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  @Roles('admin', 'supervisor')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
