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

    private onOrderApproved(id: string) {
        // Ejemplo: Notificar a Bodega para que inicie el picking
        this.logger.debug(`Pedido aprobado, notificando a logística: ${id}`);
    }

    private onOrderDelivered(id: string) {
        // Ejemplo: Generar encuesta de satisfacción o cerrar facturación
        this.logger.debug(`Pedido entregado con éxito: ${id}`);
    }

    async onModuleDestroy() {
        await this.pgClient.end();
    }
}