import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';

import { Dispositivo } from './dispositivo.entity';
import { Usuario } from './usuario.entity';

@Entity('auth_refresh_tokens')
export class AuthRefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Usuario, { eager: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Dispositivo, { eager: false, nullable: true })
  @JoinColumn({ name: 'dispositivo_id' })
  dispositivo: Dispositivo;

  @Column('text')
  token_hash: string;

  @Column({ name: 'fecha_expiracion', type: 'timestamptz' })
  fechaExpiracion: Date;

  @Column({ default: false })
  revocado: boolean;

  @Column({ name: 'revocado_razon', nullable: true })
  revocadoRazon: string;

  @Column({ name: 'ip_creacion', type: 'inet', nullable: true })
  ipCreacion: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @Column({ name: 'replaced_by_token', nullable: true })
  replacedByToken: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
