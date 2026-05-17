import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  OneToMany, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Shift } from '../../shifts/entities/shift.entity';
import { Product } from '../../products/entities/product.entity';

export enum PaymentType {
  CASH = 'cash',
  CARD = 'card',
  CLICK = 'click',
  PAYME = 'payme',
  MIXED = 'mixed',
}

export enum SaleStatus {
  COMPLETED = 'completed',
  RETURNED = 'returned',
  PARTIAL_RETURN = 'partial_return',
}

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  receiptNo: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'cashier_id' })
  cashier: User;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Shift, { nullable: true })
  @JoinColumn({ name: 'shift_id' })
  shift: Shift;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  total: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  paid: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  change: number;

  @Column({ type: 'enum', enum: PaymentType, default: PaymentType.CASH })
  paymentType: PaymentType;

  @Column({ type: 'enum', enum: SaleStatus, default: SaleStatus.COMPLETED })
  status: SaleStatus;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  bonusUsed: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  bonusEarned: number;

  @OneToMany(() => SaleItem, (item) => item.sale, { cascade: true, eager: true })
  items: SaleItem[];

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Sale, (s) => s.items)
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'decimal', precision: 14, scale: 3 })
  qty: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  total: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 12 })
  vatRate: number;
}
