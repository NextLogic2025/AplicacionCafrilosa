import { Injectable, Logger } from '@nestjs/common';
import { ServiceHttpClient } from '../../common/http/service-http-client.service';

@Injectable()
export class FinanceExternalService {
  private readonly logger = new Logger(FinanceExternalService.name);
  constructor(private readonly serviceHttp: ServiceHttpClient) {}

  async createFactura(payload: any) {
    try {
      return await this.serviceHttp.post<any>('finance-service', '/facturas/internal', payload);
    } catch (e) {
      this.logger.debug('createFactura failed', { error: e?.message || e });
      throw e;
    }
  }

  async findByPedido(pedidoId: string) {
    try {
      return await this.serviceHttp.get<any>('finance-service', `/facturas/internal/pedido/${pedidoId}`);
    } catch (e) {
      this.logger.debug('findByPedido failed', { pedidoId, error: e?.message || e });
      throw e;
    }
  }
}
