import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(@InjectRepository(Customer) private repo: Repository<Customer>) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const exists = await this.repo.findOne({ where: { phone: dto.phone } });
    if (exists) throw new ConflictException('Phone number already registered');
    return this.repo.save(this.repo.create(dto));
  }

  findAll(): Promise<Customer[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Customer> {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Customer not found');
    return c;
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    return this.repo.findOne({ where: { phone } });
  }

  async addBonus(id: string, amount: number): Promise<Customer> {
    const c = await this.findOne(id);
    c.bonusBalance = Number(c.bonusBalance) + amount;
    return this.repo.save(c);
  }

  async useBonus(id: string, amount: number): Promise<Customer> {
    const c = await this.findOne(id);
    if (Number(c.bonusBalance) < amount) {
      throw new BadRequestException('Insufficient bonus balance');
    }
    c.bonusBalance = Number(c.bonusBalance) - amount;
    return this.repo.save(c);
  }

  async update(id: string, dto: Partial<CreateCustomerDto>): Promise<Customer> {
    const c = await this.findOne(id);
    Object.assign(c, dto);
    return this.repo.save(c);
  }
}

import { BadRequestException } from '@nestjs/common';
