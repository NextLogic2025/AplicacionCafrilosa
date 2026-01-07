import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Requisito profesional: Validación estricta
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,            // Elimina campos que no estén en el DTO
    forbidNonWhitelisted: true, // Lanza error si hay campos extra
    transform: true,            // Transforma tipos automáticamente (ej: string a number)
  }));

  // Habilitar CORS para el frontend (Web/Mobile)
  app.enableCors();

  await app.listen(process.env.PORT || 3000);
}
bootstrap();