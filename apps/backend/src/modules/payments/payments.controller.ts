import { Controller, Post, Body, Headers, Get, Query } from '@nestjs/common';
import { ClickService } from './click.service';
import { PaymeService } from './payme.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private clickService: ClickService,
    private paymeService: PaymeService,
  ) {}

  // Click callback endpointlari (Click serveridan keladi)
  @Post('click/prepare')
  clickPrepare(@Body() body: any) {
    return this.clickService.handlePrepare(body);
  }

  @Post('click/complete')
  clickComplete(@Body() body: any) {
    return this.clickService.handleComplete(body);
  }

  // QR URL yaratish (kassa app ga kerak)
  @Get('click/qr')
  clickQr(@Query('orderId') orderId: string, @Query('amount') amount: string) {
    return { url: this.clickService.generateQrUrl(orderId, Number(amount)) };
  }

  // Payme JSON-RPC endpoint
  @Post('payme')
  payme(@Body() body: any, @Headers('authorization') auth: string) {
    return this.paymeService.handleRequest(body, auth || '');
  }

  @Get('payme/qr')
  paymeQr(@Query('orderId') orderId: string, @Query('amount') amount: string) {
    return { url: this.paymeService.generateQrUrl(orderId, Number(amount)) };
  }
}
