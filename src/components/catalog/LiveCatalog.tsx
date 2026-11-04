'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Availability } from '@/lib/schema';

/**
 * الأسعار والتوفر الحية من لوحة التحكم (/api/catalog).
 * الصفحات ثابتة؛ هذا المزود يحدّث السعر والتوفر في المتصفح دون إعادة بناء الموقع.
 * إذا لم يكن الخادم متاحًا (معاينة أو تطوير) تُستخدم القيم المكتوبة في بيانات المنتج.
 */
export type LiveValues = { priceFils: number | null; availability: Availability };
type Status = 'loading' | 'ready' | 'unavailable';
type LiveCatalogValue = { status: Status; overrides: Record<string, LiveValues> };

const LiveCatalogContext = createContext<LiveCatalogValue>({ status: 'unavailable', overrides: {} });

const AVAILABILITY = new Set(['unconfirmed', 'in_stock', 'out_of_stock']);

function parse(data: unknown): Record<string, LiveValues> | null {
  if (!data || typeof data !== 'object' || !('products' in data)) return null;
  const products = (data as { products: unknown }).products;
  if (!products || typeof products !== 'object') return null;
  const out: Record<string, LiveValues> = {};
  for (const [id, raw] of Object.entries(products as Record<string, unknown>)) {
    const v = raw as { priceFils?: unknown; availability?: unknown };
    const price = v.priceFils === null ? null : Number.isInteger(v.priceFils) && (v.priceFils as number) > 0 ? (v.priceFils as number) : undefined;
    if (price === undefined || !AVAILABILITY.has(String(v.availability))) continue;
    out[id] = { priceFils: price, availability: v.availability as Availability };
  }
  return out;
}

/** المعاينة الخاصة (صفحة واحدة على claude.ai) لا تملك خادمًا — لا داعي لطلب الأسعار. */
const STATIC_PREVIEW = process.env.NEXT_PUBLIC_STATIC_PREVIEW === '1';

export function LiveCatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LiveCatalogValue>({ status: STATIC_PREVIEW ? 'unavailable' : 'loading', overrides: {} });

  useEffect(() => {
    if (STATIC_PREVIEW) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6000);
    fetch('/api/catalog', { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then(async (res) => {
        const overrides = res.ok ? parse(await res.json()) : null;
        setState(overrides ? { status: 'ready', overrides } : { status: 'unavailable', overrides: {} });
      })
      .catch(() => setState({ status: 'unavailable', overrides: {} }))
      .finally(() => window.clearTimeout(timeout));
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return <LiveCatalogContext.Provider value={state}>{children}</LiveCatalogContext.Provider>;
}

export function useLiveCatalog() {
  return useContext(LiveCatalogContext);
}

/** القيم الحالية لمنتج: الحية إن وُجدت، وإلا الافتراضية. pending=true أثناء التحميل. */
export function useLiveProduct(id: string, fallback: LiveValues): LiveValues & { pending: boolean } {
  const { status, overrides } = useLiveCatalog();
  const live = overrides[id];
  return { ...(live ?? fallback), pending: status === 'loading' };
}

/** يدمج القيم الحية في قائمة منتجات (للتصفية والترتيب والسلة). */
export function useLiveList<T extends { id: string } & LiveValues>(items: T[]): T[] {
  const { overrides } = useLiveCatalog();
  return useMemo(() => items.map((item) => (overrides[item.id] ? { ...item, ...overrides[item.id] } : item)), [items, overrides]);
}
