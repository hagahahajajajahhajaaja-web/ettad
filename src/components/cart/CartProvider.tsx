'use client';

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { useLiveList } from '@/components/catalog/LiveCatalog';
import type { ProductSummary } from '@/lib/catalog';
import { addItem, removeItem, setItemQuantity } from '@/lib/cart/store';
import {
  configureCartStore,
  getCartSnapshot,
  getServerCartSnapshot,
  subscribeCart,
  updateCart,
} from '@/lib/cart/browser-store';
import { productPayload, trackPixel } from '@/lib/tiktok-pixel';

export type CartLine = { product: ProductSummary; quantity: number };

type CartContextValue = {
  /** false أثناء العرض الأولي قبل قراءة السلة من المتصفح. */
  ready: boolean;
  lines: CartLine[];
  count: number;
  maxQuantity: number;
  getProduct: (id: string) => ProductSummary | undefined;
  add: (id: string, quantity: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const subscribeNothing = () => () => {};

export function CartProvider({
  products,
  maxQuantity,
  children,
}: {
  products: ProductSummary[];
  maxQuantity: number;
  children: ReactNode;
}) {
  configureCartStore({ maxQuantity });
  const state = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerCartSnapshot);
  const ready = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const liveProducts = useLiveList(products);
  const productMap = useMemo(() => new Map(liveProducts.map((p) => [p.id, p])), [liveProducts]);

  // المنتجات التي حُذفت من الكتالوج لا تظهر في السلة
  const lines = useMemo(
    () =>
      state.items.flatMap((item) => {
        const product = productMap.get(item.id);
        return product ? [{ product, quantity: item.quantity }] : [];
      }),
    [state, productMap],
  );

  const add = useCallback(
    (id: string, quantity: number) => {
      const product = productMap.get(id);
      if (!product) return;
      const quantityOf = () => getCartSnapshot().items.find((i) => i.id === id)?.quantity ?? 0;
      const before = quantityOf();
      updateCart((s) => addItem(s, id, quantity, maxQuantity));
      const added = quantityOf() - before;
      if (added > 0) trackPixel('AddToCart', productPayload(product, added));
    },
    [productMap, maxQuantity],
  );
  const setQuantity = useCallback(
    (id: string, quantity: number) => updateCart((s) => setItemQuantity(s, id, quantity, maxQuantity)),
    [maxQuantity],
  );
  const remove = useCallback((id: string) => updateCart((s) => removeItem(s, id)), []);
  const clear = useCallback(() => updateCart(() => ({ items: [] })), []);
  const getProduct = useCallback((id: string) => productMap.get(id), [productMap]);

  const value = useMemo<CartContextValue>(
    () => ({
      ready,
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      maxQuantity,
      getProduct,
      add,
      setQuantity,
      remove,
      clear,
    }),
    [ready, lines, maxQuantity, getProduct, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart يجب أن يُستخدم داخل CartProvider');
  return ctx;
}
