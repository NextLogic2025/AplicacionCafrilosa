import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'vehiculo_movimientos' })
export class VehiculoMovimiento {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'despacho_id', type: 'uuid' })
  despacho_id: string;

  @Column({ name: 'vehiculo_id', type: 'uuid' })
  vehiculo_id: string;

  @Column({ name: 'ubicacion', type: 'geography' })
  ubicacion: any;

  @Column({ name: 'velocidad_kmh', type: 'numeric', nullable: true })
  velocidad_kmh: string | null;

  @Column({ name: 'bateria_nivel', type: 'int', nullable: true })
  bateria_nivel: number | null;

  @Column({ name: 'fecha_registro', type: 'timestamptz', default: () => 'NOW()' })
  fecha_registro: Date;
}
