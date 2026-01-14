import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { Role } from './entities/role.entity';
import { Usuario } from './entities/usuario.entity';
import { ConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Usuario, Role],
      autoLoadEntities: true,
      synchronize: false,
      retryAttempts: 5,
      retryDelay: 3000,
      logging: true,
    }),
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}