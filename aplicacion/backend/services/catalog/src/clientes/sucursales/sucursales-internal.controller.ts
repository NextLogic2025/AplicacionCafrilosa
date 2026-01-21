import { Controller, Get, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { ServiceAuthGuard } from '../../auth/guards/service-auth.guard';

import { SucursalesService } from './sucursales.service';

@Controller('internal/sucursales')
export class SucursalesInternalController {
  constructor(private readonly service: SucursalesService) {}

  @Get('by-cliente/:clienteId')
  @UseGuards(ServiceAuthGuard)
  async findByCliente(@Param('clienteId') clienteId: string) {
    const list = await this.service.findAll(clienteId);
    return list.map(s => ({
      id: s.id,
      cliente_id: s.cliente_id,
      nombre_sucursal: s.nombre_sucursal,
      direccion_entrega: s.direccion_entrega,
      ubicacion_gps: s.ubicacion_gps ?? null,
      activo: s.activo,
    }));
  }

  @Get(':id')
  @UseGuards(ServiceAuthGuard)
  async findOne(@Param('id') id: string) {
    const s = await this.service.findOne(id);
    if (!s) throw new NotFoundException('Sucursal no encontrada');
    return s;
  }
}
