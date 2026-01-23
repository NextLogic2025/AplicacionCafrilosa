import { Injectable, Logger } from '@nestjs/common';
import { ServiceHttpClient } from '../../common/http/service-http-client.service';

@Injectable()
export class UsuariosExternalService {
  private readonly logger = new Logger(UsuariosExternalService.name);
  constructor(private readonly serviceHttp: ServiceHttpClient) {}

  async batchUsuarios(ids: string[]): Promise<any[]> {
    try {
      return await this.serviceHttp.post<any[]>('usuarios-service', '/usuarios/batch/internal', { ids });
    } catch (err) {
      this.logger.debug('batchUsuarios failed', { ids, err: err?.message || err });
      return [];
    }
  }
}
