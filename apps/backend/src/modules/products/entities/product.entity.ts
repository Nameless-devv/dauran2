import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  CreateDateColumn, UpdateDateColumn, JoinColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

export enum UnitType {
  PCS = 'pcs',
  KG = 'kg',
  G = 'g',
  L = 'l',
  ML = 'ml',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  barcode: string;

  @Column({ unique: true })
  sku: string;

  @Column()
  name: string;

  @ManyToOne(() => Category, { eager: true, nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ nullable: true })
  brand: string;

  @Column({ type: 'enum', enum: UnitType, default: UnitType.PCS })
  unit: UnitType;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 12 })
  vatRate: number;

  @Column({ default: false })
  isWeighable: boolean;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  costPrice: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  salePrice: number;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
