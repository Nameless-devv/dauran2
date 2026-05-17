import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(@InjectRepository(Supplier) private repo: Repository<Supplier>) {}

  create(dto: CreateSupplierDto): Promise<Supplier> {
    return this.repo.save(this.repo.create(dto));
  }

  findAll(): Promise<Supplier[]> {
    return this.repo.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Supplier> {
    const s = await this.repo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Supplier not found');
    return s;
  }

  async update(id: string, dto: Partial<CreateSupplierDto>): Promise<Supplier> {
    const s = await this.findOne(id);
    Object.assign(s, dto);
    return this.repo.save(s);
  }
}
