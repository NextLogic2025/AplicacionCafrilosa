import { Injectable, Logger } from '@nestjs/common';
import { ServiceHttpClient } from '../../common/http/service-http-client.service';

@Injectable()
export class OrdersExternalService {
  private readonly logger = new Logger(OrdersExternalService.name);
  constructor(private readonly serviceHttp: ServiceHttpClient) {}

  async getOrder(pedidoId: string) {
    try {
      // Prefer internal endpoint
      return await this.serviceHttp.get<any>('orders-service', `/pedidos/internal/${pedidoId}`);
    } catch (e) {
      this.logger.debug('orders getOrder internal failed, trying public path: ' + (e?.message || e));
    }
  }

  async applyPicking(pedidoId: string, payload: any) {
    return this.serviceHttp.post('orders-service', `/pedidos/internal/${pedidoId}/apply-picking`, payload);
  }

  async patchStatus(pedidoId: string, statusPayload: any, headers?: Record<string,string>) {
    const opts = headers ? { headers } : undefined;
    return this.serviceHttp.patch('orders-service', `/pedidos/internal/${pedidoId}/status`, statusPayload, opts as any);
  }
}
 