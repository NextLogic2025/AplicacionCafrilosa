import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('auth_tokens')
export class AuthToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Usuario, { eager: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column('text')
  token_hash: string;

  @Column({ type: 'varchar', length: 20 })
  tipo: 'access' | 'refresh';

  @Column({ type: 'timestamptz' })
  expiracion: Date;

  @Column({ default: false })
  revocado: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
