import { getAllProducts, type CatalogProduct } from '@/lib/catalog';
import type { Availability } from '@/lib/schema';
import type { D1Database } from './types';

export type LiveOverride = { priceFils: number | null; availability: Availability; updatedAt: number | null };

/** السعر والتوفر الحاليان: من لوحة التحكم إن وُجدا، وإلا من بيانات المنتج في الكود. */
export async function loadOverrides(db: D1Database): Promise<Map<string, LiveOverride>> {
  const { results } = await db
    .prepare('SELECT product_id, price_fils, availability, updated_at FROM product_overrides')
    .all<{ product_id: string; price_fils: number | null; availability: Availability; updated_at: number }>();
  const stored = new Map(results.map((r) => [r.product_id, r]));
  const map = new Map<string, LiveOverride>();
  for (const product of getAllProducts()) {
    const row = stored.get(product.id);
    map.set(product.id, row
      ? { priceFils: row.price_fils, availability: row.availability, updatedAt: row.updated_at }
      : { priceFils: product.priceFils, availability: product.availability, updatedAt: null });
  }
  return map;
}

export function findProduct(id: string): CatalogProduct | undefined {
  return getAllProducts().find((p) => p.id === id);
}

export async function setOverride(db: D1Database, productId: string, priceFils: number | null, availability: Availability, now = Date.now()) {
  await db
    .prepare(
      `INSERT INTO product_overrides (product_id, price_fils, availability, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(product_id) DO UPDATE SET price_fils = excluded.price_fils, availability = excluded.availability, updated_at = excluded.updated_at`,
    )
    .bind(productId, priceFils, availability, now)
    .run();
}
