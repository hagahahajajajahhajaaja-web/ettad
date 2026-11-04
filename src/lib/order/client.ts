import type { CheckoutField } from '@/lib/order/validation';
import type { OrderLineRecord } from '@/lib/order/status';

export type PlacedOrder = {
  id: string;
  createdAt: number;
  items: OrderLineRecord[];
  itemCount: number;
  totalFils: number | null;
  whatsappUrl: string | null;
};

export type SubmitResult =
  | { ok: true; order: PlacedOrder }
  | { ok: false; kind: 'invalid'; message: string }
  | { ok: false; kind: 'unavailable'; message: string };

/** يرسل الطلب إلى الخادم. «unavailable» يعني أن نظام الطلبات غير متاح فننتقل لبديل واتساب. */
export async function submitOrder(payload: {
  requestKey: string;
  items: { id: string; quantity: number }[];
  customer: Record<CheckoutField, string>;
}): Promise<SubmitResult> {
  let res: Response;
  try {
    res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, kind: 'unavailable', message: 'تعذر الاتصال بالمتجر. تحقق من الإنترنت.' };
  }
  let data: { ok?: boolean; message?: string; order?: Omit<PlacedOrder, 'whatsappUrl'>; whatsappUrl?: string | null } = {};
  try {
    data = await res.json();
  } catch {
    return { ok: false, kind: 'unavailable', message: 'نظام الطلبات غير متاح الآن.' };
  }
  if (res.ok && data.ok && data.order) return { ok: true, order: { ...data.order, whatsappUrl: data.whatsappUrl ?? null } };
  if (res.status >= 500 || res.status === 404) return { ok: false, kind: 'unavailable', message: data.message ?? 'نظام الطلبات غير متاح الآن.' };
  return { ok: false, kind: 'invalid', message: data.message ?? 'تحقق من بيانات الطلب ثم حاول مرة أخرى.' };
}

export function newRequestKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
