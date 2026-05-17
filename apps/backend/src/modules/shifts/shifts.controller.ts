import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsNumber } from 'class-validator';

class OpenShiftDto {
  @IsNumber()
  openingCash: number;
}

class CloseShiftDto {
  @IsNumber()
  closingCash: number;
}

@UseGuards(JwtAuthGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly service: ShiftsService) {}

  @Post('open')
  open(@Body() dto: OpenShiftDto, @CurrentUser() user: any) {
    return this.service.openShift(user.id, dto.openingCash);
  }

  @Post('close')
  close(@Body() dto: CloseShiftDto, @CurrentUser() user: any) {
    return this.service.closeShift(user.id, dto.closingCash);
  }

  @Get('active')
  getActive(@CurrentUser() user: any) {
    return this.service.getActiveShift(user.id);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
