import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateUsuarioDto } from './create-usuario.dto';
import { LoginDto } from './login.dto';
import { RefreshTokenDto } from './refresh-token.dto';

describe('Auth DTOs Validation', () => {
  describe('CreateUsuarioDto', () => {
    it('debe pasar validación con datos correctos', async () => {
      const dto = plainToInstance(CreateUsuarioDto, {
        email: 'valid@example.com',
        password: 'SecurePass123!',
        nombre: 'Valid Name',
        rolId: 1,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe fallar con email inválido', async () => {
      const dto = plainToInstance(CreateUsuarioDto, {
        email: 'invalid-email',
        password: 'SecurePass123!',
        nombre: 'Valid Name',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });

    it('debe fallar con password muy corto', async () => {
      const dto = plainToInstance(CreateUsuarioDto, {
        email: 'valid@example.com',
        password: 'Short1!',
        nombre: 'Valid Name',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('debe fallar con password sin mayúsculas', async () => {
      const dto = plainToInstance(CreateUsuarioDto, {
        email: 'valid@example.com',
        password: 'securepass123!',
        nombre: 'Valid Name',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('debe fallar con password sin minúsculas', async () => {
      const dto = plainToInstance(CreateUsuarioDto, {
        email: 'valid@example.com',
        password: 'SECUREPASS123!',
        nombre: 'Valid Name',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('debe fallar con password sin números', async () => {
      const dto = plainToInstance(CreateUsuarioDto, {
        email: 'valid@example.com',
        password: 'SecurePass!@#',
        nombre: 'Valid Name',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('debe fallar con password sin caracteres especiales', async () => {
      const dto = plainToInstance(CreateUsuarioDto, {
        email: 'valid@example.com',
        password: 'SecurePass123',
        nombre: 'Valid Name',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('debe fallar con password demasiado largo (>128 caracteres)', async () => {
      const longPassword = 'A'.repeat(100) + 'a1!' + 'x'.repeat(30);
      const dto = plainToInstance(CreateUsuarioDto, {
        email: 'valid@example.com',
        password: longPassword,
        nombre: 'Valid Name',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('debe fallar con nombre muy corto', async () => {
      const dto = plainToInstance(CreateUsuarioDto, {
        email: 'valid@example.com',
        password: 'SecurePass123!',
        nombre: 'X',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'nombre')).toBe(true);
    });

    it('debe fallar con nombre muy largo (>100 caracteres)', async () => {
      const dto = plainToInstance(CreateUsuarioDto, {
        email: 'valid@example.com',
        password: 'SecurePass123!',
        nombre: 'A'.repeat(101),
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'nombre')).toBe(true);
    });

    it('debe aceptar campos opcionales', async () => {
      const dto = plainToInstance(CreateUsuarioDto, {
        email: 'valid@example.com',
        password: 'SecurePass123!',
        nombre: 'Valid Name',
        telefono: '+593999999999',
        rolId: 2,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe aceptar password con todos los caracteres especiales permitidos', async () => {
      const passwords = [
        'Password1@',
        'Password1$',
        'Password1!',
        'Password1%',
        'Password1*',
        'Password1?',
        'Password1&',
      ];

      for (const password of passwords) {
        const dto = plainToInstance(CreateUsuarioDto, {
          email: 'valid@example.com',
          password,
          nombre: 'Valid Name',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });
  });

  describe('LoginDto', () => {
    it('debe pasar validación con datos correctos', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'user@example.com',
        password: 'anypassword',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe fallar con email inválido', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'not-an-email',
        password: 'password',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });

    it('debe fallar sin password', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'user@example.com',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('debe fallar sin email', async () => {
      const dto = plainToInstance(LoginDto, {
        password: 'password',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });
  });

  describe('RefreshTokenDto', () => {
    it('debe pasar validación con refresh_token', async () => {
      const dto = plainToInstance(RefreshTokenDto, {
        refresh_token: 'valid.refresh.token',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe pasar validación con refresh_token y device_id', async () => {
      const dto = plainToInstance(RefreshTokenDto, {
        refresh_token: 'valid.refresh.token',
        device_id: 'device-123',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe fallar sin refresh_token', async () => {
      const dto = plainToInstance(RefreshTokenDto, {
        device_id: 'device-123',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'refresh_token')).toBe(true);
    });

    it('debe aceptar device_id como opcional', async () => {
      const dto = plainToInstance(RefreshTokenDto, {
        refresh_token: 'valid.token',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
