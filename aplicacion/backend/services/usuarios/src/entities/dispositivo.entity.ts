import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, UpdateDateColumn } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('dispositivos_usuarios')
export class Dispositivo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Usuario)
  usuario: Usuario;

  @Column({ nullable: true })
  device_id: string;

  @Column({ nullable: true })
  token_push: string;

  @Column({ nullable: true })
  ip_registro: string;

  @UpdateDateColumn({ name: 'last_login' })
  lastLogin: Date;
}
