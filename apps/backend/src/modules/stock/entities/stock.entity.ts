import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, UpdateDateColumn, Unique,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('stock')
@Unique(['product'])
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  qty: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  minQty: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
