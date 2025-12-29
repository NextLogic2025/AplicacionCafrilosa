// placeholder (Auth module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt.guard';
import { Usuario } from '../entities/usuario.entity';
import { Role } from '../entities/role.entity';
import { AuthToken } from '../entities/auth-token.entity';
import { Dispositivo } from '../entities/dispositivo.entity';
import { AuthAuditoria } from '../entities/auth-auditoria.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Role, AuthToken, Dispositivo, AuthAuditoria]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-me',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule {}