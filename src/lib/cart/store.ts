import { z } from 'zod';

export const CART_STORAGE_KEY = 'etaad.cart.v1';

export type CartItem = { id: string; quantity: number };
export type CartState = { items: CartItem[] };

const storedCartSchema = z.object({
  v: z.literal(1),
  items: z.array(z.object({ id: z.string().max(120), quantity: z.number() })).max(200),
});

export function clampQuantity(quantity: number, max: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(max, Math.max(1, Math.floor(quantity)));
}

export function addItem(state: CartState, id: string, quantity: number, max: number): CartState {
  const existing = state.items.find((i) => i.id === id);
  if (existing) {
    return {
      items: state.items.map((i) => (i.id === id ? { ...i, quantity: clampQuantity(i.quantity + quantity, max) } : i)),
    };
  }
  return { items: [...state.items, { id, quantity: clampQuantity(quantity, max) }] };
}

export function setItemQuantity(state: CartState, id: string, quantity: number, max: number): CartState {
  return { items: state.items.map((i) => (i.id === id ? { ...i, quantity: clampQuantity(quantity, max) } : i)) };
}

export function removeItem(state: CartState, id: string): CartState {
  return { items: state.items.filter((i) => i.id !== id) };
}

export function serializeCart(state: CartState): string {
  return JSON.stringify({ v: 1, items: state.items });
}

/**
 * قراءة السلة المحفوظة بأمان: أي بيانات تالفة أو منتجات لم تعد موجودة تُتجاهل،
 * والكميات تُحصر في النطاق المسموح.
 */
export function parseStoredCart(raw: string | null, knownIds: ReadonlySet<string> | null, max: number): CartState {
  if (!raw) return { items: [] };
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { items: [] };
  }
  const parsed = storedCartSchema.safeParse(json);
  if (!parsed.success) return { items: [] };
  const merged = new Map<string, number>();
  for (const item of parsed.data.items) {
    if (knownIds && !knownIds.has(item.id)) continue;
    merged.set(item.id, clampQuantity((merged.get(item.id) ?? 0) + item.quantity, max));
  }
  return { items: [...merged].map(([id, quantity]) => ({ id, quantity })) };
}

export function cartCount(state: CartState): number {
  return state.items.reduce((sum, i) => sum + i.quantity, 0);
}
