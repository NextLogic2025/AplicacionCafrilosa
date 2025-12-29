// placeholder (NestJS root module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { Usuario } from './entities/usuario.entity';
import { Role } from './entities/role.entity';
import { AuthToken } from './entities/auth-token.entity';
import { Dispositivo } from './entities/dispositivo.entity';
import { AuthAuditoria } from './entities/auth-auditoria.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost', // Docker: 'database' | Local: 'localhost'
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'admin',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'usuarios_db',
      entities: [Usuario, Role, AuthToken, Dispositivo, AuthAuditoria],
      synchronize: false, // FALSE porque usas el script SQL
    }),
    AuthModule, // Cargamos el módulo de autenticación
  ],
})
export class AppModule {}