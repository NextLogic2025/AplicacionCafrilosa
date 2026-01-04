import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';

import { Product } from './products/entities/product.entity';
import { Category } from './categories/entities/category.entity';
import { ListaPrecio } from './precios/entities/lista-precio.entity';
import { PrecioItem } from './precios/entities/precio.entity';
import { Cliente } from './clientes/entities/cliente.entity';
import { SucursalCliente } from './clientes/sucursales/entities/sucursal.entity';
import { ZonaComercial } from './zonas/entities/zona.entity';
import { CampaniaPromocional } from './promociones/entities/campania.entity';
import { ProductoPromocion } from './promociones/entities/producto-promocion.entity';
import { RuteroPlanificado } from './rutero/entities/rutero-planificado.entity';
import { AsignacionVendedores } from './asignacion/entities/asignacion-vendedores.entity';
import { PreciosModule } from './precios/precios.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { ClientesModule } from './clientes/clientes.module';
import { ZonasModule } from './zonas/zonas.module';
import { PromocionesModule } from './promociones/promociones.module';
import { RuteroModule } from './rutero/rutero.module';
import { AsignacionModule } from './asignacion/asignacion.module';
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
      entities: [Product, Category, ListaPrecio, PrecioItem, Cliente, SucursalCliente, ZonaComercial, CampaniaPromocional, ProductoPromocion, RuteroPlanificado, AsignacionVendedores],
      synchronize: false,
      logging: false
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ProductsModule,
    CategoriesModule,
    PreciosModule,
    ClientesModule,
    ZonasModule,
    PromocionesModule,
    RuteroModule,
    AsignacionModule,
  ]
  ,
  providers: [JwtStrategy]
})
export class AppModule {}
