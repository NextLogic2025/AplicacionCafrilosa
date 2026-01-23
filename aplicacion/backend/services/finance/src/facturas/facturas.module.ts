import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacturasController } from './facturas.controller';
import { RecibosController } from './recibos.controller';
import { FacturasService } from './facturas.service';
import { Factura } from '../entities/factura.entity';
import { DetalleFactura } from '../entities/detalle-factura.entity';
import { ReciboCobro } from '../entities/recibo-cobro.entity';
import { ImputacionPago } from '../entities/imputacion-pago.entity';
import { CuentaPorCobrar } from '../entities/cuenta-por-cobrar.entity';
import { PuntoEmision } from '../entities/punto-emision.entity';
import { SaldoVendedorCaja } from '../entities/saldo-vendedor-caja.entity';
import { FacturasInternalController } from './facturas.internal.controller';
import { CatalogExternalService } from '../common/external/catalog.external.service';
import { WarehouseExternalService } from '../common/external/warehouse.external.service';
import { OrdersExternalService } from '../common/external/orders.external.service';
import { UsuariosExternalService } from '../common/external/usuarios.external.service';
import { ServiceHttpModule } from '../common/http/service-http.module';

@Module({
  imports: [
    ServiceHttpModule,
    TypeOrmModule.forFeature([
      Factura,
      DetalleFactura,
      ReciboCobro,
      ImputacionPago,
      CuentaPorCobrar,
      PuntoEmision,
      SaldoVendedorCaja,
    ]),
  ],
  controllers: [FacturasController, FacturasInternalController, RecibosController],
  providers: [FacturasService, CatalogExternalService, WarehouseExternalService, OrdersExternalService, UsuariosExternalService],
})
export class FacturasModule {}
