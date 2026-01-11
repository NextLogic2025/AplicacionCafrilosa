import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from './config/config.module';

import { Product } from './products/entities/product.entity';
import { Category } from './categories/entities/category.entity';
import { ListaPrecio } from './precios/entities/lista-precio.entity';
import { PrecioItem } from './precios/entities/precio.entity';
import { Cliente } from './clientes/entities/cliente.entity';
import { SucursalCliente } from './clientes/sucursales/entities/sucursal.entity';
import { ZonaComercial } from './zonas/entities/zona.entity';
import { CampaniaPromocional } from './promociones/entities/campania.entity';
import { ProductoPromocion } from './promociones/entities/producto-promocion.entity';
import { PromocionClientePermitido } from './promociones/entities/promocion-cliente-permitido.entity';
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
import { HealthModule } from './health/health.module';
import { JwtStrategy } from './auth/strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Product, Category, ListaPrecio, PrecioItem, Cliente, SucursalCliente, ZonaComercial, CampaniaPromocional, ProductoPromocion, PromocionClientePermitido, RuteroPlanificado, AsignacionVendedores],
      autoLoadEntities: true,
      synchronize: false,
      logging: false,
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
    HealthModule,
  ],
  providers: [JwtStrategy],
})
export class AppModule {}
