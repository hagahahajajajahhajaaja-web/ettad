/**
 * خادم عتاد على Cloudflare Pages (Advanced mode: out/_worker.js).
 * - /api/catalog            أسعار وتوفر المنتجات الحالية (عام)
 * - /api/orders             إنشاء طلب (عام، مع تحقق وحدّ محاولات)
 * - /api/admin/*            لوحة التحكم (جلسة بكوكي HttpOnly بعد إدخال ADMIN_KEY)
 * باقي المسارات تُخدم من الملفات الثابتة (ASSETS).
 */
import '@/lib/zod-jitless';
import { z } from 'zod';
import { availabilitySchema } from '@/lib/schema';
import { getAllProducts } from '@/lib/catalog';
import { STORE_WHATSAPP_NUMBER, WHATSAPP_NUMBER_PATTERN } from '@/config/site';
import { isAdmin, login, logout, requireAdmin } from './auth';
import { findProduct, loadOverrides, setOverride } from './catalog';
import { getDb, rateLimit } from './db';
import { HttpError, assertSameOrigin, clientIp, errorResponse, json, readJson, sha256Hex, withSecurityHeaders } from './http';
import { createOrder, customerView, listOrders, updateOrder } from './orders';
import type { Env } from './types';

const productUpdateSchema = z.object({
  priceFils: z.number().int().positive().max(100_000_000).nullable(),
  availability: availabilitySchema,
});

/** رقم واتساب المتجر: متغير العامل WHATSAPP_NUMBER إن وُجد، وإلا رقم المتجر المعتمد في الإعدادات. */
function storeWhatsApp(env: Env): string | null {
  const n = (env.WHATSAPP_NUMBER ?? '').replace(/\D/g, '') || STORE_WHATSAPP_NUMBER;
  return WHATSAPP_NUMBER_PATTERN.test(n) ? n : null;
}

async function ipBucket(prefix: string, request: Request) {
  return `${prefix}:${(await sha256Hex(clientIp(request))).slice(0, 24)}`;
}

export async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '');
  const method = request.method;

  if (path === '/api/health' && method === 'GET') {
    return json({ ok: true, database: Boolean(env.ETAAD_DB), adminKey: Boolean(env.ADMIN_KEY && env.ADMIN_KEY.length >= 12) });
  }

  if (path === '/api/catalog' && method === 'GET') {
    const db = await getDb(env.ETAAD_DB);
    const overrides = await loadOverrides(db);
    return json(
      { ok: true, products: Object.fromEntries([...overrides].map(([id, o]) => [id, { priceFils: o.priceFils, availability: o.availability }])) },
      200,
      { 'Cache-Control': 'public, max-age=15' },
    );
  }

  if (path === '/api/orders' && method === 'POST') {
    assertSameOrigin(request);
    const body = await readJson(request);
    const db = await getDb(env.ETAAD_DB);
    await rateLimit(db, await ipBucket('order', request), 6, 10 * 60 * 1000);
    const result = await createOrder(db, body, storeWhatsApp(env));
    return json({ ok: true, created: result.created, order: customerView(result.order), whatsappUrl: result.whatsappUrl }, result.created ? 201 : 200);
  }

  if (path === '/api/admin/session') {
    const db = await getDb(env.ETAAD_DB);
    if (method === 'GET') return json({ ok: true, authenticated: await isAdmin(db, request) });
    assertSameOrigin(request);
    if (method === 'POST') {
      await rateLimit(db, await ipBucket('login', request), 5, 15 * 60 * 1000);
      const body = (await readJson(request, 2_000)) as { key?: unknown };
      const cookie = await login(db, env, body?.key);
      return json({ ok: true, authenticated: true }, 200, { 'Set-Cookie': cookie });
    }
    if (method === 'DELETE') return json({ ok: true, authenticated: false }, 200, { 'Set-Cookie': await logout(db, request) });
  }

  if (path.startsWith('/api/admin/')) {
    const db = await getDb(env.ETAAD_DB);
    if (method !== 'GET') assertSameOrigin(request);
    await requireAdmin(db, request);

    if (path === '/api/admin/orders' && method === 'GET') {
      const result = await listOrders(db, { status: url.searchParams.get('status'), q: url.searchParams.get('q') });
      return json({ ok: true, ...result, serverTime: Date.now() });
    }
    const orderMatch = path.match(/^\/api\/admin\/orders\/(ET-[0-9]{6}-[A-Z0-9]{4})$/);
    if (orderMatch && (method === 'POST' || method === 'PATCH')) {
      const order = await updateOrder(db, orderMatch[1]!, await readJson(request, 4_000));
      return json({ ok: true, order });
    }

    if (path === '/api/admin/products' && method === 'GET') {
      const overrides = await loadOverrides(db);
      return json({
        ok: true,
        products: getAllProducts().map((p) => {
          const o = overrides.get(p.id)!;
          return {
            id: p.id,
            name: p.name,
            model: p.model,
            categoryName: p.category.name,
            thumbnail: p.images[0] ? `${p.images[0].base}-${p.images[0].widths[0]}.webp` : null,
            priceFils: o.priceFils,
            availability: o.availability,
            updatedAt: o.updatedAt,
          };
        }),
      });
    }
    const productMatch = path.match(/^\/api\/admin\/products\/([a-z0-9-]+)$/);
    if (productMatch && (method === 'POST' || method === 'PATCH')) {
      const product = findProduct(productMatch[1]!);
      if (!product) throw new HttpError(404, 'NOT_FOUND', 'المنتج غير موجود.');
      const parsed = productUpdateSchema.safeParse(await readJson(request, 2_000));
      if (!parsed.success) throw new HttpError(400, 'INVALID_PRODUCT_UPDATE', 'السعر أو حالة التوفر غير صالحة.');
      await setOverride(db, product.id, parsed.data.priceFils, parsed.data.availability);
      return json({ ok: true, product: { id: product.id, ...parsed.data } });
    }
  }

  throw new HttpError(404, 'NOT_FOUND', 'المسار غير موجود.');
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith('/api/')) {
      try {
        return await handleApi(request, env);
      } catch (error) {
        return errorResponse(error);
      }
    }
    if (!env.ASSETS) return new Response('Not found', { status: 404 });
    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },
};

export default worker;
