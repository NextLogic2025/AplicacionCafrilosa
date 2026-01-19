// picking/picking.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';

import { PickingOrden } from './entities/picking-orden.entity';
import { PickingItem } from './entities/picking-item.entity';
import { StockUbicacion } from '../stock/entities/stock-ubicacion.entity';
import { Lote } from '../lotes/entities/lote.entity';
import { KardexMovimiento } from '../kardex/entities/kardex-movimiento.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { ReservationItem } from '../reservations/entities/reservation-item.entity';

@Injectable()
export class PickingService {
    private readonly logger = new Logger(PickingService.name);

    constructor(
        @InjectRepository(PickingOrden)
        private readonly ordenRepo: Repository<PickingOrden>,
        @InjectRepository(PickingItem)
        private readonly itemRepo: Repository<PickingItem>,
        @InjectRepository(StockUbicacion)
        private readonly stockRepo: Repository<StockUbicacion>,
        @InjectRepository(Lote)
        private readonly loteRepo: Repository<Lote>,
        @InjectRepository(KardexMovimiento)
        private readonly kardexRepo: Repository<KardexMovimiento>,
            @InjectRepository(Reservation)
            private readonly reservationRepo: Repository<Reservation>,
            @InjectRepository(ReservationItem)
            private readonly reservationItemRepo: Repository<ReservationItem>,
    ) { }

    findAll(estado?: string) {
        const qb = this.ordenRepo.createQueryBuilder('p').where('p.deleted_at IS NULL');
        if (estado) qb.andWhere('p.estado = :estado', { estado });
        return qb.orderBy('p.prioridad', 'DESC').addOrderBy('p.created_at', 'ASC').getMany();
    }

    findByBodeguero(bodegueroId: string) {
        // Return orders explicitly assigned to this bodeguero
        return this.ordenRepo.find({
            where: { bodegueroAsignadoId: bodegueroId, deletedAt: IsNull() },
            order: { prioridad: 'DESC', createdAt: 'ASC' },
        });
    }

    findAvailable() {
        // Orders without an assigned bodeguero (available to be taken)
        return this.ordenRepo
            .createQueryBuilder('p')
            .where('p.deleted_at IS NULL')
            .andWhere('p.bodeguero_asignado_id IS NULL')
            .andWhere("p.estado != 'COMPLETADO'")
            .orderBy('p.prioridad', 'DESC')
            .addOrderBy('p.created_at', 'ASC')
            .getMany();
    }

    async findOne(id: string) {
        const orden = await this.ordenRepo.findOne({ where: { id, deletedAt: IsNull() } });
        if (!orden) throw new NotFoundException('Orden de picking no encontrada');

        const items = await this.itemRepo.find({
            where: { pickingId: id },
            relations: ['ubicacionSugerida', 'lote'],
            order: { createdAt: 'ASC' },
        });

        return { ...orden, items };
    }

    async create(dto: { pedidoId: string; items: any[]; estado?: string }) {
        const existe = await this.ordenRepo.findOne({ where: { pedidoId: dto.pedidoId } });
        if (existe) throw new BadRequestException('Ya existe una orden de picking para este pedido');

        const orden = this.ordenRepo.create({
            pedidoId: dto.pedidoId,
            estado: dto.estado || 'ASIGNADO',
            prioridad: 1,
        });
        const saved: PickingOrden = await this.ordenRepo.save(orden);

        for (const item of dto.items) {
            // Preferir una ubicación/lote provista en el item (por ejemplo from reservation.item.stock_ubicacion_id)
            let sugerencia: any = null;
            if (item.stockUbicacionId) {
                const stock = await this.stockRepo.findOne({ where: { id: item.stockUbicacionId } });
                if (stock && Number(stock.cantidadFisica) - Number(stock.cantidadReservada) > 0) {
                    sugerencia = {
                        ubicacionId: stock.ubicacionId,
                        loteId: stock.loteId,
                        cantidadDisponible: Number(stock.cantidadFisica) - Number(stock.cantidadReservada),
                    };
                }
            }

            // Si no tenemos sugerencia por stockUbicacionId, usar la lógica normal de sugerencia
            if (!sugerencia) {
                sugerencia = await this.sugerirUbicacionLote(item.productoId, item.cantidad);
            }

            const pickingItem = this.itemRepo.create({
                pickingId: saved.id,
                productoId: item.productoId,
                cantidadSolicitada: item.cantidad,
                ubicacionOrigenSugerida: sugerencia?.ubicacionId || null,
                loteSugerido: sugerencia?.loteId || null,
                estadoLinea: 'PENDIENTE',
            });

            await this.itemRepo.save(pickingItem);

            if (sugerencia) {
                // Reservar solo la cantidad disponible (puede ser parcial)
                const cantidadAReservar = Math.min(Number(item.cantidad), Number(sugerencia.cantidadDisponible));
                if (cantidadAReservar > 0) {
                    await this.reservarStock(sugerencia.ubicacionId, sugerencia.loteId, cantidadAReservar);
                }
            }
        }

        return this.findOne(saved.id);
    }

    private async sugerirUbicacionLote(productoId: string, cantidadNecesaria: number) {
        // 1) Intentar encontrar un stock que cubra la cantidad necesaria y esté LIBERADO
        let stocks = await this.stockRepo
            .createQueryBuilder('s')
            .innerJoinAndSelect('s.lote', 'l')
            .innerJoinAndSelect('s.ubicacion', 'u')
            .where('l.producto_id = :productoId', { productoId })
            .andWhere('l.estado_calidad = :estado', { estado: 'LIBERADO' })
            .andWhere('s.cantidad_fisica - s.cantidad_reservada >= :cantidad', { cantidad: cantidadNecesaria })
            .orderBy('l.fecha_vencimiento', 'ASC')
            .addOrderBy('u.es_cuarentena', 'ASC')
            .limit(1)
            .getOne();

        // 2) Si no hay stock que cubra la demanda, intentar devolver el mejor lote disponible (incluso parcial)
        if (!stocks) {
            stocks = await this.stockRepo
                .createQueryBuilder('s')
                .innerJoinAndSelect('s.lote', 'l')
                .innerJoinAndSelect('s.ubicacion', 'u')
                .where('l.producto_id = :productoId', { productoId })
                .andWhere('s.cantidad_fisica - s.cantidad_reservada > 0')
                .orderBy('l.fecha_vencimiento', 'ASC')
                .addOrderBy('u.es_cuarentena', 'ASC')
                .limit(1)
                .getOne();
        }

        if (!stocks) return null;

        return {
            ubicacionId: stocks.ubicacionId,
            loteId: stocks.loteId,
            cantidadDisponible: Number(stocks.cantidadFisica) - Number(stocks.cantidadReservada),
        };
    }

    private async reservarStock(ubicacionId: string, loteId: string, cantidad: number) {
        const stock = await this.stockRepo.findOne({ where: { ubicacionId, loteId } });
        if (!stock) throw new NotFoundException('Stock no encontrado');

        const disponible = Number(stock.cantidadFisica) - Number(stock.cantidadReservada);
        if (disponible < cantidad) throw new BadRequestException('Stock insuficiente');

        stock.cantidadReservada = (Number(stock.cantidadReservada) + cantidad) as any;
        await this.stockRepo.save(stock);
    }

    private async liberarReserva(ubicacionId: string, loteId: string, cantidad: number) {
        const stock = await this.stockRepo.findOne({ where: { ubicacionId, loteId } });
        if (!stock) return;

        stock.cantidadReservada = Math.max(0, Number(stock.cantidadReservada) - cantidad) as any;
        await this.stockRepo.save(stock);
    }

    async asignarBodeguero(id: string, bodegueroId: string) {
        const orden = await this.findOne(id);
        if (orden.estado === 'COMPLETADO') throw new BadRequestException('Orden ya fue completada');

        if (orden.bodegueroAsignadoId && orden.bodegueroAsignadoId !== bodegueroId) {
            throw new BadRequestException('Orden ya está asignada a otro bodeguero');
        }

        await this.ordenRepo.update(id, {
            bodegueroAsignadoId: bodegueroId,
            // when assigning, ensure estado reflects assignment if it was pending
            estado: orden.estado === 'PENDIENTE' ? 'ASIGNADO' : orden.estado,
            updatedAt: new Date(),
        } as any);

        return this.findOne(id);
    }

    async iniciarPicking(id: string, usuarioId: string) {
        const orden = await this.findOne(id);

        if (orden.bodegueroAsignadoId && orden.bodegueroAsignadoId !== usuarioId) {
            throw new BadRequestException('Esta orden está asignada a otro bodeguero');
        }

        if (orden.estado === 'EN_PROCESO') throw new BadRequestException('Orden ya está en proceso');
        if (orden.estado === 'COMPLETADO') throw new BadRequestException('Orden ya fue completada');

        await this.ordenRepo.update(id, {
            bodegueroAsignadoId: usuarioId,
            estado: 'EN_PROCESO',
            fechaInicio: new Date(),
            updatedAt: new Date(),
        } as any);

        return this.findOne(id);
    }

    async registrarPickeo(pickingId: string, itemId: string, cantidadPickeada: number, loteConfirmado?: string) {
        const item = await this.itemRepo.findOne({ where: { id: itemId, pickingId } });
        if (!item) throw new NotFoundException('Item de picking no encontrado');

        const loteId = loteConfirmado || item.loteSugerido;
        if (!loteId) throw new BadRequestException('Se debe especificar un lote');

        const lote = await this.loteRepo.findOne({ where: { id: loteId } });
        if (!lote) throw new BadRequestException('Lote no encontrado');
        if (lote.productoId !== item.productoId) throw new BadRequestException('El lote no corresponde al producto');

        item.cantidadPickeada = (Number(item.cantidadPickeada) + cantidadPickeada) as any;
        item.loteConfirmado = loteId;
        item.estadoLinea = Number(item.cantidadPickeada) >= Number(item.cantidadSolicitada) ? 'COMPLETADO' : 'PARCIAL';
        item.updatedAt = new Date();

        await this.itemRepo.save(item);

        return item;
    }

    async completarPicking(id: string, usuarioId: string, observacionesBodega?: string) {
        const orden = await this.findOne(id);

        if (orden.bodegueroAsignadoId !== usuarioId) {
            throw new BadRequestException('Solo el bodeguero asignado puede completar esta orden');
        }

        if (orden.estado === 'COMPLETADO') throw new BadRequestException('Orden ya completada');

        const items = await this.itemRepo.find({ where: { pickingId: id } });
        const pendientes = items.filter((i) => i.estadoLinea === 'PENDIENTE');
        if (pendientes.length > 0) {
            throw new BadRequestException('Aún hay items pendientes de pickear');
        }

        for (const item of items) {
            const ubicacionId = item.ubicacionOrigenSugerida;
            const loteId = item.loteConfirmado || item.loteSugerido;

            if (!ubicacionId || !loteId) continue;

            const stock = await this.stockRepo.findOne({ where: { ubicacionId, loteId } });
            if (!stock) {
                this.logger.warn(`Stock no encontrado para ubicación ${ubicacionId} y lote ${loteId}`);
                continue;
            }

            const cantidadPickeada = Number(item.cantidadPickeada);
            stock.cantidadFisica = (Number(stock.cantidadFisica) - cantidadPickeada) as any;
            stock.cantidadReservada = Math.max(0, Number(stock.cantidadReservada) - cantidadPickeada) as any;
            await this.stockRepo.save(stock);

            await this.registrarKardex({
                tipoMovimiento: 'SALIDA_PICKING',
                referenciaDocUuid: id,
                productoId: item.productoId,
                loteId,
                ubicacionOrigen: ubicacionId,
                cantidad: cantidadPickeada,
                saldoResultante: stock.cantidadFisica,
                usuarioResponsableId: usuarioId,
            });
        }

        const updatePayload: any = {
            estado: 'COMPLETADO',
            fechaFin: new Date(),
            updatedAt: new Date(),
        };

        if (observacionesBodega) updatePayload.observacionesBodega = observacionesBodega;

        await this.ordenRepo.update(id, updatePayload as any);

        return this.findOne(id);
    }

    private async registrarKardex(data: Partial<KardexMovimiento>) {
        const kardex = this.kardexRepo.create(data as any);
        return this.kardexRepo.save(kardex);
    }

    async cancelarPicking(id: string) {
        const orden = await this.findOne(id);

        if (orden.estado === 'COMPLETADO') throw new BadRequestException('No se puede cancelar una orden completada');

        const items = await this.itemRepo.find({ where: { pickingId: id } });
        for (const item of items) {
            if (item.ubicacionOrigenSugerida && item.loteSugerido) {
                await this.liberarReserva(
                    item.ubicacionOrigenSugerida,
                    item.loteSugerido,
                    Number(item.cantidadSolicitada),
                );
            }
        }

        await this.ordenRepo.update(id, { deletedAt: new Date(), updatedAt: new Date() } as any);
        return { id, cancelled: true };
    }

    /**
     * Confirm a reservation and create a picking for the given pedido.
     * Expects a reservation id previously created via /reservations.
     */
    async confirmFromReservation(pedidoId: string, reservationId: string) {
        if (!reservationId) throw new BadRequestException('reservation_id requerido');

        const reservation = await this.reservationRepo.findOne({ where: { id: reservationId }, relations: ['items'] as any });
        if (!reservation) throw new NotFoundException('Reservation no encontrada');
        if (reservation.status !== 'ACTIVE') throw new BadRequestException('Reservation no está en estado ACTIVE');


        const items = (reservation.items || []).map((it: ReservationItem) => ({
            productoId: it.productId,
            cantidad: Number(it.quantity),
            stockUbicacionId: (it as any).stockUbicacionId || (it as any).stock_ubicacion_id || null,
            loteId: (it as any).lote_id || (it as any).loteId || null,
        }));

        // If no pedidoId provided, fallback to reservation id so DB constraint is satisfied
        const effectivePedidoId = pedidoId || reservation.tempId || reservation.id;

        // Create picking using existing create logic (will reserve stock where possible)
        const picking = await this.create({ pedidoId: effectivePedidoId, items, estado: 'PENDIENTE' });

        // Mark reservation as CONFIRMED
        await this.reservationRepo.update(reservationId, { status: 'CONFIRMED' } as any);

        return picking;
    }

    async getStatsPorBodeguero() {
        const stats = await this.ordenRepo.createQueryBuilder('orden')
            .select('orden.bodegueroAsignadoId', 'bodegueroId')
            .addSelect("COUNT(CASE WHEN orden.estado = 'COMPLETADO' THEN 1 END)", 'totalCompletados')
            .addSelect("COUNT(CASE WHEN orden.estado IN ('ASIGNADO', 'EN_PROCESO') THEN 1 END)", 'cargaActual')
            .where('orden.bodegueroAsignadoId IS NOT NULL')
            .andWhere('orden.deletedAt IS NULL')
            .groupBy('orden.bodegueroAsignadoId')
            .getRawMany();

        return stats.map(s => ({
            bodegueroId: s.bodegueroid || s.bodegueroId,
            totalCompletados: Number(s.totalcompletados || s.totalCompletados),
            cargaActual: Number(s.cargaactual || s.cargaActual)
        }));
    }
}