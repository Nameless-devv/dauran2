import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ReportsService {
  constructor(private dataSource: DataSource) {}

  async getDailyReport(date: string) {
    const start = `${date} 00:00:00`;
    const end = `${date} 23:59:59`;

    const [summary] = await this.dataSource.query(`
      SELECT
        COUNT(*) as total_sales,
        COALESCE(SUM(total), 0) as revenue,
        COALESCE(SUM(discount), 0) as total_discount,
        payment_type,
        COUNT(*) FILTER (WHERE status = 'returned') as returns
      FROM sales
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY payment_type
    `, [start, end]);

    const topProducts = await this.dataSource.query(`
      SELECT
        p.name, p.barcode,
        SUM(si.qty) as total_qty,
        SUM(si.total) as total_revenue
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.created_at BETWEEN $1 AND $2 AND s.status != 'returned'
      GROUP BY p.id, p.name, p.barcode
      ORDER BY total_revenue DESC
      LIMIT 20
    `, [start, end]);

    const byPaymentType = await this.dataSource.query(`
      SELECT payment_type, COUNT(*) as count, SUM(total) as total
      FROM sales
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY payment_type
    `, [start, end]);

    const byCashier = await this.dataSource.query(`
      SELECT u.full_name, COUNT(s.id) as count, SUM(s.total) as total
      FROM sales s JOIN users u ON s.cashier_id = u.id
      WHERE s.created_at BETWEEN $1 AND $2
      GROUP BY u.id, u.full_name
    `, [start, end]);

    return { summary, topProducts, byPaymentType, byCashier };
  }

  async getMonthlyReport(year: number, month: number) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = new Date(year, month, 0).toISOString().split('T')[0];

    const dailyRevenue = await this.dataSource.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as sales_count,
        SUM(total) as revenue
      FROM sales
      WHERE created_at BETWEEN $1 AND $2 AND status != 'returned'
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [start + ' 00:00:00', end + ' 23:59:59']);

    const topProducts = await this.dataSource.query(`
      SELECT
        p.name, p.barcode, c.name as category,
        SUM(si.qty) as total_qty,
        SUM(si.total) as total_revenue,
        SUM(si.total) * 100.0 / NULLIF(SUM(SUM(si.total)) OVER (), 0) as revenue_pct
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.created_at BETWEEN $1 AND $2 AND s.status != 'returned'
      GROUP BY p.id, p.name, p.barcode, c.name
      ORDER BY total_revenue DESC
      LIMIT 50
    `, [start + ' 00:00:00', end + ' 23:59:59']);

    return { dailyRevenue, topProducts, period: { start, end } };
  }

  async getAbcAnalysis() {
    return this.dataSource.query(`
      WITH product_revenue AS (
        SELECT
          p.id, p.name, p.barcode,
          SUM(si.total) as revenue
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        JOIN sales s ON si.sale_id = s.id
        WHERE s.status != 'returned' AND s.created_at > NOW() - INTERVAL '30 days'
        GROUP BY p.id, p.name, p.barcode
      ),
      ranked AS (
        SELECT *,
          SUM(revenue) OVER () as total_revenue,
          SUM(revenue) OVER (ORDER BY revenue DESC) as cumulative_revenue,
          ROW_NUMBER() OVER (ORDER BY revenue DESC) as rank
        FROM product_revenue
      )
      SELECT *,
        cumulative_revenue * 100.0 / NULLIF(total_revenue, 0) as cumulative_pct,
        CASE
          WHEN cumulative_revenue * 100.0 / NULLIF(total_revenue, 0) <= 80 THEN 'A'
          WHEN cumulative_revenue * 100.0 / NULLIF(total_revenue, 0) <= 95 THEN 'B'
          ELSE 'C'
        END as abc_class
      FROM ranked
      ORDER BY revenue DESC
    `);
  }

  async getStockReport() {
    return this.dataSource.query(`
      SELECT
        p.name, p.barcode, p.sku,
        c.name as category,
        s.qty, s.min_qty,
        p.cost_price, p.sale_price,
        s.qty * p.cost_price as stock_value,
        CASE WHEN s.qty <= s.min_qty THEN true ELSE false END as is_low
      FROM stock s
      JOIN products p ON s.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
      ORDER BY p.name
    `);
  }
}
