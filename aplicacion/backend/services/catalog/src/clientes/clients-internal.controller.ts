import { Controller, Get, Param, NotFoundException, UseGuards } from '@nestjs/common';
import { ServiceAuthGuard } from '../auth/guards/service-auth.guard';

import { ClientesService } from './clientes.service';

@Controller('internal/clients')
export class ClientsInternalController {
  constructor(private readonly clientsService: ClientesService) {}

  @Get('by-user/:userId')
  @UseGuards(ServiceAuthGuard)
  async findByUserId(@Param('userId') userId: string) {
    const cliente = await this.clientsService.findByUsuarioPrincipalId(userId);
    if (!cliente) throw new NotFoundException('Usuario no tiene perfil de cliente asociado');
    return { id: cliente.id, lista_precios_id: (cliente as any).lista_precios_id ?? null };
  }

  @Get(':id')
  @UseGuards(ServiceAuthGuard)
  async findById(@Param('id') id: string) {
    const cliente = await this.clientsService.findOne(id);
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    return {
      id: cliente.id,
      usuario_principal_id: (cliente as any).usuario_principal_id ?? null,
      lista_precios_id: (cliente as any).lista_precios_id ?? null,
      vendedor_asignado_id: (cliente as any).vendedor_asignado_id ?? null,
    };
  }
}
