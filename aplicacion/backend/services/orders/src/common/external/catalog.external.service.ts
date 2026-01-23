import { Injectable, Logger } from '@nestjs/common';
import { ServiceHttpClient } from '../../common/http/service-http-client.service';

@Injectable()
export class CatalogExternalService {
  private readonly logger = new Logger(CatalogExternalService.name);
  constructor(private readonly serviceHttp: ServiceHttpClient) {}

  async getClientByPath(pathId: string): Promise<any> {
    try {
      return await this.serviceHttp.get('catalog-service', `/internal/clients/${pathId}`);
    } catch (err) {
      this.logger.debug('getClientByPath failed', { pathId, err: err?.message || err });
      throw err;
    }
  }

  async getClientByUser(userId: string): Promise<any> {
    try {
      return await this.serviceHttp.get('catalog-service', `/internal/clients/by-user/${userId}`);
    } catch (err) {
      this.logger.debug('getClientByUser failed', { userId, err: err?.message || err });
      throw err;
    }
  }

  async batchProducts(ids: string[], cliente_id?: string): Promise<any[]> {
    try {
      return await this.serviceHttp.post<any[]>('catalog-service', '/products/internal/batch', { ids, cliente_id });
    } catch (err) {
      this.logger.warn('batchProducts failed', { ids, cliente_id, err: err?.message || err });
      throw err;
    }
  }

  async calculateBatchPrices(items: any[], cliente_id?: string): Promise<any[]> {
    try {
      return await this.serviceHttp.post<any[]>('catalog-service', '/precios/internal/batch-calculator', { items, cliente_id });
    } catch (err) {
      this.logger.warn('calculateBatchPrices failed', { err: err?.message || err });
      throw err;
    }
  }

  async validatePromotion(productId: string, campaniaId?: number | string, cliente_id?: string): Promise<any> {
    try {
      const qs = [] as string[];
      if (campaniaId != null) qs.push('campania_id=' + encodeURIComponent(String(campaniaId)));
      if (cliente_id) qs.push('cliente_id=' + encodeURIComponent(String(cliente_id)));
      const query = qs.length ? ('?' + qs.join('&')) : '';
      return await this.serviceHttp.get('catalog-service', `/promociones/internal/validar/producto/${productId}${query}`);
    } catch (err) {
      this.logger.warn('validatePromotion failed', { productId, campaniaId, cliente_id, err: err?.message || err });
      throw err;
    }
  }

  async getSucursal(sucursalId: string): Promise<any> {
    try {
      return await this.serviceHttp.get('catalog-service', `/sucursales/${sucursalId}`);
    } catch (err) {
      this.logger.debug('getSucursal failed', { sucursalId, err: err?.message || err });
      throw err;
    }
  }
}
