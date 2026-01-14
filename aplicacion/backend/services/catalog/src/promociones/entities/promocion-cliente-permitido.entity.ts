import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CampaniaPromocional } from './campania.entity';

@Entity({ name: 'promociones_clientes_permitidos' })
export class PromocionClientePermitido {
  @PrimaryColumn({ name: 'campaña_id', type: 'int' })
  campania_id: number;

  @PrimaryColumn({ name: 'cliente_id', type: 'uuid' })
  cliente_id: string;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  created_at: Date;

  @ManyToOne(() => CampaniaPromocional)
  @JoinColumn({ name: 'campaña_id' })
  campania: CampaniaPromocional;
}
