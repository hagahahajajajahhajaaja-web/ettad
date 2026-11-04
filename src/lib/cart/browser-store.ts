'use client';

import {
  CART_STORAGE_KEY,
  parseStoredCart,
  serializeCart,
  type CartState,
} from '@/lib/cart/store';

/**
 * مخزن السلة في المتصفح (localStorage) مع بديل في الذاكرة إذا كان التخزين غير متاح
 * (مثل بعض أوضاع التصفح الخاص). يُستخدم مع useSyncExternalStore.
 */
const EMPTY: CartState = { items: [] };
const listeners = new Set<() => void>();
let memoryRaw: string | null = null;
let storageAvailable = true;
let cache: { raw: string | null; state: CartState } | null = null;
let maxQuantity = 20;

export function configureCartStore(options: { maxQuantity: number }) {
  maxQuantity = options.maxQuantity;
}

function readRaw(): string | null {
  if (!storageAvailable) return memoryRaw;
  try {
    return window.localStorage.getItem(CART_STORAGE_KEY);
  } catch {
    storageAvailable = false;
    return memoryRaw;
  }
}

function writeRaw(raw: string | null) {
  memoryRaw = raw;
  if (!storageAvailable) return;
  try {
    if (raw === null) window.localStorage.removeItem(CART_STORAGE_KEY);
    else window.localStorage.setItem(CART_STORAGE_KEY, raw);
  } catch {
    storageAvailable = false;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

export function getCartSnapshot(): CartState {
  const raw = readRaw();
  if (cache && cache.raw === raw) return cache.state;
  const state = parseStoredCart(raw, null, maxQuantity);
  cache = { raw, state };
  return state;
}

export function getServerCartSnapshot(): CartState {
  return EMPTY;
}

export function subscribeCart(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === CART_STORAGE_KEY) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function updateCart(updater: (state: CartState) => CartState) {
  const next = updater(getCartSnapshot());
  const raw = next.items.length ? serializeCart(next) : null;
  writeRaw(raw);
  cache = { raw, state: next };
  emit();
}

export function isCartPersistent(): boolean {
  readRaw();
  return storageAvailable;
}
