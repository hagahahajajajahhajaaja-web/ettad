import { Icon } from '@/components/ui/Icon';
import { availabilityLabels, formatKwd, PRICE_ON_REQUEST } from '@/lib/format';
import type { Availability } from '@/lib/schema';

export function PriceTag({ priceFils, size = 'md' }: { priceFils: number | null; size?: 'md' | 'lg' }) {
  if (priceFils === null) {
    return (
      // تسمية حالة وليست زرًا — بدون إطار حتى لا تبدو قابلة للضغط
      <span className={`inline-flex items-center gap-1.5 font-black whitespace-nowrap text-orange-ink ${size === 'lg' ? 'text-2xl' : 'text-sm'}`}>
        <Icon name="tag" className={size === 'lg' ? 'size-6' : 'size-4'} />
        {PRICE_ON_REQUEST}
      </span>
    );
  }
  return (
    <span className={`ltr-isolate font-black text-ink ${size === 'lg' ? 'text-3xl' : 'text-lg'}`}>{formatKwd(priceFils)}</span>
  );
}

/** حالة التوفر تظهر فقط بعد أن يحددها المتجر من لوحة التحكم («متوفر» أو «غير متوفر حاليًا»). */
export function AvailabilityBadge({ availability }: { availability: Availability }) {
  if (availability === 'unconfirmed') return null;
  const dot =
    availability === 'in_stock' ? 'bg-success' : availability === 'out_of_stock' ? 'bg-danger' : 'bg-orange';
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-steel-700">
      <span aria-hidden="true" className={`size-2.5 ${dot}`} />
      {availabilityLabels[availability]}
    </span>
  );
}
