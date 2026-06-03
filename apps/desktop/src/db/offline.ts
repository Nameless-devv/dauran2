// Electron kontekstda window.electronAPI orqali SQLite ga murojaat
// Browser kontekstda (Vite dev) mock qaytaradi

const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

export const offlineDb = {
  query: async (sql: string, params?: any[]): Promise<any[]> => {
    if (isElectron) return (window as any).electronAPI.db.query(sql, params);
    return [];
  },
  get: async (sql: string, params?: any[]): Promise<any> => {
    if (isElectron) return (window as any).electronAPI.db.get(sql, params);
    return null;
  },
};

export async function searchProductByBarcode(barcode: string) {
  return offlineDb.get('SELECT * FROM products WHERE barcode = ?', [barcode]);
}

export async function searchProductsByName(name: string) {
  return offlineDb.query(
    `SELECT * FROM products WHERE name LIKE ? ORDER BY name LIMIT 20`,
    [`%${name}%`]
  );
}

export async function getAllProducts() {
  return offlineDb.query('SELECT * FROM products ORDER BY name', []);
}

export async function getCustomerByPhone(phone: string) {
  return offlineDb.get('SELECT * FROM customers WHERE phone = ?', [phone]);
}

export function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function generateReceiptNo(): string {
  const now = new Date();
  return `R${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Date.now().toString(36).toUpperCase()}`;
}

export async function saveSaleOffline(sale: any, items: any[]): Promise<string> {
  const saleId = generateLocalId();
  const receiptNo = generateReceiptNo();

  await offlineDb.query(
    `INSERT INTO sales (id, receipt_no, shift_id, cashier_id, customer_id, customer_phone,
      subtotal, discount, total, paid, change_amount, payment_type, bonus_used, bonus_earned,
      status, created_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 0)`,
    [
      saleId, receiptNo, sale.shiftId, sale.cashierId, sale.customerId || null,
      sale.customerPhone || null, sale.subtotal, sale.discount, sale.total,
      sale.paid, sale.change, sale.paymentType, sale.bonusUsed, sale.bonusEarned,
      'completed',
    ]
  );

  for (const item of items) {
    const itemId = generateLocalId();
    await offlineDb.query(
      `INSERT INTO sale_items (id, sale_id, product_id, product_name, qty, price, discount, total, vat_rate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [itemId, saleId, item.productId, item.name, item.qty, item.price, item.discount, item.total, item.vatRate]
    );

    // Lokal qoldiqni kamaytirish
    await offlineDb.query(
      'UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?',
      [item.qty, item.productId]
    );
  }

  return receiptNo;
}
