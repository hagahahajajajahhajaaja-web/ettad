'use client';

import Link from 'next/link';
import { useCart } from '@/components/cart/CartProvider';
import { QuantityStepper } from '@/components/cart/QuantityStepper';
import { OrderTotalsBox } from '@/components/cart/OrderSummary';
import { ProductImage } from '@/components/product/ProductImage';
import { ProductName } from '@/components/product/ProductName';
import { AvailabilityBadge } from '@/components/product/PriceTag';
import { Icon } from '@/components/ui/Icon';
import { useNotify } from '@/components/ui/Notices';
import { formatKwd, PRICE_ON_REQUEST } from '@/lib/format';
import type { Category } from '@/lib/schema';
import { paths } from '@/lib/urls';

export function CartView({ icons }: { icons: Record<string, Category['icon']> }) {
  const { lines, ready, setQuantity, remove, maxQuantity } = useCart();
  const notify = useNotify();

  if (!ready) {
    return (
      <div className="grid min-h-60 place-items-center" role="status" aria-live="polite">
        <span className="flex items-center gap-3 font-bold text-steel-700">
          <span aria-hidden="true" className="size-5 animate-spin border-2 border-ink border-t-orange" />
          جارٍ تحميل السلة…
        </span>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="border-2 border-dashed border-steel-300 bg-white px-6 py-12 text-center">
        <Icon name="cart" className="mx-auto size-12 text-steel" />
        <p className="mt-4 text-2xl font-black">سلتك فارغة</p>
        <p className="mt-2 text-steel-700">أضف المنتجات التي تحتاجها ثم أكّد طلبك.</p>
        <Link href={paths.shop} className="btn-primary mt-6">
          تصفح المنتجات
          <Icon name="arrowLeft" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section aria-labelledby="cart-items-heading">
        <h2 id="cart-items-heading" className="sr-only">
          المنتجات في السلة
        </h2>
        <ul className="divide-y divide-line border border-line bg-white">
          {lines.map(({ product, quantity }) => (
            <li key={product.id} className="grid grid-cols-[5.5rem_1fr] gap-4 p-4 sm:grid-cols-[7rem_1fr]">
              <Link href={paths.product(product.id)} className="block aspect-square bg-plate" tabIndex={-1} aria-hidden="true">
                <ProductImage image={product.thumbnail} alt="" sizes="112px" fallbackIcon={icons[product.categoryId] ?? 'generic'} className="p-1.5" compactFallback />
              </Link>
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <Link href={paths.product(product.id)} className="font-black leading-snug hover:underline">
                    <ProductName name={product.name} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      remove(product.id);
                      notify({
                        tone: 'info',
                        message: `حُذف «${product.name}» من السلة.`,
                      });
                    }}
                    className="-me-2 -mt-2 grid size-11 shrink-0 place-items-center text-steel-700 hover:bg-danger-50 hover:text-danger"
                    aria-label={`حذف ${product.name} من السلة`}
                  >
                    <Icon name="trash" />
                  </button>
                </div>
                <AvailabilityBadge availability={product.availability} />
                <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
                  <QuantityStepper
                    size="sm"
                    value={quantity}
                    max={maxQuantity}
                    onChange={(value) => setQuantity(product.id, value)}
                    label={`كمية ${product.name}`}
                  />
                  <p className="font-black">
                    {product.priceFils === null ? (
                      <span className="text-sm">{PRICE_ON_REQUEST}</span>
                    ) : (
                      <span className="ltr-isolate">{formatKwd(product.priceFils * quantity)}</span>
                    )}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Link href={paths.shop} className="mt-4 inline-flex min-h-11 items-center gap-2 font-bold hover:underline">
          <Icon name="arrowRight" className="size-4" />
          متابعة التسوق
        </Link>
      </section>

      <aside aria-labelledby="cart-summary-heading" className="lg:sticky lg:top-24 lg:self-start">
        <div className="border-2 border-ink bg-white p-5">
          <h2 id="cart-summary-heading" className="mb-4 text-xl font-black">
            مراجعة الطلب
          </h2>
          <OrderTotalsBox lines={lines.map((l) => ({ quantity: l.quantity, priceFils: l.product.priceFils }))} />
          <Link href={paths.checkout} className="btn-primary mt-5 w-full text-lg">
            إتمام الطلب
            <Icon name="arrowLeft" />
          </Link>
          <p className="mt-3 text-sm leading-6 text-steel-700">
            الخطوة التالية: بيانات التوصيل ثم تأكيد الطلب. لا يتم الدفع في الموقع.
          </p>
        </div>
      </aside>
    </div>
  );
}
