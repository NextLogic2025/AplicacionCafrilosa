import { Injectable, Logger } from '@nestjs/common';
import { ServiceHttpClient } from '../../common/http/service-http-client.service';

@Injectable()
export class WarehouseExternalService {
  private readonly logger = new Logger(WarehouseExternalService.name);
  constructor(private readonly serviceHttp: ServiceHttpClient) {}

  // Returns an array of pedidoIds (string[]) for pickings assigned to the bodeguero
  async getPedidoIdsByBodeguero(bodegueroId: string): Promise<string[]> {
    try {
      // Call a new internal warehouse endpoint that returns pickings for a bodeguero
      const rows = await this.serviceHttp.get<any[]>('warehouse-service', `/picking/internal/by-bodeguero/${bodegueroId}`);
      if (!Array.isArray(rows)) return [];
      return rows.map(r => r.pedidoId).filter(Boolean);
    } catch (err) {
      this.logger.debug('getPedidoIdsByBodeguero failed', { bodegueroId, err: err?.message || err });
      return [];
    }
  }
}
