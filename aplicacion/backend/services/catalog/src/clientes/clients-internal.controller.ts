import { Controller, Get, Param, NotFoundException } from '@nestjs/common';

import { ClientesService } from './clientes.service';

@Controller('internal/clients')
export class ClientsInternalController {
  constructor(private readonly clientsService: ClientesService) {}

  @Get('by-user/:userId')
  async findByUserId(@Param('userId') userId: string) {
    const cliente = await this.clientsService.findByUsuarioPrincipalId(userId);
    if (!cliente) throw new NotFoundException('Usuario no tiene perfil de cliente asociado');
    return { id: cliente.id, lista_precios_id: (cliente as any).lista_precios_id ?? null };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const cliente = await this.clientsService.findOne(id);
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    return {
      id: cliente.id,
      lista_precios_id: (cliente as any).lista_precios_id ?? null,
      vendedor_asignado_id: (cliente as any).vendedor_asignado_id ?? null,
    };
  }
}
