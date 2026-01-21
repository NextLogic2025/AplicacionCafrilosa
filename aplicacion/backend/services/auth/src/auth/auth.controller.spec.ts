import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt.guard';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  // Mock request object
  const mockRequest = {
    ip: '127.0.0.1',
    get: jest.fn().mockReturnValue('Jest Test Agent'),
    user: {
      sub: 'user-uuid-123',
      email: 'test@example.com',
      role: 'admin',
    },
  };

  // Mock responses
  const mockLoginResponse = {
    access_token: 'mock.access.token',
    refresh_token: 'mock.refresh.token',
    usuario: {
      id: 'user-uuid-123',
      email: 'test@example.com',
      nombre: 'Test User',
      role: 'admin',
    },
  };

  const mockRegistroResponse = {
    mensaje: 'Usuario registrado',
    id: 'new-user-uuid',
  };

  const mockRefreshResponse = {
    access_token: 'new.access.token',
    refresh_token: 'new.refresh.token',
  };

  const mockLogoutResponse = {
    mensaje: 'Logout exitoso',
    tokensRevoked: 1,
  };

  beforeEach(async () => {
    const mockAuthService = {
      registro: jest.fn(),
      login: jest.fn(),
      refreshTokens: jest.fn(),
      logout: jest.fn(),
      registrarDispositivo: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          { name: 'default', ttl: 60000, limit: 100 },
        ]),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock.jwt.token'),
            verify: jest.fn().mockReturnValue({ sub: 'user-uuid-123' }),
          },
        },
        JwtAuthGuard,
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('registrar', () => {
    const createUsuarioDto: CreateUsuarioDto = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      nombre: 'New User',
      rolId: 1,
    };

    it('debe registrar usuario exitosamente', async () => {
      authService.registro.mockResolvedValue(mockRegistroResponse);

      const result = await controller.registrar(createUsuarioDto);

      expect(result).toEqual(mockRegistroResponse);
      expect(authService.registro).toHaveBeenCalledWith(createUsuarioDto);
    });

    it('debe propagar ConflictException si email ya existe', async () => {
      authService.registro.mockRejectedValue(
        new ConflictException('Email ya registrado'),
      );

      await expect(controller.registrar(createUsuarioDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'SecurePass123!',
    };

    it('debe retornar tokens con credenciales válidas', async () => {
      authService.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(loginDto, mockRequest as any);

      expect(result).toEqual(mockLoginResponse);
      expect(authService.login).toHaveBeenCalledWith(
        loginDto,
        mockRequest.ip,
        'Jest Test Agent',
      );
    });

    it('debe obtener IP y User-Agent del request', async () => {
      authService.login.mockResolvedValue(mockLoginResponse);

      await controller.login(loginDto, mockRequest as any);

      expect(mockRequest.get).toHaveBeenCalledWith('user-agent');
      expect(authService.login).toHaveBeenCalledWith(
        loginDto,
        '127.0.0.1',
        'Jest Test Agent',
      );
    });

    it('debe propagar UnauthorizedException con credenciales inválidas', async () => {
      authService.login.mockRejectedValue(
        new UnauthorizedException('Credenciales inválidas'),
      );

      await expect(
        controller.login(loginDto, mockRequest as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refresh_token: 'valid.refresh.token',
      device_id: 'device-123',
    };

    it('debe renovar tokens exitosamente', async () => {
      authService.refreshTokens.mockResolvedValue(mockRefreshResponse);

      const result = await controller.refresh(refreshTokenDto, mockRequest as any);

      expect(result).toEqual(mockRefreshResponse);
      expect(authService.refreshTokens).toHaveBeenCalledWith(
        refreshTokenDto.refresh_token,
        refreshTokenDto.device_id,
        mockRequest.ip,
        'Jest Test Agent',
      );
    });

    it('debe propagar UnauthorizedException con token inválido', async () => {
      authService.refreshTokens.mockRejectedValue(
        new UnauthorizedException('Refresh token inválido'),
      );

      await expect(
        controller.refresh(refreshTokenDto, mockRequest as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('debe realizar logout con refresh token específico', async () => {
      authService.logout.mockResolvedValue(mockLogoutResponse);

      const body = { refresh_token: 'mock.refresh.token' };
      const result = await controller.logout(mockRequest as any, body);

      expect(result).toEqual(mockLogoutResponse);
      expect(authService.logout).toHaveBeenCalledWith(
        mockRequest.user.sub,
        body.refresh_token,
        mockRequest.ip,
        'Jest Test Agent',
      );
    });

    it('debe realizar logout sin refresh token (revoca sesión actual)', async () => {
      authService.logout.mockResolvedValue({
        mensaje: 'Logout exitoso',
        tokensRevoked: 0,
      });

      const result = await controller.logout(mockRequest as any, undefined);

      expect(result).toBeDefined();
      expect(authService.logout).toHaveBeenCalledWith(
        mockRequest.user.sub,
        undefined,
        mockRequest.ip,
        'Jest Test Agent',
      );
    });
  });

  describe('logoutAll', () => {
    it('debe cerrar todas las sesiones del usuario', async () => {
      const logoutAllResponse = {
        mensaje: 'Logout de todos los dispositivos exitoso',
        tokensRevoked: 5,
      };
      authService.logout.mockResolvedValue(logoutAllResponse);

      const result = await controller.logoutAll(mockRequest as any);

      expect(result).toEqual(logoutAllResponse);
      expect(authService.logout).toHaveBeenCalledWith(
        mockRequest.user.sub,
        undefined,
        mockRequest.ip,
        'Jest Test Agent',
        true, // logoutAll = true
      );
    });
  });

  describe('validateToken', () => {
    it('debe retornar información del usuario autenticado', async () => {
      const result = await controller.validateToken(mockRequest as any);

      expect(result).toEqual({
        valid: true,
        userId: mockRequest.user.sub,
        email: mockRequest.user.email,
        role: mockRequest.user.role,
      });
    });

    it('debe manejar usuario sin email', async () => {
      const requestSinEmail = {
        ...mockRequest,
        user: { sub: 'user-uuid', role: 'user' },
      };

      const result = await controller.validateToken(requestSinEmail as any);

      expect(result.valid).toBe(true);
      expect(result.userId).toBe('user-uuid');
      expect(result.email).toBeUndefined();
    });
  });

  describe('registrarDispositivo', () => {
    const deviceBody = { device_id: 'device-abc-123' };

    it('debe registrar dispositivo exitosamente', async () => {
      const mockDispositivo = {
        id: 'disp-uuid',
        device_id: deviceBody.device_id,
        ultimoAcceso: new Date(),
      };
      authService.registrarDispositivo.mockResolvedValue(mockDispositivo as any);

      const result = await controller.registrarDispositivo(
        deviceBody,
        mockRequest as any,
      );

      expect(result).toEqual(mockDispositivo);
      expect(authService.registrarDispositivo).toHaveBeenCalledWith(
        mockRequest.user.sub,
        deviceBody.device_id,
        mockRequest.ip,
      );
    });
  });
});
