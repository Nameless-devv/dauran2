import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

// Payme Business API (JSON-RPC 2.0): https://developer.help.paycom.uz
@Injectable()
export class PaymeService {
  private readonly logger = new Logger(PaymeService.name);
  private readonly merchantId: string;
  private readonly secretKey: string;
  private readonly testMode: boolean;

  constructor(config: ConfigService) {
    this.merchantId = config.get('PAYME_MERCHANT_ID', '');
    this.secretKey = config.get('PAYME_SECRET_KEY', '');
    this.testMode = config.get('NODE_ENV') !== 'production';
  }

  private verifyBasicAuth(authHeader: string) {
    const base64 = authHeader.replace('Basic ', '');
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    const [login, password] = decoded.split(':');
    if (login !== 'Paycom' || password !== this.secretKey) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async handleRequest(body: any, authHeader: string) {
    if (this.merchantId && this.secretKey) {
      this.verifyBasicAuth(authHeader);
    }

    const { method, params, id } = body;
    this.logger.log(`Payme ${method}: ${JSON.stringify(params)}`);

    const handlers: Record<string, () => Promise<any>> = {
      CheckPerformTransaction: () => this.checkPerformTransaction(params),
      CreateTransaction: () => this.createTransaction(params),
      PerformTransaction: () => this.performTransaction(params),
      CancelTransaction: () => this.cancelTransaction(params),
      CheckTransaction: () => this.checkTransaction(params),
      GetStatement: () => this.getStatement(params),
    };

    const handler = handlers[method];
    if (!handler) {
      return { id, error: { code: -32601, message: { ru: 'Метод не найден' } } };
    }

    try {
      const result = await handler();
      return { id, result };
    } catch (err: any) {
      return { id, error: err };
    }
  }

  private async checkPerformTransaction(params: any) {
    const { amount, account } = params;
    const { order_id } = account;
    // DB dan tekshirish: order_id mavjudmi, summa to'g'rimi
    this.logger.log(`CheckPerform: order=${order_id}, amount=${amount}`);
    return { allow: true };
  }

  private async createTransaction(params: any) {
    const { id, time, amount, account } = params;
    // DB ga tranzaksiya yozish
    this.logger.log(`CreateTransaction: ${id}`);
    return {
      create_time: time,
      transaction: id,
      state: 1,
    };
  }

  private async performTransaction(params: any) {
    const { id } = params;
    this.logger.log(`PerformTransaction: ${id}`);
    // Sale ni to'langan deb belgilash
    return {
      transaction: id,
      perform_time: Date.now(),
      state: 2,
    };
  }

  private async cancelTransaction(params: any) {
    const { id, reason } = params;
    this.logger.log(`CancelTransaction: ${id}, reason=${reason}`);
    return {
      transaction: id,
      cancel_time: Date.now(),
      state: -1,
    };
  }

  private async checkTransaction(params: any) {
    const { id } = params;
    return {
      create_time: Date.now(),
      perform_time: 0,
      cancel_time: 0,
      transaction: id,
      state: 1,
      reason: null,
    };
  }

  private async getStatement(params: any) {
    const { from, to } = params;
    return { transactions: [] };
  }

  // QR kod URL yaratish
  generateQrUrl(orderId: string, amount: number): string {
    const amountTiyin = Math.round(amount * 100);
    if (!this.merchantId) {
      return `https://checkout.paycom.uz/DEMO?amount=${amountTiyin}&order_id=${orderId}`;
    }
    const params = Buffer.from(`m=${this.merchantId};ac.order_id=${orderId};a=${amountTiyin}`).toString('base64');
    return `https://checkout.paycom.uz/${params}`;
  }
}
