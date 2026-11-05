import { z } from 'zod';
import { validateCheckout, type CheckoutData } from '@/lib/order/validation';
import { buildWhatsAppUrl, ltrInRtl } from '@/lib/order/whatsapp';
import { isOrderStatus, isPaymentStatus, makeOrderId, type OrderLineRecord, type OrderRecord, type OrderStatus } from '@/lib/order/status';
import { formatKwd } from '@/lib/format';
import { formatKuwaitPhone } from '@/lib/phone';
import { sanitizeMultiline } from '@/lib/sanitize';
import { findProduct, loadOverrides } from './catalog';
import { HttpError } from './http';
import type { D1Database } from './types';

const MAX_QTY = 20;

export const orderRequestSchema = z.object({
  requestKey: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
  items: z
    .array(z.object({ id: z.string().max(120), quantity: z.number().int().min(1).max(MAX_QTY) }))
    .min(1)
    .max(30),
  customer: z.record(z.string(), z.unknown()),
});

type OrderRow = {
  id: string;
  created_at: number;
  updated_at: number;
  status: string;
  request_key: string;
  customer_name: string;
  phone: string;
  area: string;
  block: string;
  street: string;
  house: string;
  notes: string;
  items_json: string;
  item_count: number;
  total_fils: number | null;
  admin_note: string;
  history_json: string;
  payment_status: string;
  paid_at: number | null;
};

export function rowToOrder(row: OrderRow): OrderRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: isOrderStatus(row.status) ? row.status : 'new',
    customer: { name: row.customer_name, phone: row.phone, area: row.area, block: row.block, street: row.street, house: row.house, notes: row.notes },
    items: JSON.parse(row.items_json) as OrderLineRecord[],
    itemCount: row.item_count,
    totalFils: row.total_fils,
    adminNote: row.admin_note,
    paymentStatus: isPaymentStatus(row.payment_status) ? row.payment_status : 'unpaid',
    paidAt: row.paid_at ?? null,
    history: JSON.parse(row.history_json) as OrderRecord['history'],
  };
}

/** ما يُعاد للعميل بعد إنشاء الطلب (بدون ملاحظات الإدارة). */
export function customerView(order: OrderRecord) {
  return { id: order.id, createdAt: order.createdAt, status: order.status, items: order.items, itemCount: order.itemCount, totalFils: order.totalFils };
}

export function followupMessage(order: OrderRecord): string {
  const lines = [`مرحبًا عتاد، أرسلت طلبًا من الموقع برقم ${order.id}.`, ''];
  for (const item of order.items) lines.push(`- ${item.name} × ${item.quantity}`);
  lines.push('', `الاسم: ${order.customer.name}`, `الهاتف: ${ltrInRtl(formatKuwaitPhone(order.customer.phone))}`);
  if (order.totalFils !== null) lines.push(`المجموع: ${formatKwd(order.totalFils)}`);
  return lines.join('\n');
}

export async function createOrder(db: D1Database, body: unknown, whatsappNumber: string | null, now = Date.now()) {
  const parsed = orderRequestSchema.safeParse(body);
  if (!parsed.success) throw new HttpError(400, 'INVALID_ORDER', 'بيانات الطلب غير مكتملة.');
  const { requestKey, items, customer } = parsed.data;

  const checked = validateCheckout({
    name: String(customer.name ?? ''),
    phone: String(customer.phone ?? ''),
    area: String(customer.area ?? ''),
    block: String(customer.block ?? ''),
    street: String(customer.street ?? ''),
    house: String(customer.house ?? ''),
    notes: String(customer.notes ?? ''),
  });
  if (!checked.ok) {
    const first = Object.values(checked.errors)[0] ?? 'تحقق من بيانات التوصيل.';
    throw new HttpError(400, 'INVALID_CUSTOMER', first);
  }
  const data: CheckoutData = checked.data;

  // إعادة إرسال نفس الطلب (ضغطتين أو انقطاع اتصال) تعيد الطلب نفسه
  const existing = await db.prepare('SELECT * FROM orders WHERE request_key = ?').bind(requestKey).first<OrderRow>();
  if (existing) {
    if (existing.phone !== data.phone) throw new HttpError(409, 'REQUEST_KEY_REUSED', 'حدّث الصفحة وحاول مرة أخرى.');
    const order = rowToOrder(existing);
    return { order, created: false, whatsappUrl: buildWhatsAppUrl(whatsappNumber, followupMessage(order)) };
  }

  const overrides = await loadOverrides(db);
  const merged = new Map<string, number>();
  for (const item of items) merged.set(item.id, Math.min(MAX_QTY, (merged.get(item.id) ?? 0) + item.quantity));

  const lines: OrderLineRecord[] = [];
  for (const [id, quantity] of merged) {
    const product = findProduct(id);
    const live = overrides.get(id);
    if (!product || !live) throw new HttpError(400, 'UNKNOWN_PRODUCT', 'أحد المنتجات لم يعد متوفرًا في المتجر. حدّث السلة.');
    if (live.availability === 'out_of_stock') throw new HttpError(409, 'OUT_OF_STOCK', `«${product.name}» غير متوفر حاليًا. احذفه من السلة ثم أعد الإرسال.`);
    lines.push({ id, name: product.name, model: product.model, quantity, unitPriceFils: live.priceFils });
  }
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const allPriced = lines.every((l) => l.unitPriceFils !== null);
  const totalFils = allPriced ? lines.reduce((sum, l) => sum + (l.unitPriceFils ?? 0) * l.quantity, 0) : null;
  const history: OrderRecord['history'] = [{ at: now, status: 'new', by: 'customer' }];

  for (let attempt = 0; attempt < 5; attempt++) {
    const id = makeOrderId(now, crypto.getRandomValues(new Uint8Array(4)));
    const result = await db
      .prepare(
        `INSERT INTO orders (id, created_at, updated_at, status, request_key, customer_name, phone, area, block, street, house, notes, items_json, item_count, total_fils, history_json)
         VALUES (?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`,
      )
      .bind(id, now, now, requestKey, data.name, data.phone, data.area, data.block, data.street, data.house, data.notes, JSON.stringify(lines), itemCount, totalFils, JSON.stringify(history))
      .run();
    if (Number(result.meta.changes ?? 0) === 1) {
      const order: OrderRecord = {
        id, createdAt: now, updatedAt: now, status: 'new',
        customer: { name: data.name, phone: data.phone, area: data.area, block: data.block, street: data.street, house: data.house, notes: data.notes },
        items: lines, itemCount, totalFils, adminNote: '', paymentStatus: 'unpaid', paidAt: null, history,
      };
      return { order, created: true, whatsappUrl: buildWhatsAppUrl(whatsappNumber, followupMessage(order)) };
    }
    // تعارض: إما نفس requestKey من طلب متزامن، أو رقم طلب مكرر (نادر جدًا) فنعيد المحاولة
    const raced = await db.prepare('SELECT * FROM orders WHERE request_key = ?').bind(requestKey).first<OrderRow>();
    if (raced) {
      const order = rowToOrder(raced);
      return { order, created: false, whatsappUrl: buildWhatsAppUrl(whatsappNumber, followupMessage(order)) };
    }
  }
  throw new HttpError(503, 'ORDER_ID', 'تعذر حفظ الطلب. حاول مرة أخرى.');
}

export async function listOrders(db: D1Database, filter: { status?: string | null; q?: string | null; limit?: number }) {
  const where: string[] = [];
  const binds: unknown[] = [];
  if (filter.status && isOrderStatus(filter.status)) {
    where.push('status = ?');
    binds.push(filter.status);
  }
  const q = (filter.q ?? '').trim().slice(0, 40);
  if (q) {
    const digits = q.replace(/\D/g, '');
    where.push('(id LIKE ? OR customer_name LIKE ?' + (digits.length >= 3 ? ' OR phone LIKE ?' : '') + ')');
    binds.push(`%${q.toUpperCase()}%`, `%${q}%`);
    if (digits.length >= 3) binds.push(`%${digits}%`);
  }
  const limit = Math.min(200, Math.max(1, filter.limit ?? 100));
  const sql = `SELECT * FROM orders ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT ${limit}`;
  const { results } = await db.prepare(sql).bind(...binds).all<OrderRow>();
  const counts = await db.prepare('SELECT status, COUNT(*) AS n FROM orders GROUP BY status').all<{ status: string; n: number }>();
  return {
    orders: results.map(rowToOrder),
    counts: Object.fromEntries(counts.results.map((r) => [r.status, Number(r.n)])) as Partial<Record<OrderStatus, number>>,
  };
}

export async function updateOrder(db: D1Database, id: string, body: unknown, now = Date.now()) {
  const input = z
    .object({ status: z.string().optional(), adminNote: z.string().max(1000).optional(), paymentStatus: z.string().optional() })
    .safeParse(body);
  if (!input.success) throw new HttpError(400, 'INVALID_UPDATE', 'بيانات التحديث غير صالحة.');
  const row = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first<OrderRow>();
  if (!row) throw new HttpError(404, 'NOT_FOUND', 'الطلب غير موجود.');
  const order = rowToOrder(row);
  let status = order.status;
  const history = [...order.history];
  if (input.data.status !== undefined) {
    if (!isOrderStatus(input.data.status)) throw new HttpError(400, 'INVALID_STATUS', 'حالة غير معروفة.');
    if (input.data.status !== status) {
      status = input.data.status;
      history.push({ at: now, status, by: 'admin' });
    }
  }
  const adminNote = input.data.adminNote !== undefined ? sanitizeMultiline(input.data.adminNote, 1000, 20) : order.adminNote;
  let { paymentStatus, paidAt } = order;
  if (input.data.paymentStatus !== undefined) {
    if (!isPaymentStatus(input.data.paymentStatus)) throw new HttpError(400, 'INVALID_PAYMENT_STATUS', 'حالة دفع غير معروفة.');
    if (input.data.paymentStatus !== paymentStatus) {
      paymentStatus = input.data.paymentStatus;
      paidAt = paymentStatus === 'paid' ? now : null;
    }
  }
  await db
    .prepare('UPDATE orders SET status = ?, admin_note = ?, history_json = ?, payment_status = ?, paid_at = ?, updated_at = ? WHERE id = ?')
    .bind(status, adminNote, JSON.stringify(history.slice(-50)), paymentStatus, paidAt, now, id)
    .run();
  return { ...order, status, adminNote, history, paymentStatus, paidAt, updatedAt: now };
}
