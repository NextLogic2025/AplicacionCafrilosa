import { Injectable, Logger } from '@nestjs/common';
import { ServiceHttpClient } from '../../common/http/service-http-client.service';

@Injectable()
export class UsuariosExternalService {
  private readonly logger = new Logger(UsuariosExternalService.name);
  constructor(private readonly serviceHttp: ServiceHttpClient) {}

  async batchUsuarios(ids: string[]) {
    try {
      return await this.serviceHttp.post<any[]>('usuarios-service', '/usuarios/batch/internal', { ids });
    } catch (e) {
      this.logger.debug('usuarios batchUsuarios error ' + (e?.message || e));
      throw e;
    }
  }
}
