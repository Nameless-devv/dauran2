import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  phone: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'date' })
  birthdate: Date;

  @Column({ nullable: true, unique: true })
  cardNo: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  bonusBalance: number;

  @Column({ default: 'regular' })
  segment: string;

  @CreateDateColumn()
  createdAt: Date;
}
