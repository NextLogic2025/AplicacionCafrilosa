import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    // Establecer variable de entorno para el test
    process.env.JWT_SECRET = 'test-secret-key-minimum-32-chars!!';

    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('debe extraer información del payload correctamente', async () => {
      const mockPayload = {
        sub: 'user-uuid-123',
        email: 'test@example.com',
        role: 'admin',
        role_level: 1,
        rolId: 1,
        iat: 1234567890,
        exp: 1234567890,
      };

      const result = await strategy.validate(mockPayload);

      expect(result).toEqual({
        userId: mockPayload.sub,
        email: mockPayload.email,
        role: mockPayload.role,
        role_level: mockPayload.role_level,
        rolId: mockPayload.rolId,
      });
    });

    it('debe manejar payload con campos opcionales undefined', async () => {
      const minimalPayload = {
        sub: 'user-uuid-123',
      };

      const result = await strategy.validate(minimalPayload);

      expect(result).toEqual({
        userId: 'user-uuid-123',
        email: undefined,
        role: undefined,
        role_level: undefined,
        rolId: undefined,
      });
    });

    it('debe preservar múltiples roles si se proporcionan como array', async () => {
      const payloadWithMultipleRoles = {
        sub: 'user-uuid-123',
        email: 'test@example.com',
        role: ['admin', 'editor', 'viewer'],
      };

      const result = await strategy.validate(payloadWithMultipleRoles);

      expect(result.role).toEqual(['admin', 'editor', 'viewer']);
    });

    it('debe mapear sub a userId correctamente', async () => {
      const payload = {
        sub: 'specific-user-id-12345',
        email: 'user@test.com',
      };

      const result = await strategy.validate(payload);

      expect(result.userId).toBe('specific-user-id-12345');
    });
  });
});
