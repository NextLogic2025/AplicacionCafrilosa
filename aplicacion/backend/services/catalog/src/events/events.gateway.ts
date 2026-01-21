import { WebSocketGateway, WebSocketServer, OnGatewayConnection, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DbListenerService } from './db-listener.service';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' }, namespace: 'ws/catalog' })
@Injectable()
export class EventsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(private readonly dbListener: DbListenerService, private readonly jwtService: JwtService) {
    this.dbListener.updates$.subscribe((payload) => {
      try {
        this.logger.log('DB event received: ' + JSON.stringify(payload));
        this.handleDatabaseEvent(payload);
      } catch (e) {
        this.logger.error('Error handling DB event', e?.message || e);
      }
    });
  }

  async handleConnection(client: Socket) {
    try {
      const tokenRaw = (client.handshake.auth && client.handshake.auth.token) || client.handshake.headers['authorization'];
      const token = typeof tokenRaw === 'string' ? tokenRaw.replace(/^Bearer\s+/i, '') : null;
      if (!token) {
        client.disconnect();
        return;
      }

      let payload: any = null;
      try {
        payload = this.jwtService.decode(token) as any;
      } catch (e) {
        this.logger.warn('Invalid JWT on socket connection');
        client.disconnect();
        return;
      }

      if (!payload) {
        client.disconnect();
        return;
      }

      const userId = payload.sub;
      const role = payload.role;
      const clienteId = payload.clienteId || payload.cliente_id || payload.clientId;

      client.join(`user:${userId}`);
      if (role) client.join(`role:${role}`);
      if (clienteId) {
        client.join(`cliente:${clienteId}`);
        this.logger.log(`Socket joined cliente room: cliente:${clienteId} for user ${userId}`);
      }
      if (role === 'cliente' && payload.listaPrecioId) {
        client.join(`pricelist:${payload.listaPrecioId}`);
        this.logger.log(`Socket connected: ${userId} roles=${role} listaPrecioId=${payload.listaPrecioId}`);
      } else {
        this.logger.log(`Socket connected: ${userId} roles=${role} listaPrecioId=${payload?.listaPrecioId ?? 'none'}`);
      }
    } catch (e) {
      this.logger.error('Socket connection error', e?.message || e);
      client.disconnect();
    }
  }

  @SubscribeMessage('subscribePricelist')
  handleSubscribePricelist(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { listaId: number },
  ) {
    if (!data || !data.listaId) {
      this.logger.warn(`Cliente ${client.id} intentó suscribirse sin listaId`);
      return;
    }

    const roomName = `pricelist:${data.listaId}`;
    client.join(roomName);
    this.logger.log(`✅ Cliente ${client.id} se suscribió MANUALMENTE a la sala: ${roomName}`);
    client.emit('subscription-confirmed', { room: roomName });
  }

  @SubscribeMessage('subscribeCliente')
  handleSubscribeCliente(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { clienteId: string },
  ) {
    if (!data || !data.clienteId) {
      this.logger.warn(`Cliente ${client.id} intentó suscribirse a cliente sin clienteId`);
      return;
    }

    const roomName = `cliente:${data.clienteId}`;
    client.join(roomName);
    this.logger.log(`✅ Cliente ${client.id} se suscribió MANUALMENTE a la sala: ${roomName}`);
    client.emit('subscription-confirmed', { room: roomName });
  }

  private handleDatabaseEvent(payload: any) {
    const { table, action, data } = payload || {};

    if (table === 'asignacion_vendedores' && action === 'INSERT') {
      this.server.to(`user:${data.vendedor_usuario_id}`).emit('notification', {
        type: 'ROUTE_UPDATE',
        title: 'Nueva Ruta Asignada',
        message: 'Se te ha asignado una nueva zona. Revisa tu planificación.',
      });
    }

    if (table === 'precios_items') {
      this.logger.log(`Emitting price update for lista_id=${data?.lista_id}`);
      this.server.to(`pricelist:${data.lista_id}`).emit('notification', {
        type: 'CATALOG_UPDATE',
        title: 'Actualización de Precios',
        message: 'Hay cambios en los precios de tu catálogo.',
      });
    }

    if (table === 'sucursales_cliente' && action === 'INSERT') {
      this.server.to('role:supervisor').emit('notification', {
        type: 'ALERT_SUPERVISOR',
        title: 'Nueva Sucursal Registrada',
        message: 'Un cliente ha añadido una sucursal nueva.',
      });
    }

    if (table === 'campañas_promocionales' && action === 'INSERT') {
      this.logger.log(`Emitting promo ${data?.alcance} for lista=${data?.lista_precios_objetivo_id}`);
      const notif = { type: 'PROMO', title: '¡Nueva Oferta!', message: data.nombre };
      if (data.alcance === 'GLOBAL') this.server.to('role:cliente').emit('notification', notif);
      if (data.alcance === 'POR_LISTA') this.server.to(`pricelist:${data.lista_precios_objetivo_id}`).emit('notification', notif);
    }
    
    if (table === 'promociones_clientes_permitidos' && action === 'INSERT') {
      // data should contain: campaña_id, cliente_id
      try {
        const clienteId = data.cliente_id || data.clienteId || data.cliente;
        if (clienteId) {
          this.logger.log(`Emitting promo to cliente=${clienteId}`);
          this.server.to(`cliente:${clienteId}`).emit('notification', {
            type: 'PROMO_PERSONAL',
            title: 'Promoción exclusiva',
            message: 'Tienes una promoción disponible para tu cuenta.',
            data,
          });
        }
      } catch (e) {
        this.logger.error('Error emitting promociones_clientes_permitidos', e?.message || e);
      }
    }
  }
}
