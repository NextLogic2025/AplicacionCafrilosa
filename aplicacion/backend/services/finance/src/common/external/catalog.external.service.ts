import { Injectable, Logger } from '@nestjs/common';
import { ServiceHttpClient } from '../../common/http/service-http-client.service';

@Injectable()
export class CatalogExternalService {
  private readonly logger = new Logger(CatalogExternalService.name);
  constructor(private readonly serviceHttp: ServiceHttpClient) {}
  
  async getClientByUser(userId: string): Promise<any> {
    try {
      return await this.serviceHttp.get('catalog-service', `/internal/clients/by-user/${userId}`);
    } catch (err) {
      this.logger.debug('getClientByUser failed', { userId, err: err?.message || err });
      throw err;
    }
  }

}
