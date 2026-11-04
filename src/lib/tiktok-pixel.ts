/**
 * بكسل TikTok الخاص بمتجر عتاد — يعمل فقط على النطاق الحقيقي etaadq8.com.
 * يرسل بيانات منتجات عامة فقط (المعرّف والاسم والسعر والكمية). لا يرسل أي بيانات عميل ولا أحداث دفع.
 */

export const TIKTOK_PIXEL_ID = 'DBL0N0RC77U8I4RJ305G';
const SDK_URL = 'https://analytics.tiktok.com/i18n/pixel/events.js';
const METHODS = [
  'page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group',
  'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent',
] as const;

type PixelProduct = { id: string; name: string; priceFils: number | null };
type PixelContent = { content_id: string; content_name: string; quantity: number; price?: number };
export type PixelPayload = {
  content_type?: 'product';
  contents?: PixelContent[];
  currency?: 'KWD';
  value?: number;
  event_id?: string;
};

type Queue = unknown[] & Record<string, unknown>;
type TtqInstance = { page: () => void; track: (event: string, data: PixelPayload, options?: { event_id?: string }) => void };
type Ttq = Queue & { instance: (id: string) => TtqInstance; _i: Record<string, Queue>; _t: Record<string, number>; _o: Record<string, object> };

declare global {
  interface Window {
    ttq?: Ttq;
    TiktokAnalyticsObject?: string;
    __etaadPixelInstalled?: boolean;
  }
}

export function isPixelHost(hostname: string): boolean {
  return /(^|\.)etaadq8\.com$/.test(hostname);
}

function stub(target: Queue, method: string) {
  target[method] = (...args: unknown[]) => {
    target.push([method, ...args]);
  };
}

/** يثبّت البكسل مرة واحدة. يرجع false خارج etaadq8.com (التطوير والمعاينات والاختبارات). */
export function bootPixel(): boolean {
  if (typeof window === 'undefined' || !isPixelHost(window.location.hostname)) return false;
  if (window.__etaadPixelInstalled) return true;
  window.__etaadPixelInstalled = true;

  const q = (window.ttq ??= [] as unknown as Ttq);
  window.TiktokAnalyticsObject = 'ttq';
  for (const m of METHODS) if (!q[m]) stub(q, m);
  q.instance = (id: string) => {
    const inst = q._i[id] ?? ([] as unknown as Queue);
    for (const m of METHODS) if (!inst[m]) stub(inst, m);
    return inst as unknown as TtqInstance;
  };
  q._i = q._i ?? {};
  q._i[TIKTOK_PIXEL_ID] = q._i[TIKTOK_PIXEL_ID] ?? ([] as unknown as Queue);
  q._i[TIKTOK_PIXEL_ID]._u = SDK_URL;
  q._t = q._t ?? {};
  q._t[TIKTOK_PIXEL_ID] = Date.now();
  q._o = q._o ?? {};
  q._o[TIKTOK_PIXEL_ID] = {};

  const script = document.createElement('script');
  script.async = true;
  script.src = `${SDK_URL}?sdkid=${TIKTOK_PIXEL_ID}&lib=ttq`;
  document.head.appendChild(script);

  // أي رابط واتساب في الموقع = حدث تواصل
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target as Element | null;
      const a = target?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a) return;
      try {
        const host = new URL(a.href).hostname;
        if (host === 'wa.me' || host === 'api.whatsapp.com') trackPixel('Contact', {});
      } catch {
        // رابط غير صالح — تجاهل
      }
    },
    true,
  );
  return true;
}

function instance(): TtqInstance | null {
  if (typeof window === 'undefined' || !window.__etaadPixelInstalled || !window.ttq) return null;
  return window.ttq.instance(TIKTOK_PIXEL_ID);
}

export function pixelPage() {
  try {
    instance()?.page();
  } catch {
    // البكسل لا يؤثر أبدًا على عمل المتجر
  }
}

export function trackPixel(event: string, data: PixelPayload) {
  try {
    const { event_id, ...payload } = data;
    instance()?.track(event, payload, event_id ? { event_id } : undefined);
  } catch {
    // البكسل لا يؤثر أبدًا على عمل المتجر
  }
}

/** بيانات منتج واحد بكمية معيّنة؛ السعر والقيمة فقط إذا كان السعر معروفًا. */
export function productPayload(product: PixelProduct, quantity: number): PixelPayload {
  const content: PixelContent = { content_id: product.id, content_name: product.name, quantity };
  const data: PixelPayload = { content_type: 'product', contents: [content] };
  if (product.priceFils !== null && Number.isFinite(product.priceFils)) {
    content.price = product.priceFils / 1000;
    data.currency = 'KWD';
    data.value = (product.priceFils / 1000) * quantity;
  }
  return data;
}

/** بيانات عدة منتجات؛ المجموع بالدينار فقط إذا كانت كل الأسعار معروفة. */
export function linesPayload(lines: { product: PixelProduct; quantity: number }[]): PixelPayload {
  const parts = lines.map((l) => productPayload(l.product, l.quantity));
  const data: PixelPayload = { content_type: 'product', contents: parts.flatMap((p) => p.contents ?? []) };
  if (parts.length && parts.every((p) => p.value !== undefined)) {
    data.currency = 'KWD';
    data.value = Math.round(parts.reduce((sum, p) => sum + (p.value ?? 0), 0) * 1000) / 1000;
  }
  return data;
}
