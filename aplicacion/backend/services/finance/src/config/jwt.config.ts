import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'dev_jwt_secret',
  signOptions: { expiresIn: '1h' },
}));
