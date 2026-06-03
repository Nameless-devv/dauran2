import { Injectable } from '@nestjs/common';

@Injectable()
export class ScannerService {
  private pending: string | null = null;
  private lastSentAt = 0;

  setBarcode(barcode: string) {
    const now = Date.now();
    // 1 soniyada bir xil barcodni qayta qabul qilmaslik
    if (barcode === this.pending && now - this.lastSentAt < 1000) return;
    this.pending = barcode;
    this.lastSentAt = now;
  }

  getPending(): string | null {
    const b = this.pending;
    this.pending = null;
    return b;
  }
}
