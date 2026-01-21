import 'reflect-metadata';

import { ValidationPipe, Logger, ClassSerializerInterceptor } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';

import { AppModule } from './app.module';

/**
 * Valida que los secrets de seguridad estén correctamente configurados
 * CRÍTICO: En producción, la aplicación NO debe arrancar sin secrets seguros
 */
function validateSecuritySecrets(): void {
  const logger = new Logger('SecurityValidation');
  const isProduction = process.env.NODE_ENV === 'production';
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  const minSecretLength = 32;

  // Validar JWT_SECRET
  if (!jwtSecret) {
    const errorMsg = 'JWT_SECRET no está configurado. Genere uno con: openssl rand -base64 32';
    if (isProduction) {
      logger.error(`🔒 CRÍTICO: ${errorMsg}`);
      throw new Error(errorMsg);
    }
    logger.warn(`⚠️ ADVERTENCIA: ${errorMsg}`);
  } else if (jwtSecret.length < minSecretLength) {
    const errorMsg = `JWT_SECRET debe tener mínimo ${minSecretLength} caracteres (actual: ${jwtSecret.length})`;
    if (isProduction) {
      logger.error(`🔒 CRÍTICO: ${errorMsg}`);
      throw new Error(errorMsg);
    }
    logger.warn(`⚠️ ADVERTENCIA: ${errorMsg}`);
  }

  // Validar JWT_REFRESH_SECRET
  if (!jwtRefreshSecret) {
    const errorMsg = 'JWT_REFRESH_SECRET no está configurado. Genere uno con: openssl rand -base64 32';
    if (isProduction) {
      logger.error(`🔒 CRÍTICO: ${errorMsg}`);
      throw new Error(errorMsg);
    }
    logger.warn(`⚠️ ADVERTENCIA: ${errorMsg}`);
  } else if (jwtRefreshSecret.length < minSecretLength) {
    const errorMsg = `JWT_REFRESH_SECRET debe tener mínimo ${minSecretLength} caracteres (actual: ${jwtRefreshSecret.length})`;
    if (isProduction) {
      logger.error(`🔒 CRÍTICO: ${errorMsg}`);
      throw new Error(errorMsg);
    }
    logger.warn(`⚠️ ADVERTENCIA: ${errorMsg}`);
  }

  // Verificar que los secrets sean diferentes
  if (jwtSecret && jwtRefreshSecret && jwtSecret === jwtRefreshSecret) {
    const errorMsg = 'JWT_SECRET y JWT_REFRESH_SECRET deben ser diferentes';
    if (isProduction) {
      logger.error(`🔒 CRÍTICO: ${errorMsg}`);
      throw new Error(errorMsg);
    }
    logger.warn(`⚠️ ADVERTENCIA: ${errorMsg}`);
  }

  logger.log('✅ Validación de secrets de seguridad completada');
}

async function bootstrap() {
  // Validar secrets de seguridad ANTES de crear la aplicación
  validateSecuritySecrets();

  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean) || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // HALLAZGO #3: Configurar ClassSerializerInterceptor para excluir campos sensibles
  // Esto respeta el decorator @Exclude() en las entidades
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const port = process.env.PORT || 3001;

  await app.listen(port, '0.0.0.0');
  
  logger.log(`🚀 Servicio Auth corriendo en puerto: ${port}`);
}

bootstrap();
