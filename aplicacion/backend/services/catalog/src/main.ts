import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  
  // Habilitar CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
    credentials: true,
  });
  
  await app.listen(3000);
  console.log('Catalog service running on http://localhost:3000');
}

bootstrap();
