import { Injectable, Logger } from '@nestjs/common';
import { ServiceHttpClient } from '../../common/http/service-http-client.service';

@Injectable()
export class WarehouseExternalService {
  private readonly logger = new Logger(WarehouseExternalService.name);
  constructor(private readonly serviceHttp: ServiceHttpClient) {}

  async confirmPicking(body: any): Promise<any> {
    return this.serviceHttp.post<any>('warehouse-service', '/picking/confirm', body);
  }

  async getPicking(pickingId: string): Promise<any> {
    return this.serviceHttp.get<any>('warehouse-service', `/picking/internal/${pickingId}`);
  }
}
