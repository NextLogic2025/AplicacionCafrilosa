import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacturasController } from './facturas.controller';
import { FacturasService } from './facturas.service';
import { Factura } from '../entities/factura.entity';
import { DetalleFactura } from '../entities/detalle-factura.entity';
import { ReciboCobro } from '../entities/recibo-cobro.entity';
import { ImputacionPago } from '../entities/imputacion-pago.entity';
import { CuentaPorCobrar } from '../entities/cuenta-por-cobrar.entity';
import { PuntoEmision } from '../entities/punto-emision.entity';
import { SaldoVendedorCaja } from '../entities/saldo-vendedor-caja.entity';

@Module({
  imports: [
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
  controllers: [FacturasController],
  providers: [FacturasService],
})
export class FacturasModule {}
