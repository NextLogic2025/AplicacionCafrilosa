import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { AuthAuditoria } from './entities/auth-auditoria.entity';
import { AuthRefreshToken } from './entities/auth-token.entity';
import { Dispositivo } from './entities/dispositivo.entity';
import { Role } from './entities/role.entity';
import { Usuario } from './entities/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      
      // 1. CONEXIÓN HÍBRIDA
      // En Local: usa 'localhost'
      // En Cloud Run: usa '/cloudsql/tu-proyecto:region:instancia' (Inyectado por Terraform)
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'admin',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'usuarios_db',
      
      entities: [Usuario, Role, AuthRefreshToken, Dispositivo, AuthAuditoria],
      
      // 2. SEGURIDAD
      // En false porque usas scripts SQL manuales (Evita que TypeORM borre datos)
      synchronize: false, 

      // 3. ROBUSTEZ (Lo que te faltaba)
      // Si Cloud Run arranca antes que la BD, esto evita que el servicio muera inmediatamente.
      retryAttempts: 5,      // Intentará conectarse 5 veces
      retryDelay: 3000,      // Esperará 3 segundos entre intentos
      
      // Muestra logs de error en la consola de Google si falla la conexión
      logging: true,         
    }),
    AuthModule,
  ],
})
export class AppModule {}