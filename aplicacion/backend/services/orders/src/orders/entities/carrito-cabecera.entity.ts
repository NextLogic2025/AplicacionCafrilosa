import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('carritos_cabecera')
export class CarritoCabecera {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  usuario_id: string;

  @Column({ type: 'uuid', nullable: true })
  cliente_id: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  total_estimado: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}
