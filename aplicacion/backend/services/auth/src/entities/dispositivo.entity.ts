import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';

import { Usuario } from './usuario.entity';

@Entity('dispositivos_usuarios')
export class Dispositivo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Usuario)
  usuario: Usuario;

  @Column({ name: 'device_id' })
  device_id: string;

  @Column({ name: 'nombre_dispositivo', nullable: true })
  nombreDispositivo: string;

  @Column({ name: 'tipo_plataforma', nullable: true })
  tipoPlataforma: string;

  @Column({ name: 'token_push__fcm', nullable: true })
  tokenPushFcm: string;

  @Column({ name: 'app_version', nullable: true })
  appVersion: string;

  @Column({ name: 'ultimo_acceso', type: 'timestamptz', nullable: true })
  ultimoAcceso: Date;

  @Column({ name: 'is_trusted', default: true })
  isTrusted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
