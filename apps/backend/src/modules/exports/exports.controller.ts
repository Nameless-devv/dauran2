import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExportsService } from './exports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exports')
export class ExportsController {
  constructor(private readonly service: ExportsService) {}

  @Get('daily/excel')
  @Roles(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT)
  dailyExcel(@Query('date') date: string, @Res() res: Response) {
    const d = date || new Date().toISOString().split('T')[0];
    return this.service.exportDailyExcel(d, res);
  }

  @Get('monthly/excel')
  @Roles(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT)
  monthlyExcel(
    @Query('year') year: string,
    @Query('month') month: string,
    @Res() res: Response,
  ) {
    const now = new Date();
    return this.service.exportMonthlyExcel(
      Number(year) || now.getFullYear(),
      Number(month) || now.getMonth() + 1,
      res,
    );
  }

  @Get('stock/excel')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STOREKEEPER, Role.ACCOUNTANT)
  stockExcel(@Res() res: Response) {
    return this.service.exportStockExcel(res);
  }

  @Get('receipt/:saleId/pdf')
  receiptPdf(@Param('saleId') saleId: string, @Res() res: Response) {
    return this.service.exportReceiptPdf(saleId, res);
  }
}
