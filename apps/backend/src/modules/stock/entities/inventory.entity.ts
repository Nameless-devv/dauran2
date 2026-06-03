import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  OneToMany, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

export enum InventoryStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Entity('inventories')
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: InventoryStatus, default: InventoryStatus.DRAFT })
  status: InventoryStatus;

  @Column({ nullable: true })
  note: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @OneToMany(() => InventoryItem, (i) => i.inventory, { cascade: true })
  items: InventoryItem[];

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  totalDifference: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;
}

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Inventory, (i) => i.items)
  @JoinColumn({ name: 'inventory_id' })
  inventory: Inventory;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'decimal', precision: 14, scale: 3 })
  systemQty: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, nullable: true })
  actualQty: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, nullable: true })
  difference: number;

  @Column({ nullable: true })
  note: string;
}
