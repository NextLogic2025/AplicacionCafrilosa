import { Injectable, OnModuleInit, OnModuleDestroy, Logger, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';
import { OrdersService } from './orders.service';
import { ServiceHttpClient } from '../../common/http/service-http-client.service';
import { WarehouseExternalService } from '../../common/external/warehouse.external.service';

@Injectable()
export class OrderListenerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(OrderListenerService.name);
    private pgClient: Client;

    constructor(
        private readonly configService: ConfigService,
        private readonly ordersService: OrdersService,
        private readonly warehouseExternal: WarehouseExternalService,
    ) {
        this.pgClient = new Client({ connectionString: this.configService.get<string>('DATABASE_URL') });
    }

    async onModuleInit() {
        await this.setupListener();
    }

    private async setupListener() {
        try {
            await this.pgClient.connect();

            await this.pgClient.query("LISTEN \"pedido-creado\"");
            await this.pgClient.query("LISTEN \"pedido-aprobado\"");
            await this.pgClient.query("LISTEN \"pedido-entregado\"");
            await this.pgClient.query("LISTEN \"picking-completado\"");

            this.pgClient.on('notification', (notification) => {
                void this.handleNotification(notification);
            });

            this.logger.debug('Escuchando eventos asincronos de la base de datos (PostgreSQL Notify)');
        } catch (error) {
            this.logger.error('Error al conectar el listener de eventos:', error);
            setTimeout(() => void this.setupListener(), 5000);
        }
    }

    private async handleNotification(notification: any) {
        const { channel, payload } = notification;
        const id = payload;
        this.logger.debug(`Evento recibido en canal [${channel}]: id ${id}`);

        try {
            switch (channel) {
                case 'pedido-creado':
                    this.onOrderCreated(id);
                    break;
                case 'pedido-aprobado':
                    await this.onOrderApproved(id);
                    break;
                case 'pedido-entregado':
                    this.onOrderDelivered(id);
                    break;
                case 'picking-completado':
                    await this.onPickingCompleted(id);
                    break;
                default:
                    this.logger.debug('Canal no manejado por listener:', channel);
            }
        } catch (err) {
            this.logger.error('Error manejando notificacion', { channel, id, error: err?.message || err });
        }
    }

    private onOrderCreated(id: string) {
        this.logger.debug(`Logica de post-creacion para pedido: ${id}`);
    }

    private async onOrderApproved(id: string) {
        this.logger.debug(`Pedido aprobado, notificando a logistica: ${id}`);

        try {
            let reservationId: string | null = null;
            try {
                const res = await this.pgClient.query('SELECT reservation_id FROM pedidos WHERE id = $1', [id]);
                if (res && res.rows && res.rows.length) reservationId = res.rows[0].reservation_id || null;
            } catch (e) {
                this.logger.warn('No se pudo obtener reservation_id del pedido', { pedidoId: id, error: e?.message || e });
            }

            const bodyToSend: any = reservationId ? { pedido_id: id, reservation_id: reservationId } : { pedido_id: id };

            try {
                await this.warehouseExternal.confirmPicking(bodyToSend);
                this.logger.debug('Warehouse picking confirmed for pedido', { pedidoId: id });
            } catch (err) {
                this.logger.warn('Warehouse picking confirm failed', { pedidoId: id, error: err?.message || err });
            }
        } catch (err) {
            this.logger.error('Error notifying warehouse for picking confirm', { pedidoId: id, error: err?.message || err });
        }
    }

    private onOrderDelivered(id: string) {
        this.logger.debug(`Pedido entregado con exito: ${id}`);
    }

    private async onPickingCompleted(pickingId: string) {
        this.logger.debug(`Picking completado recibido: ${pickingId}`);

        try {
            const pickingJson: any = await this.warehouseExternal.getPicking(pickingId);

            const pedidoId = pickingJson?.pedidoId || pickingJson?.pedido_id || pickingJson?.pedido || null;
            if (!pedidoId) {
                this.logger.warn('Picking obtenido no contiene pedido asociado', { pickingId, picking: pickingJson });
                return;
            }

            try {
                await this.ordersService.updateStatus(pedidoId, 'PREPARADO', null, 'Picking completado - actualizacion automatica');
                this.logger.debug('Pedido marcado como PREPARADO tras picking completado', { pickingId, pedidoId });
            } catch (err) {
                this.logger.error('Error actualizando estado del pedido tras picking completado', { pickingId, pedidoId, error: err?.message || err });
            }
        } catch (err) {
            this.logger.error('Error fetching picking from Warehouse', { pickingId, error: err?.message || err });
        }
    }

    async onModuleDestroy() {
        try { await this.pgClient.end(); } catch (_) { }
    }
}

