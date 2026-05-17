import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  OneToMany, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

export enum PurchaseStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  RECEIVED = 'received',
}

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ type: 'enum', enum: PurchaseStatus, default: PurchaseStatus.DRAFT })
  status: PurchaseStatus;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  total: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => PurchaseItem, (item) => item.order, { cascade: true, eager: true })
  items: PurchaseItem[];

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('purchase_items')
export class PurchaseItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PurchaseOrder, (o) => o.items)
  @JoinColumn({ name: 'order_id' })
  order: PurchaseOrder;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'decimal', precision: 14, scale: 3 })
  qty: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  costPrice: number;

  @Column({ nullable: true, type: 'date' })
  expiryDate: Date;
}
