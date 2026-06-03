import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shift } from './entities/shift.entity';

@Injectable()
export class ShiftsService {
  constructor(@InjectRepository(Shift) private repo: Repository<Shift>) {}

  async openShift(cashierId: string, openingCash: number): Promise<Shift> {
    const active = await this.repo.findOne({
      where: { cashier: { id: cashierId }, isClosed: false },
      relations: ['cashier'],
    });
    if (active) return active; // mavjud shiftni davom ettirish

    const shift = this.repo.create({
      cashier: { id: cashierId } as any,
      openedAt: new Date(),
      openingCash,
    });
    return this.repo.save(shift);
  }

  async closeShift(cashierId: string, closingCash: number): Promise<Shift> {
    const shift = await this.repo.findOne({
      where: { cashier: { id: cashierId }, isClosed: false },
    });
    if (!shift) throw new NotFoundException('No open shift found');

    shift.closedAt = new Date();
    shift.closingCash = closingCash;
    shift.isClosed = true;
    return this.repo.save(shift);
  }

  async getActiveShift(cashierId: string): Promise<Shift | null> {
    return this.repo.findOne({
      where: { cashier: { id: cashierId }, isClosed: false },
      relations: ['cashier'],
    });
  }

  findAll(): Promise<Shift[]> {
    return this.repo.find({ relations: ['cashier'], order: { openedAt: 'DESC' }, take: 50 });
  }

  async findOne(id: string): Promise<Shift> {
    const s = await this.repo.findOne({ where: { id }, relations: ['cashier'] });
    if (!s) throw new NotFoundException('Shift not found');
    return s;
  }

  async updateTotals(shiftId: string, amount: number): Promise<void> {
    await this.repo.increment({ id: shiftId }, 'totalSales', amount);
    await this.repo.increment({ id: shiftId }, 'salesCount', 1);
  }
}
