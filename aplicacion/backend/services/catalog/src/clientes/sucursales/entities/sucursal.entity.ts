import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'sucursales_cliente' })
export class SucursalCliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cliente_id', type: 'uuid' })
  cliente_id: string;

  @Column({ name: 'nombre_sucursal' })
  nombre_sucursal: string;

  @Column({ name: 'direccion_entrega', type: 'text', nullable: true })
  direccion_entrega: string | null;

  @Column({ name: 'ubicacion_gps', type: 'geometry', nullable: true })
  ubicacion_gps: any | null;

  @Column({ name: 'contacto_nombre', nullable: true })
  contacto_nombre: string | null;

  @Column({ name: 'contacto_telefono', nullable: true })
  contacto_telefono: string | null;

  @Column({ default: true })
  activo: boolean;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  created_at: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
  updated_at: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}
