import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { Reservation } from './entities/reservation.entity';
import { ReservationItem } from './entities/reservation-item.entity';
import { StockUbicacion } from '../stock/entities/stock-ubicacion.entity';

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(private readonly dataSource: DataSource) {}

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
        resItem.sku = itemDto.sku || null;
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
}
