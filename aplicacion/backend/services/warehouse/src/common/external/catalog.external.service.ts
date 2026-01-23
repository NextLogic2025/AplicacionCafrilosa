import { Injectable, Logger } from '@nestjs/common';
import { ServiceHttpClient } from '../../common/http/service-http-client.service';

@Injectable()
export class CatalogExternalService {
  private readonly logger = new Logger(CatalogExternalService.name);
  constructor(private readonly serviceHttp: ServiceHttpClient) {}

  async batchProducts(ids: string[]) {
    try {
      return await this.serviceHttp.post<any[]>('catalog-service', '/products/internal/batch', { ids });
    } catch (e) {
      this.logger.debug('catalog batchProducts error ' + (e?.message || e));
      throw e;
    }
  }
}
