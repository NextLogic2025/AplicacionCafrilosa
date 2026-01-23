import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'entregas_despacho' })
export class EntregaDespacho {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'despacho_id', type: 'uuid' })
  despacho_id: string;

  @Column({ name: 'pedido_id', type: 'uuid' })
  pedido_id: string;

  @Column({ name: 'cliente_id', type: 'uuid', nullable: true })
  cliente_id: string | null;

  @Column({ name: 'orden_visita', type: 'int' })
  orden_visita: number;

  @Column({ name: 'estado_entrega', length: 20, default: 'PENDIENTE' })
  estado_entrega: string;

  @Column({ name: 'direccion_texto', type: 'text', nullable: true })
  direccion_texto: string | null;

  @Column({ name: 'coordenadas_entrega', type: 'geometry', nullable: true })
  coordenadas_entrega: any | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  created_at: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
  updated_at: Date;
}
