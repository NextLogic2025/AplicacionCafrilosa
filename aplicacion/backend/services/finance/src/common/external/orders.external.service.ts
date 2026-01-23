import { Injectable, Logger } from '@nestjs/common';
import { ServiceHttpClient } from '../../common/http/service-http-client.service';

@Injectable()
export class OrdersExternalService {
  private readonly logger = new Logger(OrdersExternalService.name);
  constructor(private readonly serviceHttp: ServiceHttpClient) {}

  async getOrder(pedidoId: string): Promise<any> {
    try {
      return await this.serviceHttp.get<any>('orders-service', `/pedidos/internal/${pedidoId}`);
    } catch (err) {
      this.logger.debug('getOrder failed', { pedidoId, err: err?.message || err });
      throw err;
    }
  }
}
