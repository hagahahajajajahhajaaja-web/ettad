import { describe, expect, it } from 'vitest';
import worker from '../../worker/index';
import type { Env } from '../../worker/types';
import { createD1 } from '../../scripts/lib/d1-sqlite.mjs';

const ORIGIN = 'https://etaad.test';
const ADMIN_KEY = 'test-admin-key-12345';
const WASHER = 'boss-bs-300f-pressure-washer';
const SOCKETS = 'boss-94pc-socket-wrench-set';
const DRILL = 'gulfik-brushless-drill-kit';

const makeEnv = (overrides: Partial<Env> = {}): Env => ({
  ETAAD_DB: createD1(),
  ADMIN_KEY,
  WHATSAPP_NUMBER: '96550000000',
  ...overrides,
});

type CallInit = { method?: string; body?: unknown; ip?: string; origin?: string | null; cookie?: string };

async function call(env: Env, path: string, init: CallInit = {}) {
  const headers: Record<string, string> = { 'CF-Connecting-IP': init.ip ?? '10.0.0.1' };
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';
  if (init.origin !== null) headers.Origin = init.origin ?? ORIGIN;
  if (init.cookie) headers.Cookie = init.cookie;
  const res = await worker.fetch(
    new Request(ORIGIN + path, { method: init.method ?? (init.body !== undefined ? 'POST' : 'GET'), headers, body: init.body !== undefined ? JSON.stringify(init.body) : undefined }),
    env,
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- استجابات JSON في الاختبارات
  return { res, data: (await res.json()) as Record<string, any> };
}

const customer = { name: 'أحمد الكويتي', phone: '+965 5123 4567', area: 'السالمية', block: '10', street: 'شارع 5', house: 'منزل 12', notes: 'الدور الثاني' };
const order = (extra: Record<string, unknown> = {}) => ({
  requestKey: `key-${Math.random().toString(36).slice(2, 12)}`,
  items: [{ id: WASHER, quantity: 2 }, { id: SOCKETS, quantity: 1 }],
  customer,
  ...extra,
});

async function adminCookie(env: Env) {
  const { res } = await call(env, '/api/admin/session', { body: { key: ADMIN_KEY } });
  const setCookie = res.headers.get('Set-Cookie') ?? '';
  expect(setCookie).toMatch(/HttpOnly; Secure; SameSite=Strict/);
  return setCookie.split(';')[0]!;
}

describe('الواجهة العامة', () => {
  it('health و catalog بالقيم الافتراضية', async () => {
    const env = makeEnv();
    expect((await call(env, '/api/health')).data).toMatchObject({ ok: true, database: true, adminKey: true });
    const { data } = await call(env, '/api/catalog');
    expect(data.products[WASHER]).toEqual({ priceFils: 35000, availability: 'unconfirmed' });
    expect(data.products[DRILL]).toEqual({ priceFils: null, availability: 'unconfirmed' });
    expect(Object.keys(data.products)).toHaveLength(12);
  });

  it('بدون قاعدة بيانات: رسالة واضحة 503', async () => {
    const { res, data } = await call(makeEnv({ ETAAD_DB: undefined }), '/api/catalog');
    expect(res.status).toBe(503);
    expect(data.code).toBe('DB_NOT_BOUND');
  });

  it('مسار غير معروف 404', async () => {
    expect((await call(makeEnv(), '/api/nope')).res.status).toBe(404);
  });
});

describe('إنشاء الطلب', () => {
  it('يحفظ الطلب برقم ويعيد رابط واتساب للمتابعة', async () => {
    const env = makeEnv();
    const { res, data } = await call(env, '/api/orders', { body: order() });
    expect(res.status).toBe(201);
    expect(data.order.id).toMatch(/^ET-\d{6}-[A-Z2-9]{4}$/);
    expect(data.order.itemCount).toBe(3);
    expect(data.order.totalFils).toBe(35000 * 2 + 20000); // من أسعار الخادم وليس من المتصفح
    expect(data.order.items[0]).toMatchObject({ id: WASHER, quantity: 2, unitPriceFils: 35000 });
    expect(decodeURIComponent(data.whatsappUrl)).toContain(data.order.id);
    expect(data.whatsappUrl).toContain('wa.me/96550000000');
    expect(data.order).not.toHaveProperty('adminNote');
  });

  it('منتج بدون سعر معتمد: الإجمالي يحدده المتجر', async () => {
    const { data } = await call(makeEnv(), '/api/orders', { body: order({ items: [{ id: WASHER, quantity: 1 }, { id: DRILL, quantity: 1 }] }) });
    expect(data.order.totalFils).toBeNull();
    expect(data.order.items[1]).toMatchObject({ id: DRILL, unitPriceFils: null });
  });

  it('بدون WHATSAPP_NUMBER يُستخدم رقم المتجر المعتمد', async () => {
    const { data } = await call(makeEnv({ WHATSAPP_NUMBER: undefined }), '/api/orders', { body: order() });
    expect(data.whatsappUrl).toContain('wa.me/96569976264');
  });

  it('إعادة الإرسال بنفس المفتاح تعيد نفس الطلب ولا تكرره', async () => {
    const env = makeEnv();
    const body = order();
    const first = await call(env, '/api/orders', { body });
    const second = await call(env, '/api/orders', { body });
    expect(second.res.status).toBe(200);
    expect(second.data.order.id).toBe(first.data.order.id);
    const cookie = await adminCookie(env);
    expect((await call(env, '/api/admin/orders', { cookie })).data.orders).toHaveLength(1);
  });

  it('يرفض بيانات غير صالحة برسائل عربية', async () => {
    const env = makeEnv();
    const badPhone = await call(env, '/api/orders', { body: order({ customer: { ...customer, phone: '1234' } }) });
    expect(badPhone.res.status).toBe(400);
    expect(badPhone.data.message).toMatch(/رقم هاتف كويتي/);
    expect((await call(env, '/api/orders', { body: order({ items: [{ id: 'fake', quantity: 1 }] }) })).res.status).toBe(400);
    expect((await call(env, '/api/orders', { body: order({ items: [] }) })).res.status).toBe(400);
    expect((await call(env, '/api/orders', { body: order({ items: [{ id: WASHER, quantity: 99 }] }) })).res.status).toBe(400);
    expect((await call(env, '/api/orders', { body: order({ requestKey: 'x' }) })).res.status).toBe(400);
  });

  it('يرفض الطلبات من مصدر آخر (CSRF) أو بدون JSON', async () => {
    const env = makeEnv();
    expect((await call(env, '/api/orders', { body: order(), origin: 'https://evil.example' })).res.status).toBe(403);
    expect((await call(env, '/api/orders', { body: order(), origin: null })).res.status).toBe(403);
    const res = await worker.fetch(new Request(ORIGIN + '/api/orders', { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'text/plain' }, body: '{}' }), env);
    expect(res.status).toBe(415);
  });

  it('يحد عدد الطلبات من نفس العنوان', async () => {
    const env = makeEnv();
    for (let i = 0; i < 6; i++) expect((await call(env, '/api/orders', { body: order(), ip: '9.9.9.9' })).res.status).toBe(201);
    expect((await call(env, '/api/orders', { body: order(), ip: '9.9.9.9' })).res.status).toBe(429);
    expect((await call(env, '/api/orders', { body: order(), ip: '8.8.8.8' })).res.status).toBe(201);
  });
});

describe('لوحة التحكم', () => {
  it('ترفض الوصول بدون جلسة وبمفتاح خاطئ', async () => {
    const env = makeEnv();
    expect((await call(env, '/api/admin/orders')).res.status).toBe(401);
    expect((await call(env, '/api/admin/products')).res.status).toBe(401);
    const wrong = await call(env, '/api/admin/session', { body: { key: 'wrong-key-000000' } });
    expect(wrong.res.status).toBe(401);
    expect(wrong.res.headers.get('Set-Cookie')).toBeNull();
    expect((await call(env, '/api/admin/orders', { cookie: 'etaad_admin=forged-token-value-1234567890' })).res.status).toBe(401);
  });

  it('توقف التخمين بعد 5 محاولات', async () => {
    const env = makeEnv();
    for (let i = 0; i < 5; i++) await call(env, '/api/admin/session', { body: { key: 'wrong-key-000000' }, ip: '7.7.7.7' });
    expect((await call(env, '/api/admin/session', { body: { key: ADMIN_KEY }, ip: '7.7.7.7' })).res.status).toBe(429);
  });

  it('بدون ADMIN_KEY في الإعدادات: رسالة واضحة', async () => {
    const { res, data } = await call(makeEnv({ ADMIN_KEY: undefined }), '/api/admin/session', { body: { key: 'anything-long-1' } });
    expect(res.status).toBe(503);
    expect(data.message).toMatch(/مفتاح لوحة التحكم/);
  });

  it('الدخول، الطلبات، تغيير الحالة والملاحظة، والخروج', async () => {
    const env = makeEnv();
    const created = (await call(env, '/api/orders', { body: order() })).data.order;
    const cookie = await adminCookie(env);
    expect((await call(env, '/api/admin/session', { cookie })).data.authenticated).toBe(true);

    const list = await call(env, '/api/admin/orders', { cookie });
    expect(list.data.orders[0]).toMatchObject({ id: created.id, status: 'new', customer: { name: 'أحمد الكويتي', phone: '51234567' } });
    expect(list.data.counts).toEqual({ new: 1 });
    expect((await call(env, `/api/admin/orders?q=5123`, { cookie })).data.orders).toHaveLength(1);
    expect((await call(env, `/api/admin/orders?status=delivered`, { cookie })).data.orders).toHaveLength(0);

    const upd = await call(env, `/api/admin/orders/${created.id}`, { body: { status: 'confirmed', adminNote: 'تم الاتصال بالعميل' }, cookie });
    expect(upd.data.order).toMatchObject({ status: 'confirmed', adminNote: 'تم الاتصال بالعميل' });
    expect(upd.data.order.history.map((h: { status: string }) => h.status)).toEqual(['new', 'confirmed']);
    expect((await call(env, `/api/admin/orders/${created.id}`, { body: { status: 'shipped-to-mars' }, cookie })).res.status).toBe(400);
    expect((await call(env, `/api/admin/orders/${created.id}`, { body: { status: 'new' }, cookie, origin: 'https://evil.example' })).res.status).toBe(403);

    const out = await call(env, '/api/admin/session', { method: 'DELETE', cookie });
    expect(out.res.headers.get('Set-Cookie')).toMatch(/Max-Age=0/);
    expect((await call(env, '/api/admin/orders', { cookie })).res.status).toBe(401);
  });

  it('الفاتورة: الطلب الجديد غير مدفوع، وتسجيل الدفع وإلغاؤه يحفظ الوقت', async () => {
    const env = makeEnv();
    const created = (await call(env, '/api/orders', { body: order() })).data.order;
    expect(created).not.toHaveProperty('paymentStatus'); // العميل لا يرى حالة الدفع الداخلية
    const cookie = await adminCookie(env);
    expect((await call(env, '/api/admin/orders', { cookie })).data.orders[0]).toMatchObject({ paymentStatus: 'unpaid', paidAt: null });

    const paid = await call(env, `/api/admin/orders/${created.id}`, { body: { paymentStatus: 'paid' }, cookie });
    expect(paid.data.order).toMatchObject({ paymentStatus: 'paid', status: 'new' });
    expect(typeof paid.data.order.paidAt).toBe('number');
    expect((await call(env, '/api/admin/orders', { cookie })).data.orders[0]).toMatchObject({ paymentStatus: 'paid', paidAt: paid.data.order.paidAt });

    // حفظ الحالة أو الملاحظة لا يغير وقت الدفع
    const noted = await call(env, `/api/admin/orders/${created.id}`, { body: { adminNote: 'حوّل بالرابط', paymentStatus: 'paid' }, cookie });
    expect(noted.data.order.paidAt).toBe(paid.data.order.paidAt);

    const unpaid = await call(env, `/api/admin/orders/${created.id}`, { body: { paymentStatus: 'unpaid' }, cookie });
    expect(unpaid.data.order).toMatchObject({ paymentStatus: 'unpaid', paidAt: null });
    expect((await call(env, `/api/admin/orders/${created.id}`, { body: { paymentStatus: 'half' }, cookie })).res.status).toBe(400);
  });

  it('قاعدة بيانات قديمة بدون أعمدة الدفع تُحدَّث تلقائيًا بدون فقدان الطلبات', async () => {
    const db = createD1();
    await db.exec(`CREATE TABLE orders (
      id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'new',
      request_key TEXT NOT NULL UNIQUE, customer_name TEXT NOT NULL, phone TEXT NOT NULL, area TEXT NOT NULL, block TEXT NOT NULL,
      street TEXT NOT NULL, house TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '', items_json TEXT NOT NULL, item_count INTEGER NOT NULL,
      total_fils INTEGER, admin_note TEXT NOT NULL DEFAULT '', history_json TEXT NOT NULL DEFAULT '[]')`);
    await db.exec(`INSERT INTO orders (id, created_at, updated_at, request_key, customer_name, phone, area, block, street, house, items_json, item_count, total_fils)
      VALUES ('ET-261101-AAAA', 1, 1, 'old-key-123', 'عميل قديم', '51234567', 'حولي', '1', '2', '3', '[]', 0, 1000)`);
    const env = makeEnv({ ETAAD_DB: db });
    const cookie = await adminCookie(env);
    const list = await call(env, '/api/admin/orders', { cookie });
    expect(list.data.orders[0]).toMatchObject({ id: 'ET-261101-AAAA', customer: { name: 'عميل قديم' }, paymentStatus: 'unpaid', paidAt: null });
    expect((await call(env, '/api/admin/orders/ET-261101-AAAA', { body: { paymentStatus: 'paid' }, cookie })).data.order.paymentStatus).toBe('paid');
  });

  it('تعديل السعر والتوفر ينعكس على المتجر والطلبات الجديدة', async () => {
    const env = makeEnv();
    const cookie = await adminCookie(env);
    const set = await call(env, `/api/admin/products/${WASHER}`, { body: { priceFils: 45500, availability: 'in_stock' }, cookie });
    expect(set.res.status).toBe(200);
    await call(env, `/api/admin/products/${SOCKETS}`, { body: { priceFils: 12750, availability: 'in_stock' }, cookie });

    const catalog = (await call(env, '/api/catalog')).data.products;
    expect(catalog[WASHER]).toEqual({ priceFils: 45500, availability: 'in_stock' });

    const created = (await call(env, '/api/orders', { body: order() })).data.order;
    expect(created.totalFils).toBe(45500 * 2 + 12750);
    expect(decodeURIComponent((await call(env, '/api/orders', { body: order() })).data.whatsappUrl)).toContain('103.750 د.ك');

    const products = (await call(env, '/api/admin/products', { cookie })).data.products;
    expect(products.find((p: { id: string }) => p.id === WASHER)).toMatchObject({ priceFils: 45500, availability: 'in_stock' });

    expect((await call(env, `/api/admin/products/${WASHER}`, { body: { priceFils: -1, availability: 'in_stock' }, cookie })).res.status).toBe(400);
    expect((await call(env, `/api/admin/products/${WASHER}`, { body: { priceFils: 1000, availability: 'maybe' }, cookie })).res.status).toBe(400);
    expect((await call(env, '/api/admin/products/not-real', { body: { priceFils: 1000, availability: 'in_stock' }, cookie })).res.status).toBe(404);

    // إرجاع «استفسر عن السعر»
    await call(env, `/api/admin/products/${WASHER}`, { body: { priceFils: null, availability: 'out_of_stock' }, cookie });
    const blocked = await call(env, '/api/orders', { body: order() });
    expect(blocked.res.status).toBe(409);
    expect(blocked.data.message).toMatch(/غير متوفر حاليًا/);
  });
});
