import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { Reservation } from './entities/reservation.entity';
import { ReservationItem } from './entities/reservation-item.entity';
import { StockUbicacion } from '../stock/entities/stock-ubicacion.entity';
import { ServiceHttpClient } from '../common/http/service-http-client.service';
import { CatalogExternalService } from '../common/external/catalog.external.service';
import { OrdersExternalService } from '../common/external/orders.external.service';

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly serviceHttp: ServiceHttpClient,
    private readonly catalogExternal: CatalogExternalService,
    private readonly ordersExternal: OrdersExternalService,
  ) {}

  private async fetchProductInfo(productId: string) {
    try {
      this.logger.debug(`Calling catalog internal batch for product ${productId}`);
      const arr = await this.catalogExternal.batchProducts([productId]);
      if (Array.isArray(arr) && arr.length) {
        const body = arr[0];
        const nombre = body.nombre || body.name || body.nombre_producto || body.nombreProducto || body.title || null;
        const descripcion = body.descripcion || body.description || body.descripcion_producto || body.details || null;
        const unidad = body.unidad_medida || body.unit || body.unidad || body.unidadMedida || null;
        const sku = body.codigo_sku || body.sku || body.codigoSku || body.sku_codigo || null;
        this.logger.debug(`Catalog internal batch returned for ${productId}: nombre=${nombre}, sku=${sku}`);
        return { nombre, descripcion, unidad, sku };
      }
      this.logger.debug(`Catalog internal batch returned empty for ${productId}`);
    } catch (e) {
      this.logger.debug('fetchProductInfo error ' + (e?.message || e));
    }
    return null;
  }

  private async fetchOrderInfo(pedidoId: string) {
    try {
      const body = await this.ordersExternal.getOrder(pedidoId);
      return {
        numero: body.codigoVisual || body.codigo_visual || body.numero || body.id,
        clienteNombre: body.clienteNombre || body.cliente_nombre || body.cliente?.nombre || null,
        referenciaComercial: body.referenciaComercial || body.referencia_comercial || body.referencia || null,
      };
    } catch (e) {
      this.logger.debug('fetchOrderInfo error ' + (e?.message || e));
      return null;
    }
  }

  async create(dto: CreateReservationDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const reservation = new Reservation();
      reservation.tempId = dto.tempId;
      reservation.items = [];

      for (const itemDto of dto.items) {
        // Find a stock record for the product with pessimistic lock
        const stockRecord = await queryRunner.manager.createQueryBuilder(StockUbicacion, 's')
          .where('s.lote_id IN (SELECT id FROM lotes WHERE producto_id = :productoId)', { productoId: itemDto.productId })
          .andWhere('s.cantidad_fisica - s.cantidad_reservada >= :cantidad', { cantidad: itemDto.quantity })
          .setLock('pessimistic_write')
          .getOne();

        if (!stockRecord) {
          throw new ConflictException(`Stock insuficiente o producto no encontrado: ${itemDto.productId}`);
        }

        // Reserve
        stockRecord.cantidadReservada = Number(stockRecord.cantidadReservada || 0) + Number(itemDto.quantity);
        await queryRunner.manager.save(stockRecord);

        const resItem = new ReservationItem();
        resItem.productId = itemDto.productId;
        // DB has a NOT NULL constraint on sku in some environments; default to empty string to avoid QueryFailedError
        resItem.sku = itemDto.sku ?? '';
        resItem.quantity = itemDto.quantity;
        resItem.stockUbicacionId = stockRecord.id;
        reservation.items.push(resItem);
      }

      const savedReservation = await queryRunner.manager.save(reservation);

      await queryRunner.commitTransaction();
      this.logger.log(`Reserva creada con éxito: ${savedReservation.id}`);
      return { id: savedReservation.id };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error creando reserva: ${error?.message || error}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const reservation = await queryRunner.manager.findOne(Reservation, { where: { id }, relations: ['items'] });
      if (!reservation) throw new NotFoundException('Reserva no encontrada');
      if (reservation.status !== 'ACTIVE') return;

      for (const item of reservation.items) {
        const stockRecord = await queryRunner.manager.findOne(StockUbicacion, { where: { id: item.stockUbicacionId }, lock: { mode: 'pessimistic_write' } as any });
        if (stockRecord) {
          stockRecord.cantidadReservada = Math.max(0, Number(stockRecord.cantidadReservada || 0) - Number(item.quantity));
          await queryRunner.manager.save(stockRecord);
        }
      }

      reservation.status = 'CANCELLED';
      await queryRunner.manager.save(reservation);

      await queryRunner.commitTransaction();
      this.logger.log(`Reserva ${id} cancelada y stock liberado.`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error cancelando reserva: ${error?.message || error}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    const results = await this.dataSource.manager.find(Reservation, { where, relations: ['items'], order: { createdAt: 'DESC' } });
    // Enrich each reservation with human-friendly fields
    return Promise.all(results.map((r) => this._enrichReservation(r)));
  }

  async findOne(id: string) {
    const res = await this.dataSource.manager.findOne(Reservation, { where: { id }, relations: ['items'] });
    if (!res) throw new NotFoundException('Reserva no encontrada');
    return this._enrichReservation(res);
  }

  private async _enrichReservation(reservation: Reservation) {
    const enriched: any = { ...reservation } as any;

    // Attach pedido info if tempId looks like an order id
    enriched.pedido = null;
    if (reservation.tempId) {
      try {
        const info = await this.fetchOrderInfo(reservation.tempId);
        if (info) enriched.pedido = info;
      } catch (e) {
        this.logger.debug('Could not fetch order for reservation ' + reservation.id);
      }
    }

    // Enrich items
    enriched.items = await Promise.all((reservation.items || []).map(async (it: ReservationItem) => {
      const out: any = { ...it };
      // stock/ubicacion/lote
      if (it.stockUbicacionId) {
        try {
          const stock = await this.dataSource.manager.findOne(StockUbicacion, { where: { id: it.stockUbicacionId }, relations: ['ubicacion', 'lote'] });
          if (stock) {
            out.ubicacionCodigo = stock.ubicacion?.codigoVisual || null;
            out.ubicacionNombre = `Almacen ${stock.ubicacion?.almacenId || ''}`;
            out.loteNumero = stock.lote?.numeroLote || null;
            out.cantidadDisponible = Number(stock.cantidadFisica) - Number(stock.cantidadReservada);
            out.cantidadReservada = Number(stock.cantidadReservada || 0);
          }
        } catch (e) {
          this.logger.debug('Error enriching reservation stock ' + (e?.message || e));
        }
      }

      // product info via catalog
      try {
        const prod = await this.fetchProductInfo(it.productId);
        if (prod) {
          out.nombreProducto = prod.nombre;
          out.descripcion = prod.descripcion;
          out.unidad = prod.unidad;
          out.sku = out.sku || prod.sku;
        } else {
          this.logger.warn(`No product info for reservation ${reservation.id} item ${it.id} product ${it.productId}`);
        }
      } catch (e) {
        this.logger.warn(`Error fetching product info for reservation ${reservation.id} item ${it.id} product ${it.productId}: ${e?.message || e}`);
      }

      return out;
    }));

    return enriched;
  }
}
