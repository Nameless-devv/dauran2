import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('shifts')
export class Shift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'cashier_id' })
  cashier: User;

  @Column({ type: 'timestamp' })
  openedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  openingCash: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  closingCash: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalSales: number;

  @Column({ type: 'int', default: 0 })
  salesCount: number;

  @Column({ default: false })
  isClosed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
