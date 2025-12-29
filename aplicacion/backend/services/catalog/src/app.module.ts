import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

import { Product } from './products/entities/product.entity';
import { Category } from './categories/entities/category.entity';
import { ListaPrecio } from './precios/entities/lista-precio.entity';
import { PrecioItem } from './precios/entities/precio.entity';
import { PreciosModule } from './precios/precios.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { JwtStrategy } from './auth/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: +(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || 'admin',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'catalog_db',
      entities: [Product, Category, ListaPrecio, PrecioItem],
      synchronize: false,
      logging: false
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ProductsModule,
    CategoriesModule,
    PreciosModule,
  ]
  ,
  providers: [JwtStrategy]
})
export class AppModule {}
