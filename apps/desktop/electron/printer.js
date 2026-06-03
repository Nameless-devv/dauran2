/**
 * ESC/POS termal printer.
 * USB HID orqali ulangan 58mm yoki 80mm termal printerlar uchun.
 *
 * O'rnatish: pnpm add escpos escpos-usb (native node module kerak)
 * Hozircha: chek matnini konsolga chiqaradi (mock).
 * Haqiqiy integratsiya uchun printer modeliga qarab driver kerak.
 */

function formatLine(left, right, width = 32) {
  const space = width - left.length - right.length;
  return left + ' '.repeat(Math.max(1, space)) + right;
}

function printReceipt(data) {
  const {
    shopName = 'DAURAN DOKON',
    receiptNo, cashier, customer,
    items, subtotal, discount, bonusUsed,
    total, paid, change, paymentType,
    bonusEarned, createdAt,
  } = data;

  const lines = [
    '================================',
    shopName.padStart((32 + shopName.length) / 2),
    '================================',
    `Chek: ${receiptNo}`,
    `Sana: ${new Date(createdAt).toLocaleString('uz-UZ')}`,
    `Kassir: ${cashier}`,
    customer ? `Mijoz: ${customer}` : '',
    '--------------------------------',
  ];

  for (const item of items) {
    lines.push(item.name);
    const qtyStr = `${item.qty} x ${item.price.toLocaleString()}`;
    const totalStr = `${item.total.toLocaleString()} so'm`;
    lines.push('  ' + formatLine(qtyStr, totalStr, 30));
  }

  lines.push('--------------------------------');
  if (discount > 0) lines.push(formatLine('Chegirma:', `-${discount.toLocaleString()} so'm`));
  if (bonusUsed > 0) lines.push(formatLine('Bonus:', `-${bonusUsed.toLocaleString()}`));
  lines.push(formatLine('JAMI:', `${total.toLocaleString()} so'm`));
  lines.push(formatLine("To'landi:", `${paid.toLocaleString()} so'm`));
  lines.push(formatLine("To'lov:", paymentType.toUpperCase()));
  if (change > 0) lines.push(formatLine('Qaytim:', `${change.toLocaleString()} so'm`));
  if (bonusEarned > 0) lines.push(`Bonus to'plandi: +${bonusEarned.toLocaleString()}`);
  lines.push('================================');
  lines.push('  Xaridingiz uchun rahmat!');
  lines.push('================================');
  lines.push('');

  const text = lines.filter(Boolean).join('\n');

  // TODO: ESC/POS qurilmaga yuborish
  // const escpos = require('escpos');
  // const device = new escpos.USB(vendorId, productId);
  // const printer = new escpos.Printer(device);
  // device.open(() => { printer.text(text).cut().close(); });

  console.log('\n' + text);
  return { success: true, text };
}

module.exports = { printReceipt };
