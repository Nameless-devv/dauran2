import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface OfdReceiptItem {
  name: string;
  barcode?: string;
  qty: number;
  price: number;
  vatRate: number;
  total: number;
}

export interface OfdReceipt {
  receiptNo: string;
  cashierId: string;
  terminalId: string;
  items: OfdReceiptItem[];
  total: number;
  paymentType: 'cash' | 'card' | 'mobile';
  paid: number;
  change: number;
  timestamp: Date;
}

export interface OfdResult {
  success: boolean;
  fiscalSign?: string;
  fiscalId?: string;
  qrCode?: string;
  error?: string;
}

/**
 * O'zbekiston Davlat Soliq Qo'mitasi OFD integratsiyasi.
 *
 * Real integratsiya uchun soliq.uz dan ruxsatnoma va
 * fiskal modul (kassoviy apparat) sertifikati kerak.
 *
 * Hujjatlar: https://soliq.uz → "Elektron hizmatlar" → "Online kassa"
 * Test muhit: mavjud emas (faqat sertifikatlangan qurilmalar orqali)
 */
@Injectable()
export class OfdService {
  private readonly logger = new Logger(OfdService.name);
  private readonly enabled: boolean;
  private readonly ofdUrl: string;
  private readonly token: string;
  private readonly terminalId: string;

  constructor(private config: ConfigService) {
    this.ofdUrl = config.get('OFD_URL', '');
    this.token = config.get('OFD_TOKEN', '');
    this.terminalId = config.get('OFD_TERMINAL_ID', '');
    this.enabled = !!(this.ofdUrl && this.token && this.terminalId);

    if (!this.enabled) {
      this.logger.warn('OFD disabled — OFD_URL, OFD_TOKEN, OFD_TERMINAL_ID sozlanmagan');
    }
  }

  // Fiskal chek yuborish
  async sendReceipt(receipt: OfdReceipt): Promise<OfdResult> {
    if (!this.enabled) {
      this.logger.warn(`OFD mock: chek ${receipt.receiptNo} yuborilmadi (test rejim)`);
      return {
        success: true,
        fiscalSign: 'MOCK_' + Date.now(),
        fiscalId: receipt.receiptNo,
        qrCode: `https://ofd.soliq.uz/check?id=${receipt.receiptNo}`,
      };
    }

    try {
      const payload = this.buildPayload(receipt);
      const { data } = await axios.post(`${this.ofdUrl}/receipt`, payload, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      return {
        success: true,
        fiscalSign: data.fiscalSign,
        fiscalId: data.fiscalId,
        qrCode: data.qrCode,
      };
    } catch (err: any) {
      this.logger.error(`OFD xato: ${err.message}`, err.response?.data);
      return {
        success: false,
        error: err.message,
      };
    }
  }

  // Qaytarish cheki
  async sendReturn(originalFiscalId: string, receipt: OfdReceipt): Promise<OfdResult> {
    if (!this.enabled) {
      return { success: true, fiscalSign: 'RETURN_MOCK_' + Date.now() };
    }

    try {
      const payload = { ...this.buildPayload(receipt), type: 'RETURN', originalId: originalFiscalId };
      const { data } = await axios.post(`${this.ofdUrl}/receipt/return`, payload, {
        headers: { Authorization: `Bearer ${this.token}` },
        timeout: 10000,
      });
      return { success: true, fiscalSign: data.fiscalSign, fiscalId: data.fiscalId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  private buildPayload(r: OfdReceipt) {
    const PAYMENT_TYPE_MAP = { cash: 1, card: 2, mobile: 3 };
    return {
      terminalId: this.terminalId,
      receiptNo: r.receiptNo,
      datetime: r.timestamp.toISOString(),
      paymentType: PAYMENT_TYPE_MAP[r.paymentType] || 1,
      total: Math.round(r.total * 100),
      paid: Math.round(r.paid * 100),
      change: Math.round(r.change * 100),
      items: r.items.map((item) => ({
        name: item.name,
        barcode: item.barcode || '',
        count: item.qty,
        price: Math.round(item.price * 100),
        total: Math.round(item.total * 100),
        vatRate: item.vatRate,
        vat: Math.round((item.total * item.vatRate) / (100 + item.vatRate) * 100),
      })),
    };
  }
}
