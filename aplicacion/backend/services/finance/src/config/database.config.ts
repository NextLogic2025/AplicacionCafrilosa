import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL || 'postgres://admin:root@database:5432/finance_db',
  synchronize: false,
  autoLoadEntities: true,
}));
