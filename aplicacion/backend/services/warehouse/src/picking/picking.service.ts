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
import { ServiceHttpClient } from '../common/http/service-http-client.service';

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
        private readonly serviceHttp: ServiceHttpClient,
    ) { }

    private async fetchProductInfo(productId: string) {
        try {
            const arr = await this.serviceHttp.post<any[]>(
                'catalog-service',
                '/products/internal/batch',
                { ids: [productId] },
            );
            if (Array.isArray(arr) && arr.length) {
                const body = arr[0];
                const nombre = body.nombre || body.name || body.nombre_producto || body.nombreProducto || body.title || null;
                const descripcion = body.descripcion || body.description || body.descripcion_producto || body.details || null;
                const unidad = body.unidad_medida || body.unit || body.unidad || body.unidadMedida || null;
                const sku = body.codigo_sku || body.sku || body.codigoSku || body.sku_codigo || null;
                return { nombre, descripcion, unidad, sku };
            }
        } catch (e) {
            this.logger.debug('fetchProductInfo error ' + (e?.message || e));
        }
        return null;
    }

    private async fetchOrderInfo(pedidoId: string) {
        try {
            const body = await this.serviceHttp.get<any>(
                'orders-service',
                `/internal/${pedidoId}`,
            );
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

    private async fetchUserInfo(userId: string) {
        try {
            const body = await this.serviceHttp.post<any[]>(
                'usuarios-service',
                '/usuarios/batch/internal',
                { ids: [userId] },
            );
            if (!Array.isArray(body) || body.length === 0) return null;
            const u = body[0];
            return {
                nombreCompleto: u.nombre_completo || u.nombreCompleto || u.name || u.nombre || null,
                email: u.email || null,
            };
        } catch (e) {
            this.logger.debug('fetchUserInfo error ' + (e?.message || e));
        }
        return null;
    }

    private async _enrichPicking(orden: PickingOrden) {
        const base: any = { ...orden } as any;

        // attach pedido summary
        try {
            const pedido = await this.fetchOrderInfo((orden as any).pedidoId);
            base.pedido = pedido || null;
        } catch (e) {
            base.pedido = null;
        }

        // bodeguero asignado object
        base.bodegueroAsignado = null;
        if ((orden as any).bodegueroAsignadoId) {
            base.bodegueroAsignado = { id: (orden as any).bodegueroAsignadoId, nombreCompleto: null };
            try {
                const u = await this.fetchUserInfo((orden as any).bodegueroAsignadoId);
                if (u && u.nombreCompleto) base.bodegueroAsignado.nombreCompleto = u.nombreCompleto;
            } catch (e) {
                // keep placeholder if user service unreachable
            }
        }

        // load items with relations if not present
        let items: PickingItem[] = [] as any;
        try {
            items = await this.itemRepo.find({ where: { pickingId: orden.id }, relations: ['ubicacionSugerida', 'lote'] });
        } catch (e) {
            items = [] as any;
        }

        base.items = await Promise.all(items.map(async (it) => {
            const out: any = { ...it };
            // product info
            try {
                const prod = await this.fetchProductInfo(it.productoId);
                if (prod) {
                    out.nombreProducto = prod.nombre;
                    out.sku = prod.sku;
                }
            } catch (e) {
                // ignore
            }

            // ubicacion sugerida
            out.ubicacionSugerida = out.ubicacionSugerida || null;
            if (out.ubicacionSugerida) {
                out.ubicacionSugerida = {
                    id: out.ubicacionOrigenSugerida,
                    codigoVisual: (it as any).ubicacionSugerida?.codigoVisual || null,
                };
            }

            // lote sugerido
            out.loteSugerido = out.loteSugerido || null;
            if ((it as any).lote) {
                out.loteSugerido = {
                    id: it.loteSugerido,
                    numeroLote: (it as any).lote?.numeroLote || null,
                };
            }

            // stock availability for suggested ubicacion/lote
            try {
                if (it.ubicacionOrigenSugerida && (it.loteConfirmado || it.loteSugerido)) {
                    const loteId = it.loteConfirmado || it.loteSugerido;
                    const stock = await this.stockRepo.findOne({ where: { ubicacionId: it.ubicacionOrigenSugerida, loteId } });
                    if (stock) {
                        out.cantidadDisponible = Number(stock.cantidadFisica) - Number(stock.cantidadReservada);
                        out.cantidadReservada = Number(stock.cantidadReservada || 0);
                    }
                }
            } catch (e) {
                // ignore
            }

            return out;
        }));

        return base;
    }

    findAll(estado?: string) {
        const qb = this.ordenRepo.createQueryBuilder('p').where('p.deleted_at IS NULL');
        if (estado) qb.andWhere('p.estado = :estado', { estado });
        return qb.orderBy('p.prioridad', 'DESC').addOrderBy('p.created_at', 'ASC').getMany()
            .then((rows) => Promise.all(rows.map((r) => this._enrichPicking(r))));
    }

    findByBodeguero(bodegueroId: string) {
        // Return orders explicitly assigned to this bodeguero
        return this.ordenRepo.find({
            where: { bodegueroAsignadoId: bodegueroId, deletedAt: IsNull() },
            order: { prioridad: 'DESC', createdAt: 'ASC' },
        }).then(rows => Promise.all(rows.map(r => this._enrichPicking(r))));
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
            .getMany()
            .then(rows => Promise.all(rows.map(r => this._enrichPicking(r))));
    }

    async findOne(id: string) {
        const orden = await this.ordenRepo.findOne({ where: { id, deletedAt: IsNull() } });
        if (!orden) throw new NotFoundException('Orden de picking no encontrada');
        return this._enrichPicking(orden);
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

    async asignarBodeguero(id: string, bodegueroId: string, authHeader?: string | null) {
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

        // Notify Orders service: change pedido status to EN_PREPARACION when a bodeguero takes the picking
        try {
            const pedidoId = (orden as any).pedidoId;
            if (pedidoId) {
                const headers = authHeader ? { Authorization: authHeader } : undefined;
                await this.serviceHttp.patch(
                    'orders-service',
                    `/orders/${pedidoId}/status`,
                    { status: 'EN_PREPARACION' },
                    { headers },
                );
            }
        } catch (err) {
            this.logger.error('Error while notifying Orders service about picking assignment', err?.message || err);
        }

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

        // If this picking was created from a reservation, mark that reservation as COMPLETED
        try {
            const ordenRecord: any = await this.ordenRepo.findOne({ where: { id } });
            const reservationId = ordenRecord?.reservationId || (orden as any).reservationId || null;
            if (reservationId) {
                await this.reservationRepo.update(reservationId, { status: 'COMPLETED' } as any);
                this.logger.log(`Reserva ${reservationId} marcada como COMPLETED por picking ${id}`);
            }
        } catch (e) {
            this.logger.warn('No se pudo actualizar el status de la reserva tras completar picking', { pickingId: id, err: e?.message || e });
        }

        // Notify Orders service to mark the related pedido as PREPARADO
        try {
            const ordenRecord2: any = await this.ordenRepo.findOne({ where: { id } });
            const pedidoId = ordenRecord2?.pedidoId || (orden as any).pedidoId || null;
            if (pedidoId) {
                try {
                    await this.serviceHttp.patch('orders-service', `/internal/${pedidoId}/status`, { status: 'PREPARADO' });
                    this.logger.log(`Notificado Orders para marcar pedido ${pedidoId} como PREPARADO tras picking ${id}`);
                } catch (notifyErr) {
                    this.logger.warn('Fallo al notificar Orders para marcar PREPARADO', { pickingId: id, pedidoId, error: notifyErr?.message || notifyErr });
                }
            } else {
                this.logger.warn('Picking completado sin pedido asociado - no se notificará Orders', { pickingId: id });
            }
        } catch (e) {
            this.logger.warn('Error preparando notificacion a Orders tras completar picking', { pickingId: id, err: e?.message || e });
        }

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

        // Persist mapping between picking and reservation so completarPicking can update it later
        try {
            const pickingId = (picking as any)?.id || (picking && (picking as any).id);
            if (pickingId) {
                await this.ordenRepo.update(pickingId, { reservationId } as any);
            }
        } catch (e) {
            this.logger.warn('No se pudo guardar reservationId en picking_ordenes', { err: e?.message || e });
        }

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
