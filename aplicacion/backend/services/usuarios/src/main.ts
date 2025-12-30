import 'reflect-metadata';

import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
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

  // ESTA LÍNEA ES LA CLAVE:
  // Si Google me da un puerto, lo uso. Si no, uso el 3000 de siempre.
  const port = process.env.PORT || 3000;

  // '0.0.0.0' funciona tanto en tu Windows como en Linux/Docker.
  await app.listen(port, '0.0.0.0');
  
  logger.log(`🚀 Servicio Usuarios corriendo en puerto: ${port}`);
}

bootstrap();