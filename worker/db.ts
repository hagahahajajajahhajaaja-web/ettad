import type { D1Database } from './types';
import { HttpError } from './http';

/** المخطط يُنشأ تلقائيًا عند أول طلب (CREATE IF NOT EXISTS) — لا حاجة لخطوة ترحيل يدوية. */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS product_overrides (
    product_id TEXT PRIMARY KEY,
    price_fils INTEGER CHECK (price_fils IS NULL OR price_fils > 0),
    availability TEXT NOT NULL DEFAULT 'unconfirmed' CHECK (availability IN ('unconfirmed','in_stock','out_of_stock')),
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    request_key TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    area TEXT NOT NULL,
    block TEXT NOT NULL,
    street TEXT NOT NULL,
    house TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    items_json TEXT NOT NULL,
    item_count INTEGER NOT NULL,
    total_fils INTEGER,
    admin_note TEXT NOT NULL DEFAULT '',
    history_json TEXT NOT NULL DEFAULT '[]',
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    paid_at INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS orders_created_idx ON orders (created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS admin_sessions (
    token_hash TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS rate_limits (
    bucket TEXT PRIMARY KEY,
    window_start INTEGER NOT NULL,
    count INTEGER NOT NULL
  )`,
];

/** أعمدة أُضيفت بعد الإطلاق — تُضاف لقواعد البيانات القديمة تلقائيًا (بدون حذف أي بيانات). */
const ADDED_ORDER_COLUMNS: [name: string, ddl: string][] = [
  ['payment_status', `ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid'`],
  ['paid_at', 'ALTER TABLE orders ADD COLUMN paid_at INTEGER'],
];

async function addMissingColumns(db: D1Database) {
  const { results } = await db.prepare('PRAGMA table_info(orders)').all<{ name: string }>();
  const existing = new Set(results.map((c) => c.name));
  for (const [name, ddl] of ADDED_ORDER_COLUMNS) {
    if (existing.has(name)) continue;
    try {
      await db.prepare(ddl).run();
    } catch (error) {
      // طلب متزامن أضاف العمود قبلنا
      if (!/duplicate column/i.test(String(error))) throw error;
    }
  }
}

const ready = new WeakSet<D1Database>();

export async function getDb(db: D1Database | undefined): Promise<D1Database> {
  if (!db) throw new HttpError(503, 'DB_NOT_BOUND', 'قاعدة البيانات غير مربوطة بعد.');
  if (!ready.has(db)) {
    await db.batch(SCHEMA.map((sql) => db.prepare(sql)));
    await addMissingColumns(db);
    ready.add(db);
  }
  return db;
}

/** حد بسيط لعدد المحاولات لكل عنوان IP خلال نافذة زمنية. */
export async function rateLimit(db: D1Database, bucket: string, limit: number, windowMs: number, now = Date.now()) {
  const row = await db.prepare('SELECT window_start, count FROM rate_limits WHERE bucket = ?').bind(bucket).first<{ window_start: number; count: number }>();
  if (!row || now - row.window_start >= windowMs) {
    await db
      .prepare('INSERT INTO rate_limits (bucket, window_start, count) VALUES (?, ?, 1) ON CONFLICT(bucket) DO UPDATE SET window_start = excluded.window_start, count = 1')
      .bind(bucket, now)
      .run();
    return;
  }
  if (row.count >= limit) throw new HttpError(429, 'RATE_LIMITED', 'محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.');
  await db.prepare('UPDATE rate_limits SET count = count + 1 WHERE bucket = ?').bind(bucket).run();
}
