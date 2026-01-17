import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg'; // Basado en la dependencia 'pg' de tu package.json

@Injectable()
export class OrderListenerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(OrderListenerService.name);
    private pgClient: Client;

    constructor(private configService: ConfigService) {
        // Configuramos el cliente directamente para tener control total del flujo LISTEN/NOTIFY
        this.pgClient = new Client({
            connectionString: this.configService.get<string>('DATABASE_URL'),
        });
    }

    async onModuleInit() {
        await this.setupListener();
    }

    private async setupListener() {
        try {
            await this.pgClient.connect();

            // Suscripción a los canales definidos en el SQL 05-init-orders.sql
            await this.pgClient.query('LISTEN pedido_creado');
            await this.pgClient.query('LISTEN pedido_aprobado');
            await this.pgClient.query('LISTEN pedido_entregado');

            this.pgClient.on('notification', (notification) => {
                this.handleNotification(notification);
            });

            this.logger.debug('🚀 Escuchando eventos asíncronos de la base de datos (PostgreSQL Notify)');
        } catch (error) {
            this.logger.error('Error al conectar el listener de eventos:', error);
            // Lógica de reconexión profesional
            setTimeout(() => this.setupListener(), 5000);
        }
    }

    private handleNotification(notification: any) {
        const { channel, payload } = notification;
        const pedidoId = payload;

        this.logger.debug(`Evento recibido en canal [${channel}]: Pedido ID ${pedidoId}`);

        // Aquí integrarías con otros microservicios o WebSockets
        switch (channel) {
            case 'pedido_creado':
                this.onOrderCreated(pedidoId);
                break;
            case 'pedido_aprobado':
                this.onOrderApproved(pedidoId);
                break;
            case 'pedido_entregado':
                this.onOrderDelivered(pedidoId);
                break;
        }
    }

    private onOrderCreated(id: string) {
        // Ejemplo: Notificar a microservicio de Inventario o enviar Correo
        this.logger.debug(`Lógica de post-creación para pedido: ${id}`);
    }

    private async onOrderApproved(id: string) {
        // Notificar a Warehouse para confirmar la reserva y crear el picking
        this.logger.debug(`Pedido aprobado, notificando a logística: ${id}`);
        const fetchFn = (globalThis as any).fetch;
        const warehouseBase = this.configService.get<string>('WAREHOUSE_SERVICE_URL') || process.env.WAREHOUSE_SERVICE_URL || 'http://warehouse-service:3000';
        const apiBaseW = warehouseBase.replace(/\/+$/, '') + (warehouseBase.includes('/api') ? '' : '/api');
        const serviceToken = this.configService.get<string>('SERVICE_TOKEN') || process.env.SERVICE_TOKEN;
        if (typeof fetchFn === 'function') {
            try {
                const headersObj: any = serviceToken ? { Authorization: 'Bearer ' + serviceToken, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
                // Try to fetch reservation_id for this pedido to pass to Warehouse
                let reservationId: string | null = null;
                try {
                    const res = await this.pgClient.query('SELECT reservation_id FROM pedidos WHERE id = $1', [id]);
                    if (res && res.rows && res.rows.length) reservationId = res.rows[0].reservation_id || null;
                } catch (e) {
                    this.logger.warn('No se pudo obtener reservation_id del pedido', { pedidoId: id, error: e?.message || e });
                }

                const bodyToSend: any = reservationId ? { pedido_id: id, reservation_id: reservationId } : { pedido_id: id };
                const resp: any = await fetchFn(apiBaseW + '/picking/confirm', { method: 'POST', headers: headersObj, body: JSON.stringify(bodyToSend) });
                if (!resp || !resp.ok) {
                    const txt = resp ? await resp.text().catch(() => null) : null;
                    this.logger.warn('Warehouse picking confirm failed', { pedidoId: id, status: resp?.status, body: txt });
                } else {
                    this.logger.debug('Warehouse picking confirmed for pedido', { pedidoId: id });
                }
            } catch (err) {
                this.logger.error('Error notifying warehouse for picking confirm', { pedidoId: id, error: err?.message || err });
            }
        } else {
            this.logger.warn('Fetch no disponible: no se pudo notificar Warehouse del pedido aprobado', { pedidoId: id });
        }
    }

    private onOrderDelivered(id: string) {
        // Ejemplo: Generar encuesta de satisfacción o cerrar facturación
        this.logger.debug(`Pedido entregado con éxito: ${id}`);
    }

    async onModuleDestroy() {
        await this.pgClient.end();
    }
}