const axios = require('axios');

class SyncService {
  constructor(db, mainWindow) {
    this.db = db;
    this.mainWindow = mainWindow;
    this.baseUrl = null;
    this.token = null;
    this.isSyncing = false;
    this.syncInterval = null;
  }

  configure(baseUrl, token) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  get api() {
    return axios.create({
      baseURL: this.baseUrl,
      headers: { Authorization: `Bearer ${this.token}` },
      timeout: 15000,
    });
  }

  // Serverni tekshirish
  async isOnline() {
    if (!this.baseUrl) return false;
    try {
      await this.api.get('/auth/me');
      return true;
    } catch {
      return false;
    }
  }

  // Serverdan mahsulotlarni yuklab olish
  async pullProducts() {
    const { data: products } = await this.api.get('/products');
    const { data: stocks } = await this.api.get('/stock');

    const stockMap = {};
    for (const s of stocks) {
      stockMap[s.product?.id] = Number(s.qty);
    }

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO products
        (id, barcode, sku, name, category_name, unit, sale_price, cost_price, vat_rate, is_weighable, stock_qty, synced_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    const insertMany = this.db.transaction((prods) => {
      for (const p of prods) {
        stmt.run(
          p.id, p.barcode, p.sku, p.name,
          p.category?.name || '',
          p.unit, Number(p.salePrice), Number(p.costPrice),
          Number(p.vatRate), p.isWeighable ? 1 : 0,
          stockMap[p.id] || 0,
        );
      }
    });

    insertMany(products);
    this.notify('pull', `${products.length} mahsulot yangilandi`);
    return products.length;
  }

  // Serverdan mijozlarni yuklab olish
  async pullCustomers() {
    const { data: customers } = await this.api.get('/customers');
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO customers (id, phone, name, bonus_balance, card_no, synced_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `);
    const insertMany = this.db.transaction((items) => {
      for (const c of items) {
        stmt.run(c.id, c.phone, c.name, Number(c.bonusBalance), c.cardNo || null);
      }
    });
    insertMany(customers);
    return customers.length;
  }

  // Yuborilmagan sotuvlarni serverga jo'natish
  async pushPendingSales() {
    const unsyncedSales = this.db.prepare(
      `SELECT * FROM sales WHERE synced = 0 ORDER BY created_at`
    ).all();

    let pushed = 0;

    for (const sale of unsyncedSales) {
      const items = this.db.prepare(
        `SELECT * FROM sale_items WHERE sale_id = ?`
      ).all(sale.id);

      try {
        const payload = {
          items: items.map((i) => ({
            productId: i.product_id,
            qty: i.qty,
            price: i.price,
            discount: i.discount,
          })),
          paymentType: sale.payment_type,
          paid: sale.paid,
          discount: sale.discount,
          customerId: sale.customer_id || undefined,
          shiftId: sale.shift_id || undefined,
          bonusUsed: sale.bonus_used,
        };

        const { data } = await this.api.post('/sales', payload);
        this.db.prepare(`UPDATE sales SET synced = 1, server_id = ? WHERE id = ?`)
          .run(data.id, sale.id);
        pushed++;
      } catch (err) {
        this.db.prepare(`
          UPDATE sync_queue SET attempts = attempts + 1, last_error = ?
          WHERE entity = 'sale' AND entity_id = ?
        `).run(err.message, sale.id);
      }
    }

    if (pushed > 0) this.notify('push', `${pushed} sotuv serverga yuborildi`);
    return pushed;
  }

  // To'liq sinxronizatsiya
  async syncAll() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    this.notify('start', 'Sinxronizatsiya boshlanmoqda...');

    try {
      const online = await this.isOnline();
      if (!online) {
        this.notify('offline', 'Server bilan aloqa yo\'q — offline rejim');
        return;
      }

      await this.pullProducts();
      await this.pullCustomers();
      await this.pushPendingSales();
      this.notify('done', 'Sinxronizatsiya tugadi');
    } catch (err) {
      this.notify('error', `Xato: ${err.message}`);
    } finally {
      this.isSyncing = false;
    }
  }

  // Avtomatik sinxronizatsiya (har 5 daqiqada)
  startAutoSync(intervalMs = 5 * 60 * 1000) {
    this.syncAll();
    this.syncInterval = setInterval(() => this.syncAll(), intervalMs);
  }

  stopAutoSync() {
    if (this.syncInterval) clearInterval(this.syncInterval);
  }

  notify(type, message) {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('sync:status', { type, message, time: new Date() });
    }
    console.log(`[SYNC ${type.toUpperCase()}] ${message}`);
  }
}

module.exports = { SyncService };
