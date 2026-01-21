import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: jest.Mocked<JwtService>;

  // Helper para crear mock de ExecutionContext
  const createMockExecutionContext = (
    authHeader?: string,
  ): ExecutionContext => {
    const mockRequest = {
      headers: {
        authorization: authHeader,
      },
      user: null,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => ({}),
        getNext: () => jest.fn(),
      }),
      getClass: () => ({}),
      getHandler: () => ({}),
      getArgs: () => [],
      getArgByIndex: () => ({}),
      switchToRpc: () => ({}),
      switchToWs: () => ({}),
      getType: () => 'http',
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('debe permitir acceso con token JWT válido', async () => {
      const mockPayload = {
        sub: 'user-uuid-123',
        email: 'test@example.com',
        role: 'admin',
      };
      jwtService.verify.mockReturnValue(mockPayload);

      const context = createMockExecutionContext('Bearer valid.jwt.token');
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verify).toHaveBeenCalledWith('valid.jwt.token');

      // Verificar que el usuario fue inyectado en el request
      const request = context.switchToHttp().getRequest();
      expect(request.user).toEqual(mockPayload);
    });

    it('debe lanzar UnauthorizedException sin header de autorización', async () => {
      const context = createMockExecutionContext(undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'No token provided',
      );
    });

    it('debe lanzar UnauthorizedException con header malformado (sin espacio)', async () => {
      const context = createMockExecutionContext('BearerToken');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid authorization header format',
      );
    });

    it('debe lanzar UnauthorizedException con header malformado (demasiadas partes)', async () => {
      const context = createMockExecutionContext('Bearer token extra');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid authorization header format',
      );
    });

    it('debe lanzar UnauthorizedException con esquema diferente a Bearer', async () => {
      const context = createMockExecutionContext('Basic credentials');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid token scheme. Use: Bearer <token>',
      );
    });

    it('debe lanzar UnauthorizedException con token vacío', async () => {
      const context = createMockExecutionContext('Bearer ');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow('Empty token');
    });

    it('debe lanzar UnauthorizedException con token expirado', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      const context = createMockExecutionContext('Bearer expired.jwt.token');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        /Invalid or expired token/,
      );
    });

    it('debe lanzar UnauthorizedException con token inválido (firma incorrecta)', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      const context = createMockExecutionContext('Bearer invalid.jwt.token');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        /Invalid or expired token/,
      );
    });

    it('debe lanzar UnauthorizedException con token malformado', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      const context = createMockExecutionContext('Bearer not-a-jwt');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        /Invalid or expired token/,
      );
    });

    it('debe aceptar esquema Bearer en mayúsculas y minúsculas', async () => {
      const mockPayload = { sub: 'user-uuid-123' };
      jwtService.verify.mockReturnValue(mockPayload);

      // Lowercase
      const context1 = createMockExecutionContext('bearer valid.jwt.token');
      const result1 = await guard.canActivate(context1);
      expect(result1).toBe(true);

      // UPPERCASE
      const context2 = createMockExecutionContext('BEARER valid.jwt.token');
      const result2 = await guard.canActivate(context2);
      expect(result2).toBe(true);

      // Mixed case
      const context3 = createMockExecutionContext('BeArEr valid.jwt.token');
      const result3 = await guard.canActivate(context3);
      expect(result3).toBe(true);
    });

    it('debe incluir mensaje de error original en la excepción', async () => {
      const errorMessage = 'jwt must be provided';
      jwtService.verify.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      const context = createMockExecutionContext('Bearer some.token');

      try {
        await guard.canActivate(context);
        fail('Should have thrown an exception');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toContain(errorMessage);
      }
    });
  });
});
