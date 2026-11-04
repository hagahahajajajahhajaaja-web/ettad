'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/components/cart/CartProvider';
import { useLiveProduct } from '@/components/catalog/LiveCatalog';
import { QuantityStepper } from '@/components/cart/QuantityStepper';
import { ProductName } from '@/components/product/ProductName';
import { Icon } from '@/components/ui/Icon';
import { useNotify } from '@/components/ui/Notices';
import { canAddToCart, formatPrice } from '@/lib/format';
import type { Availability } from '@/lib/schema';
import { paths } from '@/lib/urls';

export function AddToCartPanel({
  productId,
  productName,
  priceFils: initialPriceFils,
  availability: initialAvailability,
  inquiryUrl,
}: {
  productId: string;
  productName: string;
  priceFils: number | null;
  availability: Availability;
  /** رابط استفسار واتساب جاهز، أو null إذا لم يُضبط رقم المتجر. */
  inquiryUrl: string | null;
}) {
  const live = useLiveProduct(productId, { priceFils: initialPriceFils, availability: initialAvailability });
  const { priceFils, availability } = live;
  const { add, lines, maxQuantity, ready } = useCart();
  const notify = useNotify();
  const [quantity, setQuantity] = useState(1);
  const inCart = lines.find((l) => l.product.id === productId)?.quantity ?? 0;
  const remaining = Math.max(0, maxQuantity - inCart);
  const allowed = canAddToCart(availability);

  const handleAdd = () => {
    if (!allowed) return;
    if (remaining === 0) {
      notify({ tone: 'error', message: `وصلت للحد الأعلى (${maxQuantity}) لهذا المنتج في السلة.`, action: { label: 'السلة', href: paths.cart } });
      return;
    }
    const added = Math.min(quantity, remaining);
    add(productId, added);
    notify({
      tone: 'success',
      message:
        added < quantity
          ? `أُضيفت ${added} فقط — الحد الأعلى ${maxQuantity} لكل منتج.`
          : `أُضيف «${productName}» × ${added} إلى السلة.`,
      action: { label: 'عرض السلة', href: paths.cart },
    });
    setQuantity(1);
  };

  return (
    <div className="space-y-4">
      {allowed ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <QuantityStepper value={quantity} onChange={setQuantity} max={Math.max(1, remaining)} label="الكمية" />
            <button type="button" onClick={handleAdd} className="btn-primary flex-1 text-lg" disabled={!ready}>
              <Icon name="cart" />
              أضف إلى السلة
            </button>
          </div>
          {ready && inCart > 0 ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-success">
              <Icon name="check" className="size-4" />
              في سلتك الآن: {inCart}
              <Link href={paths.cart} className="font-bold text-ink underline underline-offset-4">
                مراجعة السلة
              </Link>
            </p>
          ) : null}
        </>
      ) : (
        <p className="border-2 border-line bg-plate p-3 font-bold text-steel-700">هذا المنتج غير متوفر حاليًا ولا يمكن إضافته للسلة.</p>
      )}

      {inquiryUrl ? (
        <a href={inquiryUrl} target="_blank" rel="noopener noreferrer" className="btn-outline w-full">
          <Icon name="chat" />
          {priceFils === null ? 'استفسر عن السعر عبر واتساب' : 'اسأل عن المنتج عبر واتساب'}
        </a>
      ) : null}

      <p className="flex items-start gap-2 text-sm leading-6 text-steel-700">
        <Icon name="info" className="mt-0.5 size-4 shrink-0" />
        {priceFils === null
          ? 'أضفه للسلة وأرسل الطلب، ونؤكد لك السعر قبل أي التزام.'
          : 'بعد الطلب نتواصل معك لتأكيد التوفر وموعد التوصيل.'}
      </p>

      {/* شريط ثابت أسفل الشاشة على الجوال */}
      {allowed ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 pt-3 backdrop-blur safe-bottom lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-xs font-bold leading-5">
                <ProductName name={productName} />
              </p>
              <p className="text-sm font-black text-orange-ink">{formatPrice(priceFils)}</p>
            </div>
            <button type="button" onClick={handleAdd} className="btn-primary shrink-0" disabled={!ready}>
              <Icon name="cart" />
              أضف للسلة
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
