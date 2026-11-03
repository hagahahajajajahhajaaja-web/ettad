'use client';

import { useLiveProduct } from '@/components/catalog/LiveCatalog';
import { AvailabilityBadge, PriceTag } from '@/components/product/PriceTag';
import type { Availability } from '@/lib/schema';

type Props = { productId: string; priceFils: number | null; availability: Availability };

/** سعر المنتج الحالي من لوحة التحكم (مع هيكل تحميل قصير لتجنب وميض «استفسر عن السعر»). */
export function LivePriceTag({ productId, priceFils, availability, size = 'md' }: Props & { size?: 'md' | 'lg' }) {
  const live = useLiveProduct(productId, { priceFils, availability });
  if (live.pending) {
    return (
      <span
        role="status"
        aria-label="جارٍ تحميل السعر"
        className={`inline-block animate-pulse bg-plate ${size === 'lg' ? 'h-9 w-40' : 'h-6 w-24'}`}
      />
    );
  }
  return <PriceTag priceFils={live.priceFils} size={size} />;
}

export function LiveAvailabilityBadge({ productId, priceFils, availability }: Props) {
  const live = useLiveProduct(productId, { priceFils, availability });
  if (live.pending) return null;
  return <AvailabilityBadge availability={live.availability} />;
}
