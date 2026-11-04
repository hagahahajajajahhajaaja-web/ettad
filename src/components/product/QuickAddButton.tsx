'use client';

import { useCart } from '@/components/cart/CartProvider';
import { useLiveProduct } from '@/components/catalog/LiveCatalog';
import { Icon } from '@/components/ui/Icon';
import { useNotify } from '@/components/ui/Notices';
import { canAddToCart } from '@/lib/format';
import type { Availability } from '@/lib/schema';
import { paths } from '@/lib/urls';

/** زر «أضف للسلة» المباشر في بطاقة المنتج (قطعة واحدة في كل ضغطة). */
export function QuickAddButton({
  productId,
  productName,
  priceFils,
  availability,
}: {
  productId: string;
  productName: string;
  priceFils: number | null;
  availability: Availability;
}) {
  const live = useLiveProduct(productId, { priceFils, availability });
  const { add, lines, maxQuantity, ready } = useCart();
  const notify = useNotify();

  if (!canAddToCart(live.availability)) {
    return <p className="flex min-h-11 items-center justify-center bg-plate text-sm font-bold text-steel-700">غير متوفر حاليًا</p>;
  }

  const inCart = lines.find((line) => line.product.id === productId)?.quantity ?? 0;
  const handleAdd = () => {
    if (inCart >= maxQuantity) {
      notify({ tone: 'error', message: `وصلت للحد الأعلى (${maxQuantity}) لهذا المنتج في السلة.`, action: { label: 'السلة', href: paths.cart } });
      return;
    }
    add(productId, 1);
    notify({ tone: 'success', message: `أُضيف «${productName}» إلى السلة.`, action: { label: 'عرض السلة', href: paths.cart } });
  };

  return (
    <button type="button" onClick={handleAdd} disabled={!ready} className="btn-primary relative z-10 min-h-11 w-full px-3 text-sm">
      <Icon name="cart" className="size-4" />
      أضف للسلة
      <span className="sr-only">: {productName}</span>
    </button>
  );
}
