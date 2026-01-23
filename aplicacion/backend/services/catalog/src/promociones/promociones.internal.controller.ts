import { Controller, Get, Req, Query, Param, Logger, UseGuards } from '@nestjs/common';
import { PromocionesService } from './promociones.service';
import { ClientesService } from '../clientes/clientes.service';
import { ServiceAuthGuard } from '../auth/guards/service-auth.guard';

@Controller('promociones/internal')
@UseGuards(ServiceAuthGuard)
export class PromocionesInternalController {
  private readonly logger = new Logger(PromocionesInternalController.name);

  constructor(
    private svc: PromocionesService,
    private clientesService: ClientesService,
  ) {}

  @Get('mejor/producto/:id')
  async getBestPromotionInternal(@Param('id') id: string, @Req() req: any, @Query('cliente_id') queryClienteId?: string) {
    // Reuse the same client context resolution logic from the public controller by
    // reading headers/query and resolving cliente context where applicable.
    // For internal calls, the request may include a cliente_id query param.
    try {
      // Build minimal context: try to get clienteId from query
      const clienteId = queryClienteId || undefined;
      const clienteListaId = clienteId ? (await this.clientesService.findOne(clienteId)).lista_precios_id : null;

      const best = await this.svc.getBestPromotionForProduct(id, { clienteId, listaId: clienteListaId });
      return best || {};
    } catch (err) {
      this.logger.warn({ msg: 'Error obteniendo mejor promo (internal)', err: err?.message || err });
      return {};
    }
  }

  @Get('validar/producto/:id')
  async validatePromotionInternal(
    @Param('id') id: string,
    @Query('campania_id') campaniaId?: string,
    @Query('cliente_id') queryClienteId?: string,
  ) {
    try {
      const clienteId = queryClienteId || undefined;
      const clienteListaId = clienteId ? (await this.clientesService.findOne(clienteId)).lista_precios_id : null;

      const best = await this.svc.getBestPromotionForProduct(id, { clienteId, listaId: clienteListaId });
      const valid = !!(best && campaniaId && Number(best.campania_id) === Number(campaniaId));
      return { valid, best: best || null };
    } catch (err) {
      this.logger.warn({ msg: 'Error validando promo (internal)', err: err?.message || err });
      return { valid: false, best: null };
    }
  }
}
