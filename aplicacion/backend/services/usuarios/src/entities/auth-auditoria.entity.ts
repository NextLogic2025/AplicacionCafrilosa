import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('auth_auditoria')
export class AuthAuditoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, type: 'uuid' })
  usuario_id: string;

  @Column({ name: 'email_intentado', type: 'varchar', length: 100, nullable: true })
  email_intentado: string;

  @Column({ type: 'varchar', length: 50 })
  evento: string; // LOGIN, LOGOUT, FAIL, REFRESH, REUSE_DETECTED

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'ip_address', nullable: true })
  ip_address: string;

  @Column({ nullable: true })
  user_agent: string;

  @Column({ name: 'dispositivo_id', type: 'uuid', nullable: true })
  dispositivo_id: string;

  @Column({ name: 'geo_location', type: 'jsonb', nullable: true })
  geo_location: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'fecha_evento' })
  fecha_evento: Date;
}
