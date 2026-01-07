import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

import { Usuario } from './usuario.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @OneToMany(() => Usuario, (usuario) => usuario.rol)
  usuarios: Usuario[];
}
