import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  RequestTimeoutException,
} from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosError, AxiosResponse, AxiosHeaders } from 'axios';
import { ServiceHttpClient } from './service-http-client.service';

describe('ServiceHttpClient', () => {
  let service: ServiceHttpClient;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  const mockAxiosResponse = <T>(data: T): AxiosResponse<T> => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {
      headers: new AxiosHeaders(),
    },
  });

  beforeEach(async () => {
    // Configurar variables de entorno para evitar errores de validación
    process.env.USUARIOS_SERVICE_URL = 'http://localhost:3000';
    process.env.CATALOG_SERVICE_URL = 'http://localhost:3001';
    process.env.ORDERS_SERVICE_URL = 'http://localhost:3002';
    process.env.WAREHOUSE_SERVICE_URL = 'http://localhost:3003';
    process.env.VENTAS_SERVICE_URL = 'http://localhost:3004';
    process.env.AUTH_SERVICE_URL = 'http://localhost:3005';
    process.env.SERVICE_TOKEN = 'test-service-token';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceHttpClient,
        {
          provide: HttpService,
          useValue: {
            request: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => process.env[key]),
          },
        },
      ],
    }).compile();

    service = module.get<ServiceHttpClient>(ServiceHttpClient);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('debe realizar petición GET exitosamente', async () => {
      const responseData = { id: 1, name: 'Test' };
      httpService.request.mockReturnValue(of(mockAxiosResponse(responseData)));

      const result = await service.get('usuarios-service', '/users/1');

      expect(result).toEqual(responseData);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: expect.stringContaining('/users/1'),
        }),
      );
    });

    it('debe usar URL directa si comienza con http', async () => {
      const responseData = { status: 'ok' };
      httpService.request.mockReturnValue(of(mockAxiosResponse(responseData)));

      const result = await service.get('http://custom-service:8080', '/health');

      expect(result).toEqual(responseData);
    });
  });

  describe('post', () => {
    it('debe realizar petición POST con body', async () => {
      const requestBody = { email: 'test@test.com', password: 'pass123' };
      const responseData = { id: 'new-user-id' };
      httpService.request.mockReturnValue(of(mockAxiosResponse(responseData)));

      const result = await service.post('usuarios-service', '/users', requestBody);

      expect(result).toEqual(responseData);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          data: requestBody,
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });
  });

  describe('patch', () => {
    it('debe realizar petición PATCH exitosamente', async () => {
      const updateData = { nombre: 'Updated Name' };
      const responseData = { id: '1', nombre: 'Updated Name' };
      httpService.request.mockReturnValue(of(mockAxiosResponse(responseData)));

      const result = await service.patch('usuarios-service', '/users/1', updateData);

      expect(result).toEqual(responseData);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PATCH',
        }),
      );
    });
  });

  describe('delete', () => {
    it('debe realizar petición DELETE exitosamente', async () => {
      const responseData = { deleted: true };
      httpService.request.mockReturnValue(of(mockAxiosResponse(responseData)));

      const result = await service.delete('usuarios-service', '/users/1');

      expect(result).toEqual(responseData);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
    });
  });

  describe('error handling', () => {
    it('debe lanzar RequestTimeoutException en timeout', async () => {
      const axiosError: Partial<AxiosError> = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      };
      httpService.request.mockReturnValue(throwError(() => axiosError));

      await expect(
        service.get('usuarios-service', '/slow-endpoint'),
      ).rejects.toThrow(RequestTimeoutException);
    });

    it('debe lanzar BadGatewayException para errores 5xx', async () => {
      const axiosError: Partial<AxiosError> = {
        response: {
          status: 502,
          statusText: 'Bad Gateway',
          data: {},
          headers: {},
          config: { headers: new AxiosHeaders() },
        },
        message: 'Request failed with status code 502',
      };
      httpService.request.mockReturnValue(throwError(() => axiosError));

      await expect(
        service.get('usuarios-service', '/broken-endpoint'),
      ).rejects.toThrow(BadGatewayException);
    });

    it('debe lanzar HttpException para errores 4xx', async () => {
      const axiosError: Partial<AxiosError> = {
        response: {
          status: 404,
          statusText: 'Not Found',
          data: {},
          headers: {},
          config: { headers: new AxiosHeaders() },
        },
        message: 'Request failed with status code 404',
      };
      httpService.request.mockReturnValue(throwError(() => axiosError));

      await expect(
        service.get('usuarios-service', '/not-found'),
      ).rejects.toThrow(HttpException);
    });

    it('debe lanzar BadGatewayException cuando el servicio no responde', async () => {
      const axiosError: Partial<AxiosError> = {
        request: {},
        message: 'Network Error',
      };
      httpService.request.mockReturnValue(throwError(() => axiosError));

      await expect(
        service.get('usuarios-service', '/unreachable'),
      ).rejects.toThrow(BadGatewayException);
    });

    it('debe lanzar InternalServerErrorException para errores inesperados', async () => {
      httpService.request.mockReturnValue(throwError(() => new Error('Unknown error')));

      await expect(
        service.get('usuarios-service', '/error'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('path normalization', () => {
    it('debe lanzar BadRequestException si path no empieza con /', async () => {
      await expect(
        service.get('usuarios-service', 'invalid-path'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('service resolution', () => {
    it('debe lanzar BadRequestException para servicio desconocido', async () => {
      await expect(
        service.get('unknown-service', '/test'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('headers', () => {
    it('debe incluir token de autorización automáticamente', async () => {
      httpService.request.mockReturnValue(of(mockAxiosResponse({ ok: true })));

      await service.get('usuarios-service', '/test');

      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-service-token',
          }),
        }),
      );
    });

    it('debe respetar headers personalizados de autorización', async () => {
      httpService.request.mockReturnValue(of(mockAxiosResponse({ ok: true })));

      await service.get('usuarios-service', '/test', {
        headers: { Authorization: 'Bearer custom-token' },
      });

      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer custom-token',
          }),
        }),
      );
    });

    it('debe usar timeout personalizado si se proporciona', async () => {
      httpService.request.mockReturnValue(of(mockAxiosResponse({ ok: true })));

      await service.get('usuarios-service', '/test', { timeout: 10000 });

      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 10000,
        }),
      );
    });
  });
});
