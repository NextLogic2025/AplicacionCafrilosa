import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('listas_precios')
export class ListaPrecio {
  @PrimaryGeneratedColumn()
  id: number; // 1=General, 2=Mayorista, 3=Horeca

  @Column()
  nombre: string;
}
