import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('estados_pedido')
export class EstadoPedido {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  codigo: string;

  @Column({ type: 'varchar', length: 50 })
  nombre_visible: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'boolean', default: false })
  es_estado_final: boolean;

  @Column({ type: 'int', nullable: true })
  orden_secuencia: number | null;
}
