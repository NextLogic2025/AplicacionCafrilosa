import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { Usuario } from '../entities/usuario.entity';
import { Role } from '../entities/role.entity';
import { AuthRefreshToken } from '../entities/auth-token.entity';
import { Dispositivo } from '../entities/dispositivo.entity';
import { AuthAuditoria } from '../entities/auth-auditoria.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { LoginDto } from './dto/login.dto';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usuarioRepo: jest.Mocked<Repository<Usuario>>;
  let roleRepo: jest.Mocked<Repository<Role>>;
  let tokenRepo: jest.Mocked<Repository<AuthRefreshToken>>;
  let dispositivoRepo: jest.Mocked<Repository<Dispositivo>>;
  let auditoriaRepo: jest.Mocked<Repository<AuthAuditoria>>;
  let jwtService: jest.Mocked<JwtService>;

  // Mock data
  const mockRole: Role = {
    id: 1,
    nombre: 'admin',
    usuarios: [],
  };

  const mockUsuario: Usuario = {
    id: 'user-uuid-123',
    email: 'test@example.com',
    passwordHash: '$2b$10$hashedPassword',
    nombre: 'Test User',
    telefono: '123456789',
    avatarUrl: null,
    emailVerificado: false,
    activo: true,
    lastLogin: null,
    rol: mockRole,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRefreshToken: AuthRefreshToken = {
    id: 'token-uuid-123',
    usuario: mockUsuario,
    dispositivo: null,
    token_hash: '$2b$10$hashedRefreshToken',
    fechaExpiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    revocado: false,
    revocadoRazon: null,
    ipCreacion: '127.0.0.1',
    userAgent: 'Jest Test',
    replacedByToken: null,
    createdAt: new Date(),
  };

  // Factory para crear mocks de repositorios
  const createMockRepository = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  });

  beforeEach(async () => {
    // Reset environment variables
    process.env.ACCESS_TOKEN_TTL = '12h';
    process.env.REFRESH_TOKEN_TTL = '7d';
    process.env.SINGLE_SESSION = 'false';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Usuario),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Role),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(AuthRefreshToken),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Dispositivo),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(AuthAuditoria),
          useValue: createMockRepository(),
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock.jwt.token'),
            decode: jest.fn().mockReturnValue({ sub: 'user-uuid-123' }),
            verify: jest.fn().mockReturnValue({ sub: 'user-uuid-123' }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usuarioRepo = module.get(getRepositoryToken(Usuario));
    roleRepo = module.get(getRepositoryToken(Role));
    tokenRepo = module.get(getRepositoryToken(AuthRefreshToken));
    dispositivoRepo = module.get(getRepositoryToken(Dispositivo));
    auditoriaRepo = module.get(getRepositoryToken(AuthAuditoria));
    jwtService = module.get(JwtService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('registro', () => {
    const createUsuarioDto: CreateUsuarioDto = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      nombre: 'New User',
      rolId: 1,
    };

    it('debe crear un usuario exitosamente', async () => {
      usuarioRepo.findOne.mockResolvedValue(null); // Email no existe
      roleRepo.findOne.mockResolvedValue(mockRole);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedPassword');
      usuarioRepo.create.mockReturnValue({ ...mockUsuario, id: 'new-uuid' } as Usuario);
      usuarioRepo.save.mockResolvedValue({ ...mockUsuario, id: 'new-uuid' } as Usuario);

      const result = await service.registro(createUsuarioDto);

      expect(result).toHaveProperty('mensaje', 'Usuario registrado');
      expect(result).toHaveProperty('id');
      expect(usuarioRepo.findOne).toHaveBeenCalledWith({
        where: { email: createUsuarioDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUsuarioDto.password, 10);
      expect(usuarioRepo.save).toHaveBeenCalled();
    });

    it('debe lanzar ConflictException si el email ya existe', async () => {
      usuarioRepo.findOne.mockResolvedValue(mockUsuario); // Email ya existe

      await expect(service.registro(createUsuarioDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.registro(createUsuarioDto)).rejects.toThrow(
        'Email ya registrado',
      );
    });

    it('debe lanzar BadRequestException si el rol no existe', async () => {
      usuarioRepo.findOne.mockResolvedValue(null);
      roleRepo.findOne.mockResolvedValue(null); // Rol no existe

      await expect(service.registro(createUsuarioDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.registro(createUsuarioDto)).rejects.toThrow(
        'Rol no válido',
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'SecurePass123!',
    };

    it('debe autenticar usuario y retornar tokens', async () => {
      usuarioRepo.findOne.mockResolvedValue(mockUsuario);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedRefreshToken');
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      tokenRepo.save.mockResolvedValue(mockRefreshToken);
      tokenRepo.find.mockResolvedValue([mockRefreshToken]);
      auditoriaRepo.save.mockResolvedValue({} as AuthAuditoria);
      usuarioRepo.save.mockResolvedValue(mockUsuario);

      const result = await service.login(loginDto, '127.0.0.1', 'Test Agent');

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('usuario');
      expect(result.usuario.email).toBe(mockUsuario.email);
      expect(result.usuario).not.toHaveProperty('passwordHash');
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('debe lanzar UnauthorizedException con credenciales inválidas (password incorrecto)', async () => {
      usuarioRepo.findOne.mockResolvedValue(mockUsuario);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Password incorrecto
      auditoriaRepo.save.mockResolvedValue({} as AuthAuditoria);

      await expect(
        service.login(loginDto, '127.0.0.1', 'Test Agent'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.login(loginDto, '127.0.0.1', 'Test Agent'),
      ).rejects.toThrow('Credenciales inválidas');
    });

    it('debe prevenir enumeración de usuarios (timing attack prevention)', async () => {
      // Usuario no existe - debe usar dummy hash
      usuarioRepo.findOne.mockResolvedValue(null);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      auditoriaRepo.save.mockResolvedValue({} as AuthAuditoria);

      await expect(
        service.login(loginDto, '127.0.0.1', 'Test Agent'),
      ).rejects.toThrow('Credenciales inválidas');

      // Verificar que bcrypt.compare fue llamado (timing constante)
      expect(bcrypt.compare).toHaveBeenCalled();
    });

    it('debe lanzar UnauthorizedException si el usuario está desactivado', async () => {
      const usuarioInactivo = { ...mockUsuario, activo: false };
      usuarioRepo.findOne.mockResolvedValue(usuarioInactivo);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login(loginDto, '127.0.0.1', 'Test Agent'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.login(loginDto, '127.0.0.1', 'Test Agent'),
      ).rejects.toThrow('Usuario desactivado');
    });

    it('debe revocar tokens existentes si SINGLE_SESSION está habilitado', async () => {
      process.env.SINGLE_SESSION = 'true';
      
      usuarioRepo.findOne.mockResolvedValue(mockUsuario);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedRefreshToken');
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      tokenRepo.save.mockResolvedValue(mockRefreshToken);
      tokenRepo.find.mockResolvedValue([mockRefreshToken]);
      auditoriaRepo.save.mockResolvedValue({} as AuthAuditoria);
      usuarioRepo.save.mockResolvedValue(mockUsuario);

      await service.login(loginDto, '127.0.0.1', 'Test Agent');

      // Verificar que se llama a revocar tokens existentes
      expect(tokenRepo.createQueryBuilder).toHaveBeenCalled();
    });

    it('debe registrar evento LOGIN en auditoría', async () => {
      usuarioRepo.findOne.mockResolvedValue(mockUsuario);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedRefreshToken');
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      tokenRepo.save.mockResolvedValue(mockRefreshToken);
      tokenRepo.find.mockResolvedValue([mockRefreshToken]);
      auditoriaRepo.save.mockResolvedValue({} as AuthAuditoria);
      usuarioRepo.save.mockResolvedValue(mockUsuario);

      await service.login(loginDto, '127.0.0.1', 'Test Agent');

      expect(auditoriaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario_id: mockUsuario.id,
          evento: 'LOGIN',
        }),
      );
    });
  });

  describe('logout', () => {
    it('debe revocar refresh token específico correctamente', async () => {
      const refreshToken = 'valid.refresh.token';
      tokenRepo.find.mockResolvedValue([mockRefreshToken]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      tokenRepo.save.mockResolvedValue({
        ...mockRefreshToken,
        revocado: true,
        revocadoRazon: 'logout',
      });
      auditoriaRepo.save.mockResolvedValue({} as AuthAuditoria);

      const result = await service.logout(
        mockUsuario.id,
        refreshToken,
        '127.0.0.1',
        'Test Agent',
      );

      expect(result.mensaje).toBe('Logout exitoso');
      expect(result.tokensRevoked).toBe(1);
    });

    it('debe revocar TODOS los tokens si logoutAll es true', async () => {
      auditoriaRepo.save.mockResolvedValue({} as AuthAuditoria);

      const result = await service.logout(
        mockUsuario.id,
        undefined,
        '127.0.0.1',
        'Test Agent',
        true, // logoutAll
      );

      expect(result.mensaje).toBe('Logout de todos los dispositivos exitoso');
      expect(tokenRepo.createQueryBuilder).toHaveBeenCalled();
    });

    it('debe registrar evento LOGOUT en auditoría', async () => {
      tokenRepo.find.mockResolvedValue([mockRefreshToken]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      tokenRepo.save.mockResolvedValue({
        ...mockRefreshToken,
        revocado: true,
      });
      auditoriaRepo.save.mockResolvedValue({} as AuthAuditoria);

      await service.logout(
        mockUsuario.id,
        'valid.token',
        '127.0.0.1',
        'Test Agent',
      );

      expect(auditoriaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario_id: mockUsuario.id,
          evento: 'LOGOUT',
        }),
      );
    });
  });

  describe('refreshTokens', () => {
    const validRefreshToken = 'valid.refresh.token';

    // Factory para crear token fresco en cada test
    const createActiveRefreshToken = (): AuthRefreshToken => ({
      id: 'token-uuid-123',
      usuario: mockUsuario,
      dispositivo: null,
      token_hash: '$2b$10$hashedRefreshToken',
      fechaExpiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      revocado: false,
      revocadoRazon: null,
      ipCreacion: '127.0.0.1',
      userAgent: 'Jest Test',
      replacedByToken: null,
      createdAt: new Date(),
    });

    it('debe renovar tokens exitosamente', async () => {
      const activeToken = createActiveRefreshToken();
      jwtService.decode.mockReturnValue({ sub: mockUsuario.id });
      tokenRepo.find.mockResolvedValue([activeToken]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$newHashedToken');
      tokenRepo.save.mockResolvedValue(activeToken);
      usuarioRepo.findOne.mockResolvedValue(mockUsuario);
      auditoriaRepo.save.mockResolvedValue({} as AuthAuditoria);

      const result = await service.refreshTokens(
        validRefreshToken,
        undefined,
        '127.0.0.1',
        'Test Agent',
      );

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });

    it('debe lanzar UnauthorizedException con token inválido', async () => {
      const activeToken = createActiveRefreshToken();
      jwtService.decode.mockReturnValue({ sub: mockUsuario.id });
      tokenRepo.find.mockResolvedValue([activeToken]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Token no coincide

      await expect(
        service.refreshTokens(validRefreshToken, undefined, '127.0.0.1', 'Test Agent'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException si el token no es decodificable', async () => {
      jwtService.decode.mockReturnValue(null);

      await expect(
        service.refreshTokens('invalid.token', undefined, '127.0.0.1', 'Test Agent'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refreshTokens('invalid.token', undefined, '127.0.0.1', 'Test Agent'),
      ).rejects.toThrow('Token ilegible');
    });

    it('debe detectar reutilización de token y revocar todas las sesiones', async () => {
      const revokedToken: AuthRefreshToken = {
        ...createActiveRefreshToken(),
        revocado: true, // Token ya revocado
      };

      jwtService.decode.mockReturnValue({ sub: mockUsuario.id });
      tokenRepo.find.mockResolvedValue([revokedToken]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // Token coincide pero está revocado
      auditoriaRepo.save.mockResolvedValue({} as AuthAuditoria);

      await expect(
        service.refreshTokens(validRefreshToken, undefined, '127.0.0.1', 'Test Agent'),
      ).rejects.toThrow('Sesión inválida');

      // Verificar que se registró el evento de seguridad
      expect(tokenRepo.createQueryBuilder).toHaveBeenCalled();
    });

    it('debe lanzar UnauthorizedException si el token está expirado', async () => {
      const expiredToken: AuthRefreshToken = {
        ...createActiveRefreshToken(),
        fechaExpiracion: new Date(Date.now() - 1000), // Expirado hace 1 segundo
        revocado: false, // No revocado, pero expirado
      };

      jwtService.decode.mockReturnValue({ sub: mockUsuario.id });
      tokenRepo.find.mockResolvedValue([expiredToken]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.refreshTokens(validRefreshToken, undefined, '127.0.0.1', 'Test Agent'),
      ).rejects.toThrow('Refresh token expirado');
    });

    it('debe rotar el token antiguo y crear uno nuevo', async () => {
      const activeToken = createActiveRefreshToken();
      jwtService.decode.mockReturnValue({ sub: mockUsuario.id });
      tokenRepo.find.mockResolvedValue([activeToken]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$newHashedToken');
      tokenRepo.save.mockResolvedValue(activeToken);
      usuarioRepo.findOne.mockResolvedValue(mockUsuario);
      auditoriaRepo.save.mockResolvedValue({} as AuthAuditoria);

      await service.refreshTokens(
        validRefreshToken,
        undefined,
        '127.0.0.1',
        'Test Agent',
      );

      // Verificar que se guardó el token con revocado=true y razón 'rotated'
      expect(tokenRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          revocado: true,
          revocadoRazon: 'rotated',
        }),
      );
    });

    it('debe detectar token con replacedByToken como reutilización', async () => {
      const replacedToken: AuthRefreshToken = {
        ...createActiveRefreshToken(),
        revocado: false,
        replacedByToken: 'some-other-token-id', // Ya fue reemplazado
      };

      jwtService.decode.mockReturnValue({ sub: mockUsuario.id });
      tokenRepo.find.mockResolvedValue([replacedToken]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      auditoriaRepo.save.mockResolvedValue({} as AuthAuditoria);

      await expect(
        service.refreshTokens(validRefreshToken, undefined, '127.0.0.1', 'Test Agent'),
      ).rejects.toThrow('Sesión inválida');
    });
  });

  describe('registrarDispositivo', () => {
    const deviceId = 'device-123-abc';

    it('debe actualizar dispositivo existente', async () => {
      const existingDispositivo = {
        id: 'disp-uuid',
        device_id: deviceId,
        ultimoAcceso: new Date(),
      } as Dispositivo;

      dispositivoRepo.findOne.mockResolvedValue(existingDispositivo);
      dispositivoRepo.save.mockResolvedValue(existingDispositivo);
      auditoriaRepo.save.mockResolvedValue({} as AuthAuditoria);

      const result = await service.registrarDispositivo(
        mockUsuario.id,
        deviceId,
        '127.0.0.1',
      );

      expect(result).toBeDefined();
      expect(auditoriaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          evento: 'DISPOSITIVO_ACTUALIZADO',
        }),
      );
    });

    it('debe crear nuevo dispositivo si no existe', async () => {
      dispositivoRepo.findOne.mockResolvedValue(null);
      const newDispositivo = {
        id: 'new-disp-uuid',
        device_id: deviceId,
      } as Dispositivo;
      dispositivoRepo.create.mockReturnValue(newDispositivo);
      dispositivoRepo.save.mockResolvedValue(newDispositivo);
      auditoriaRepo.save.mockResolvedValue({} as AuthAuditoria);

      const result = await service.registrarDispositivo(
        mockUsuario.id,
        deviceId,
        '127.0.0.1',
      );

      expect(result).toBeDefined();
      expect(dispositivoRepo.create).toHaveBeenCalled();
      expect(auditoriaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          evento: 'DISPOSITIVO_REGISTRADO',
        }),
      );
    });
  });

  describe('obtenerUsuariosPorIds', () => {
    it('debe retornar array vacío si no se proporcionan IDs', async () => {
      const result = await service.obtenerUsuariosPorIds([]);
      expect(result).toEqual([]);
    });

    it('debe retornar usuarios con estructura simplificada', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUsuario]),
      };
      usuarioRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.obtenerUsuariosPorIds([mockUsuario.id]);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', mockUsuario.id);
      expect(result[0]).toHaveProperty('email', mockUsuario.email);
      expect(result[0]).not.toHaveProperty('passwordHash');
    });
  });

  describe('parseDuration (private method via login)', () => {
    it('debe parsear duración en minutos correctamente', async () => {
      process.env.ACCESS_TOKEN_TTL = '30m';

      usuarioRepo.findOne.mockResolvedValue(mockUsuario);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hash');
      tokenRepo.save.mockResolvedValue(mockRefreshToken);
      tokenRepo.find.mockResolvedValue([]);
      auditoriaRepo.save.mockResolvedValue({} as AuthAuditoria);
      usuarioRepo.save.mockResolvedValue(mockUsuario);

      await service.login(
        { email: 'test@example.com', password: 'SecurePass123!' },
        '127.0.0.1',
      );

      // Verificar que jwtService.sign fue llamado con el tiempo correcto (30*60 = 1800 segundos)
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ expiresIn: 1800 }),
      );
    });

    it('debe parsear duración en horas correctamente', async () => {
      process.env.ACCESS_TOKEN_TTL = '2h';

      usuarioRepo.findOne.mockResolvedValue(mockUsuario);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hash');
      tokenRepo.save.mockResolvedValue(mockRefreshToken);
      tokenRepo.find.mockResolvedValue([]);
      auditoriaRepo.save.mockResolvedValue({} as AuthAuditoria);
      usuarioRepo.save.mockResolvedValue(mockUsuario);

      await service.login(
        { email: 'test@example.com', password: 'SecurePass123!' },
        '127.0.0.1',
      );

      // 2h = 2*3600 = 7200 segundos
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ expiresIn: 7200 }),
      );
    });

    it('debe parsear duración en días correctamente', async () => {
      process.env.ACCESS_TOKEN_TTL = '1d';

      usuarioRepo.findOne.mockResolvedValue(mockUsuario);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hash');
      tokenRepo.save.mockResolvedValue(mockRefreshToken);
      tokenRepo.find.mockResolvedValue([]);
      auditoriaRepo.save.mockResolvedValue({} as AuthAuditoria);
      usuarioRepo.save.mockResolvedValue(mockUsuario);

      await service.login(
        { email: 'test@example.com', password: 'SecurePass123!' },
        '127.0.0.1',
      );

      // 1d = 1*86400 = 86400 segundos
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ expiresIn: 86400 }),
      );
    });
  });
});
