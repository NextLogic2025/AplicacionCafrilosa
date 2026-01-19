import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  RequestTimeoutException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosRequestConfig, Method } from 'axios';
import { firstValueFrom } from 'rxjs';
import { HttpClientOptions } from './interfaces/http-client-options.interface';

interface ServiceUrlConfig {
  envKey: string;
  defaultUrl: string;
  apiPrefix?: boolean;
}

const DEFAULT_TIMEOUT_MS = 5000;

const SERVICE_URLS: Record<string, ServiceUrlConfig> = {
  'usuarios-service': {
    envKey: 'USUARIOS_SERVICE_URL',
    defaultUrl: 'http://usuarios-service:3000',
  },
  'catalog-service': {
    envKey: 'CATALOG_SERVICE_URL',
    defaultUrl: 'http://catalog-service:3000',
    apiPrefix: true,
  },
  'orders-service': {
    envKey: 'ORDERS_SERVICE_URL',
    defaultUrl: 'http://orders-service:3000',
  },
  'warehouse-service': {
    envKey: 'WAREHOUSE_SERVICE_URL',
    defaultUrl: 'http://warehouse-service:3000',
    apiPrefix: true,
  },
  'ventas-service': {
    envKey: 'VENTAS_SERVICE_URL',
    defaultUrl: 'http://ventas-service:3000',
  },
  'auth-service': {
    envKey: 'AUTH_SERVICE_URL',
    defaultUrl: 'http://auth-service:3000',
  },
};

@Injectable()
export class ServiceHttpClient {
  private readonly logger = new Logger(ServiceHttpClient.name);
  private readonly serviceBaseCache = new Map<string, { baseUrl: string; apiPrefix: boolean }>();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.validateServiceUrls();
  }

  async get<T>(
    serviceName: string,
    path: string,
    options: HttpClientOptions = {},
  ): Promise<T> {
    return this.request<T>('GET', serviceName, path, undefined, options);
  }

  async post<T>(
    serviceName: string,
    path: string,
    body?: any,
    options: HttpClientOptions = {},
  ): Promise<T> {
    return this.request<T>('POST', serviceName, path, body, options);
  }

  async patch<T>(
    serviceName: string,
    path: string,
    body?: any,
    options: HttpClientOptions = {},
  ): Promise<T> {
    return this.request<T>('PATCH', serviceName, path, body, options);
  }

  async delete<T>(
    serviceName: string,
    path: string,
    options: HttpClientOptions = {},
  ): Promise<T> {
    return this.request<T>('DELETE', serviceName, path, undefined, options);
  }

  private async request<T>(
    method: Method,
    serviceName: string,
    path: string,
    body: any,
    options: HttpClientOptions,
  ): Promise<T> {
    const { baseUrl, apiPrefix } = this.resolveServiceBase(serviceName);
    const normalizedPath = this.normalizePath(baseUrl, path, apiPrefix);
    const url = baseUrl + normalizedPath;
    const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
    const headers = this.buildHeaders(options.headers, body !== undefined);

    const config: AxiosRequestConfig = {
      method,
      url,
      timeout,
      headers,
    };

    if (body !== undefined) {
      config.data = body;
    }

    try {
      const response = await firstValueFrom(this.httpService.request<T>(config));
      return response.data;
    } catch (error) {
      throw this.handleAxiosError(error, serviceName, normalizedPath);
    }
  }

  private resolveServiceBase(serviceName: string): { baseUrl: string; apiPrefix: boolean } {
    const cached = this.serviceBaseCache.get(serviceName);
    if (cached) return cached;

    if (serviceName.startsWith('http://') || serviceName.startsWith('https://')) {
      const baseUrl = this.normalizeBaseUrl(serviceName);
      const resolved = { baseUrl, apiPrefix: baseUrl.endsWith('/api') };
      this.serviceBaseCache.set(serviceName, resolved);
      return resolved;
    }

    const config = SERVICE_URLS[serviceName];
    if (!config) {
      throw new BadRequestException(`Unknown service "${serviceName}"`);
    }

    const configuredUrl =
      this.configService.get<string>(config.envKey) ||
      process.env[config.envKey] ||
      config.defaultUrl;

    if (!configuredUrl) {
      throw new InternalServerErrorException(
        `Missing base URL for service "${serviceName}" (${config.envKey})`,
      );
    }

    const baseUrl = this.normalizeBaseUrl(configuredUrl);
    const resolved = { baseUrl, apiPrefix: Boolean(config.apiPrefix) };
    this.serviceBaseCache.set(serviceName, resolved);
    return resolved;
  }

  private normalizeBaseUrl(baseUrl: string): string {
    return baseUrl.replace(/\/+$/, '');
  }

  private normalizePath(baseUrl: string, path: string, apiPrefix: boolean): string {
    if (!path.startsWith('/')) {
      throw new BadRequestException(`Path must start with "/": ${path}`);
    }

    const baseHasApi = baseUrl.endsWith('/api');
    const pathHasApi = path === '/api' || path.startsWith('/api/');
    let normalizedPath = path;

    if (baseHasApi && pathHasApi) {
      normalizedPath = normalizedPath.replace(/^\/api/, '');
    } else if (!baseHasApi && apiPrefix && !pathHasApi) {
      normalizedPath = `/api${normalizedPath}`;
    }

    return normalizedPath;
  }

  private buildHeaders(customHeaders?: Record<string, string>, hasBody?: boolean): Record<string, string> {
    const headers: Record<string, string> = { ...(customHeaders ?? {}) };
    const headerKeys = Object.keys(headers).map((key) => key.toLowerCase());
    const hasAuthorization = headerKeys.includes('authorization');
    const hasContentType = headerKeys.includes('content-type');

    if (!hasAuthorization) {
      const token = this.configService.get<string>('SERVICE_TOKEN') || process.env.SERVICE_TOKEN;
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    if (hasBody && !hasContentType) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  private handleAxiosError(error: unknown, serviceName: string, path: string): Error {
    const axiosError = error as AxiosError;

    if (axiosError?.code === 'ECONNABORTED') {
      return new RequestTimeoutException(`Timeout calling ${serviceName}${path}`);
    }

    if (axiosError?.response) {
      const status = axiosError.response.status;
      this.logger.warn('Service call failed', { serviceName, path, status });
      if (status >= 500) {
        return new BadGatewayException(`Service ${serviceName} responded with ${status}`);
      }
      return new HttpException(`Service ${serviceName} responded with ${status}`, status);
    }

    if (axiosError?.request) {
      this.logger.warn('Service call failed without response', { serviceName, path });
      return new BadGatewayException(`Service ${serviceName} is unavailable`);
    }

    this.logger.error('Unexpected error in ServiceHttpClient', {
      serviceName,
      path,
      error: axiosError?.message || error,
    });
    return new InternalServerErrorException('Unexpected error while calling service');
  }

  private validateServiceUrls(): void {
    Object.entries(SERVICE_URLS).forEach(([serviceName, config]) => {
      const configuredUrl =
        this.configService.get<string>(config.envKey) ||
        process.env[config.envKey] ||
        config.defaultUrl;

      if (!configuredUrl || !configuredUrl.trim()) {
        throw new InternalServerErrorException(
          `Missing base URL for service "${serviceName}" (${config.envKey})`,
        );
      }
    });
  }
}
