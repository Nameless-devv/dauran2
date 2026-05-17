import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT)
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('daily')
  daily(@Query('date') date: string) {
    return this.service.getDailyReport(date || new Date().toISOString().split('T')[0]);
  }

  @Get('monthly')
  monthly(@Query('year') year: string, @Query('month') month: string) {
    const now = new Date();
    return this.service.getMonthlyReport(
      Number(year) || now.getFullYear(),
      Number(month) || now.getMonth() + 1,
    );
  }

  @Get('abc')
  abc() {
    return this.service.getAbcAnalysis();
  }

  @Get('stock')
  stock() {
    return this.service.getStockReport();
  }
}
