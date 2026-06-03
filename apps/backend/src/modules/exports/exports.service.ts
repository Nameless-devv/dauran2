import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Response } from 'express';

@Injectable()
export class ExportsService {
  constructor(private dataSource: DataSource) {}

  // ─── Excel: Kunlik hisobot ─────────────────────────────────────────────────
  async exportDailyExcel(date: string, res: Response) {
    const start = `${date} 00:00:00`;
    const end = `${date} 23:59:59`;

    const sales = await this.dataSource.query(`
      SELECT s.receipt_no, u.full_name AS cashier, s.total, s.payment_type,
             s.status, s.created_at, c.name AS customer
      FROM sales s
      JOIN users u ON s.cashier_id = u.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.created_at BETWEEN $1 AND $2
      ORDER BY s.created_at
    `, [start, end]);

    const items = await this.dataSource.query(`
      SELECT p.name AS product, si.qty, si.price, si.total, si.vat_rate,
             s.receipt_no
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.created_at BETWEEN $1 AND $2
    `, [start, end]);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Dauran2';
    wb.created = new Date();

    // Sotuvlar varag'i
    const ws1 = wb.addWorksheet('Sotuvlar');
    ws1.columns = [
      { header: 'Chek №', key: 'receipt_no', width: 22 },
      { header: 'Kassir', key: 'cashier', width: 20 },
      { header: 'Mijoz', key: 'customer', width: 20 },
      { header: 'Summa', key: 'total', width: 14 },
      { header: "To'lov turi", key: 'payment_type', width: 14 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Vaqt', key: 'created_at', width: 20 },
    ];
    ws1.getRow(1).font = { bold: true };
    ws1.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F7' } };

    let totalSum = 0;
    for (const s of sales) {
      ws1.addRow(s);
      totalSum += Number(s.total);
    }
    const lastRow = ws1.lastRow?.number || 2;
    ws1.addRow({ receipt_no: 'JAMI', total: totalSum });
    ws1.getRow(lastRow + 1).font = { bold: true };

    // Mahsulotlar varag'i
    const ws2 = wb.addWorksheet('Mahsulotlar tafsiloti');
    ws2.columns = [
      { header: 'Chek №', key: 'receipt_no', width: 22 },
      { header: 'Mahsulot', key: 'product', width: 30 },
      { header: 'Miqdor', key: 'qty', width: 10 },
      { header: 'Narx', key: 'price', width: 14 },
      { header: "QQS %", key: 'vat_rate', width: 8 },
      { header: 'Jami', key: 'total', width: 14 },
    ];
    ws2.getRow(1).font = { bold: true };
    ws2.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F7' } };
    for (const i of items) ws2.addRow(i);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="hisobot-${date}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  }

  // ─── Excel: Ombor qoldiqlari ───────────────────────────────────────────────
  async exportStockExcel(res: Response) {
    const rows = await this.dataSource.query(`
      SELECT p.name, p.barcode, p.sku, c.name AS category,
             p.unit, s.qty, s.min_qty, p.cost_price, p.sale_price,
             s.qty * p.cost_price AS stock_value,
             CASE WHEN s.qty <= s.min_qty THEN 'HA' ELSE '' END AS is_low
      FROM stock s
      JOIN products p ON s.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
      ORDER BY p.name
    `);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Ombor qoldiqlari');
    ws.columns = [
      { header: 'Mahsulot', key: 'name', width: 30 },
      { header: 'Shtrix-kod', key: 'barcode', width: 18 },
      { header: 'SKU', key: 'sku', width: 14 },
      { header: 'Kategoriya', key: 'category', width: 18 },
      { header: 'Birligi', key: 'unit', width: 8 },
      { header: 'Qoldiq', key: 'qty', width: 10 },
      { header: 'Min. qoldiq', key: 'min_qty', width: 12 },
      { header: 'Kirim narxi', key: 'cost_price', width: 14 },
      { header: 'Sotuv narxi', key: 'sale_price', width: 14 },
      { header: 'Qiymati', key: 'stock_value', width: 16 },
      { header: 'Kam?', key: 'is_low', width: 8 },
    ];

    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F7' } };

    for (const r of rows) {
      const row = ws.addRow(r);
      if (r.is_low === 'HA') {
        row.getCell('is_low').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCCCC' } };
        row.getCell('qty').font = { color: { argb: 'FFCC0000' }, bold: true };
      }
    }

    const totalValue = rows.reduce((s: number, r: any) => s + Number(r.stock_value), 0);
    const lastRow = ws.lastRow?.number || 2;
    ws.addRow({ name: 'JAMI QIYMAT', stock_value: totalValue });
    ws.getRow(lastRow + 1).font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="ombor-${new Date().toISOString().split('T')[0]}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  }

  // ─── Excel: Oylik hisobot ──────────────────────────────────────────────────
  async exportMonthlyExcel(year: number, month: number, res: Response) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = new Date(year, month, 0).toISOString().split('T')[0];

    const daily = await this.dataSource.query(`
      SELECT DATE(created_at) AS sana,
             COUNT(*) AS sotuvlar,
             SUM(total) AS tushum,
             SUM(CASE WHEN status='returned' THEN total ELSE 0 END) AS qaytarishlar
      FROM sales
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY DATE(created_at)
      ORDER BY sana
    `, [start + ' 00:00:00', end + ' 23:59:59']);

    const topProducts = await this.dataSource.query(`
      SELECT p.name, p.barcode, SUM(si.qty) AS qty, SUM(si.total) AS daromad
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.created_at BETWEEN $1 AND $2 AND s.status != 'returned'
      GROUP BY p.id, p.name, p.barcode
      ORDER BY daromad DESC
      LIMIT 50
    `, [start + ' 00:00:00', end + ' 23:59:59']);

    const wb = new ExcelJS.Workbook();

    const ws1 = wb.addWorksheet('Kunlik');
    ws1.columns = [
      { header: 'Sana', key: 'sana', width: 14 },
      { header: 'Sotuvlar', key: 'sotuvlar', width: 12 },
      { header: 'Tushum', key: 'tushum', width: 18 },
      { header: 'Qaytarishlar', key: 'qaytarishlar', width: 16 },
    ];
    ws1.getRow(1).font = { bold: true };
    ws1.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F7' } };
    for (const r of daily) ws1.addRow(r);

    const ws2 = wb.addWorksheet('Top mahsulotlar');
    ws2.columns = [
      { header: 'Mahsulot', key: 'name', width: 30 },
      { header: 'Shtrix-kod', key: 'barcode', width: 18 },
      { header: 'Miqdor', key: 'qty', width: 12 },
      { header: 'Daromad', key: 'daromad', width: 18 },
    ];
    ws2.getRow(1).font = { bold: true };
    ws2.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F7' } };
    for (const r of topProducts) ws2.addRow(r);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="oylik-${year}-${month}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  }

  // ─── PDF: Chek (savdo kvitansiyasi) ───────────────────────────────────────
  async exportReceiptPdf(saleId: string, res: Response) {
    const [sale] = await this.dataSource.query(`
      SELECT s.*, u.full_name AS cashier_name, c.name AS customer_name, c.phone AS customer_phone
      FROM sales s
      JOIN users u ON s.cashier_id = u.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.id = $1
    `, [saleId]);

    if (!sale) { res.status(404).json({ message: 'Sale not found' }); return; }

    const items = await this.dataSource.query(`
      SELECT si.qty, si.price, si.discount, si.total, si.vat_rate, p.name
      FROM sale_items si JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = $1
    `, [saleId]);

    const doc = new PDFDocument({ size: [226, 800], margin: 10 }); // 80mm chek
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="chek-${sale.receipt_no}.pdf"`);
    doc.pipe(res);

    const center = { align: 'center' as const };
    const line = () => doc.moveDown(0.3).text('─'.repeat(32), center).moveDown(0.3);

    doc.fontSize(12).font('Helvetica-Bold').text('DAURAN DOKON', center);
    doc.fontSize(8).font('Helvetica').text('Oziq-ovqat va kundalik tovarlar', center);
    line();

    doc.fontSize(8).text(`Chek: ${sale.receipt_no}`);
    doc.text(`Sana: ${new Date(sale.created_at).toLocaleString('uz-UZ')}`);
    doc.text(`Kassir: ${sale.cashier_name}`);
    if (sale.customer_name) doc.text(`Mijoz: ${sale.customer_name}`);
    line();

    for (const item of items) {
      doc.font('Helvetica-Bold').text(item.name, { width: 206 });
      doc.font('Helvetica').text(
        `  ${item.qty} x ${Number(item.price).toLocaleString()} = ${Number(item.total).toLocaleString()} so'm`
      );
      if (Number(item.vat_rate) > 0) {
        const vat = (Number(item.total) * Number(item.vat_rate)) / (100 + Number(item.vat_rate));
        doc.text(`  QQS ${item.vat_rate}%: ${vat.toFixed(0)} so'm`);
      }
    }
    line();

    if (Number(sale.discount) > 0)
      doc.text(`Chegirma: -${Number(sale.discount).toLocaleString()} so'm`);
    if (Number(sale.bonus_used) > 0)
      doc.text(`Bonus: -${Number(sale.bonus_used).toLocaleString()} so'm`);

    doc.font('Helvetica-Bold').fontSize(10).text(
      `JAMI: ${Number(sale.total).toLocaleString()} so'm`, center
    );
    doc.font('Helvetica').fontSize(8).text(
      `To'landi: ${Number(sale.paid).toLocaleString()} so'm (${sale.payment_type.toUpperCase()})`
    );
    if (Number(sale.change) > 0)
      doc.text(`Qaytim: ${Number(sale.change).toLocaleString()} so'm`);
    if (Number(sale.bonus_earned) > 0)
      doc.text(`Bonus to'plandi: +${Number(sale.bonus_earned).toLocaleString()}`);

    line();
    doc.fontSize(7).font('Helvetica').text('Xaridingiz uchun rahmat!', center);
    doc.text(new Date().toLocaleDateString('uz-UZ'), center);

    doc.end();
  }
}
