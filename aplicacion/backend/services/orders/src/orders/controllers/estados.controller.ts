import { Controller, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { OrdersService } from '../services/orders.service';

@Controller('orders/estados')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EstadosController {
  constructor(private readonly ordersService: OrdersService) {}

  @Patch(':orderId/state')
  @Roles('admin', 'supervisor', 'bodeguero')
  changeState(@Param('orderId') orderId: string, @Req() req: any, @Body('nuevoEstado') nuevoEstado: string, @Body('comentario') comentario?: string) {
    // Obtener usuario desde JWT (req.user)
    const usuarioId = req.user?.sub || req.user?.id || null;
    return this.ordersService.updateStatus(orderId, nuevoEstado, usuarioId, comentario);
  }
}
