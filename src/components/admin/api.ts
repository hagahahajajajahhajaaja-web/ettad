'use client';

import type { OrderRecord, OrderStatus } from '@/lib/order/status';
import type { Availability } from '@/lib/schema';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      credentials: 'same-origin',
      headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'تعذر الاتصال بالخادم. تحقق من الإنترنت ثم حاول مرة أخرى.');
  }
  let data: { ok?: boolean; code?: string; message?: string } & Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    throw new ApiError(res.status, 'NO_API', 'خادم لوحة التحكم غير متاح في هذه النسخة من الموقع.');
  }
  if (!res.ok || data.ok === false) throw new ApiError(res.status, data.code ?? 'ERROR', data.message ?? 'حدث خطأ. حاول مرة أخرى.');
  return data as T;
}

export type AdminProduct = {
  id: string;
  name: string;
  model: string | null;
  categoryName: string;
  thumbnail: string | null;
  priceFils: number | null;
  availability: Availability;
  updatedAt: number | null;
};

export const adminApi = {
  session: () => request<{ authenticated: boolean }>('/api/admin/session'),
  login: (key: string) => request<{ authenticated: boolean }>('/api/admin/session', { method: 'POST', body: JSON.stringify({ key }) }),
  logout: () => request<{ authenticated: boolean }>('/api/admin/session', { method: 'DELETE' }),
  orders: (params: { status?: OrderStatus | null; q?: string }) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.q) qs.set('q', params.q);
    return request<{ orders: OrderRecord[]; counts: Partial<Record<OrderStatus, number>>; serverTime: number }>(`/api/admin/orders?${qs}`);
  },
  updateOrder: (id: string, body: { status?: OrderStatus; adminNote?: string }) =>
    request<{ order: OrderRecord }>(`/api/admin/orders/${encodeURIComponent(id)}`, { method: 'POST', body: JSON.stringify(body) }),
  products: () => request<{ products: AdminProduct[] }>('/api/admin/products'),
  updateProduct: (id: string, body: { priceFils: number | null; availability: Availability }) =>
    request<{ product: AdminProduct }>(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'POST', body: JSON.stringify(body) }),
};
