import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Client } from 'pg';
import { Subject } from 'rxjs';

@Injectable()
export class DbListenerService implements OnModuleInit, OnModuleDestroy {
  private client: Client;
  private readonly logger = new Logger(DbListenerService.name);

  public readonly updates$ = new Subject<any>();

  constructor() {
    this.client = new Client({ connectionString: process.env.DATABASE_URL });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('📡 Conectado a DB para escuchar eventos en tiempo real');

      await this.client.query('LISTEN "catalogo-cambio"');

      this.client.on('notification', (msg) => {
        try {
          if (msg.channel === 'catalogo-cambio' && msg.payload) {
            const payload = JSON.parse(msg.payload);
            this.updates$.next(payload);
          }
        } catch (e) {
          this.logger.error('Error parseando notificación JSON', e?.message || e);
        }
      });
    } catch (error) {
      this.logger.error('Error conectando listener a DB', error?.message || error);
    }
  }

  async onModuleDestroy() {
    try {
      await this.client.end();
    } catch (e) {
      this.logger.warn('Error closing DB listener client', e?.message || e);
    }
  }
}
