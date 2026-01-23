import { Injectable, Logger } from '@nestjs/common';
import { ServiceHttpClient } from '../http/service-http-client.service';

interface UsuarioExterno {
  id: string;
  nombre?: string;
  nombreCompleto?: string;
  email: string;
  telefono?: string;
}

@Injectable()
export class UsuariosExternalService {
  private readonly logger = new Logger(UsuariosExternalService.name);
  constructor(private readonly serviceHttp: ServiceHttpClient) {}

  async fetchUsuariosByIds(ids: string[]): Promise<UsuarioExterno[]> {
    if (!ids || !ids.length) return [];
    try {
      const usuarios = await this.serviceHttp.post<UsuarioExterno[]>(
        'usuarios-service',
        '/usuarios/batch/internal',
        { ids },
      );
      return usuarios || [];
    } catch (err) {
      this.logger.warn(`Error fetching usuarios by ids: ${err?.message}`);
      return [];
    }
  }
}
