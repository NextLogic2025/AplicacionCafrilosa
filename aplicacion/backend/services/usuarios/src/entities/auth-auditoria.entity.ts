import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('auth_auditoria')
export class AuthAuditoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, type: 'uuid' })
  usuario_id: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  evento: string; // LOGIN, LOGOUT, FAIL, REFRESH

  @Column({ nullable: true })
  ip: string;

  @Column({ nullable: true })
  user_agent: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'fecha' })
  fecha: Date;
}
