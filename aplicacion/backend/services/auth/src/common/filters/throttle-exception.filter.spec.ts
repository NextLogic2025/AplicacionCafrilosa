import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { ThrottlerExceptionFilter } from './throttle-exception.filter';

describe('ThrottlerExceptionFilter', () => {
  let filter: ThrottlerExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new ThrottlerExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      ip: '192.168.1.100',
      socket: { remoteAddress: '192.168.1.100' },
      path: '/auth/login',
      method: 'POST',
      get: jest.fn().mockReturnValue('Mozilla/5.0 Test Browser'),
    };

    mockArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
        getNext: () => jest.fn(),
      }),
      getArgs: () => [],
      getArgByIndex: () => ({}),
      switchToRpc: () => ({} as any),
      switchToWs: () => ({} as any),
      getType: () => 'http',
    } as unknown as ArgumentsHost;
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('catch', () => {
    it('debe retornar respuesta 429 Too Many Requests', () => {
      const exception = new ThrottlerException();

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          retryAfter: 60,
        }),
      );
    });

    it('debe incluir mensaje en español con tiempo de espera', () => {
      const exception = new ThrottlerException();

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('60 segundos'),
        }),
      );
    });

    it('debe incluir timestamp en la respuesta', () => {
      const exception = new ThrottlerException();

      filter.catch(exception, mockArgumentsHost);

      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(jsonCall).toHaveProperty('timestamp');
      expect(new Date(jsonCall.timestamp).getTime()).not.toBeNaN();
    });

    it('debe manejar request sin IP', () => {
      mockRequest.ip = undefined;
      mockRequest.socket = undefined;
      const exception = new ThrottlerException();

      // No debe lanzar error
      expect(() => filter.catch(exception, mockArgumentsHost)).not.toThrow();
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    });

    it('debe manejar request sin User-Agent', () => {
      mockRequest.get = jest.fn().mockReturnValue(undefined);
      const exception = new ThrottlerException();

      expect(() => filter.catch(exception, mockArgumentsHost)).not.toThrow();
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    });

    it('debe obtener IP del socket si ip no está definido', () => {
      mockRequest.ip = undefined;
      mockRequest.socket = { remoteAddress: '10.0.0.1' };
      const exception = new ThrottlerException();

      // El filtro debe procesar correctamente
      expect(() => filter.catch(exception, mockArgumentsHost)).not.toThrow();
    });
  });
});
