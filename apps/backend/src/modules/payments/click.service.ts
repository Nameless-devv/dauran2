import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

// Click Merchant API: https://docs.click.uz/click-api-request
@Injectable()
export class ClickService {
  private readonly logger = new Logger(ClickService.name);
  private readonly serviceId: string;
  private readonly merchantId: string;
  private readonly secretKey: string;

  constructor(config: ConfigService) {
    this.serviceId = config.get('CLICK_SERVICE_ID', '');
    this.merchantId = config.get('CLICK_MERCHANT_ID', '');
    this.secretKey = config.get('CLICK_SECRET_KEY', '');
  }

  // Click → bizga keladi: to'lov tekshiruvi
  async handlePrepare(body: any) {
    const { click_trans_id, service_id, click_paydoc_id, merchant_trans_id,
            amount, action, sign_time, sign_string } = body;

    const expectedSign = crypto.createHash('md5').update(
      `${click_trans_id}${service_id}${this.secretKey}${merchant_trans_id}${amount}${action}${sign_time}`
    ).digest('hex');

    if (expectedSign !== sign_string) {
      throw new UnauthorizedException('Invalid sign');
    }

    // merchant_trans_id = bizning sale.id yoki order_id
    // Haqiqiy implementatsiyada DB dan tekshirish kerak
    this.logger.log(`Click PREPARE: ${merchant_trans_id}, amount=${amount}`);

    return {
      click_trans_id,
      merchant_trans_id,
      merchant_prepare_id: merchant_trans_id,
      error: 0,
      error_note: 'Success',
    };
  }

  // Click → bizga keladi: to'lov tasdiqlash
  async handleComplete(body: any) {
    const { click_trans_id, service_id, click_paydoc_id, merchant_trans_id,
            merchant_prepare_id, amount, action, sign_time, sign_string, error } = body;

    const expectedSign = crypto.createHash('md5').update(
      `${click_trans_id}${service_id}${this.secretKey}${merchant_trans_id}${merchant_prepare_id}${amount}${action}${sign_time}`
    ).digest('hex');

    if (expectedSign !== sign_string) {
      throw new UnauthorizedException('Invalid sign');
    }

    if (error < 0) {
      this.logger.warn(`Click to'lov bekor: ${merchant_trans_id}, error=${error}`);
      return { click_trans_id, merchant_trans_id, error: 0, error_note: 'Success' };
    }

    this.logger.log(`Click COMPLETE: ${merchant_trans_id}, amount=${amount}`);
    // Bu yerda sale.paymentType = 'click', sale.status = 'completed' deb yangilash kerak

    return {
      click_trans_id,
      merchant_trans_id,
      merchant_confirm_id: click_trans_id,
      error: 0,
      error_note: 'Success',
    };
  }

  // QR kod URL yaratish (mijozga ko'rsatish uchun)
  generateQrUrl(orderId: string, amount: number): string {
    if (!this.serviceId || !this.merchantId) {
      return `https://my.click.uz/services/pay?service_id=DEMO&merchant_id=DEMO&amount=${amount}&transaction_param=${orderId}`;
    }
    return `https://my.click.uz/services/pay?service_id=${this.serviceId}&merchant_id=${this.merchantId}&amount=${amount}&transaction_param=${orderId}`;
  }
}
