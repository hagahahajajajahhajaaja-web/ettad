'use client';

import Link from 'next/link';
import { useCart } from '@/components/cart/CartProvider';
import { Icon } from '@/components/ui/Icon';
import { countPieces } from '@/lib/format';
import { paths } from '@/lib/urls';

export function CartButton() {
  const { count, ready } = useCart();
  const label = ready ? (count > 0 ? `سلة التسوق: ${countPieces(count)}` : 'سلة التسوق فارغة') : 'سلة التسوق';
  return (
    <Link
      href={paths.cart}
      aria-label={label}
      className="relative grid size-12 shrink-0 place-items-center text-paper transition-colors hover:bg-ink-700"
    >
      <Icon name="cart" className="size-6" />
      {ready && count > 0 ? (
        <span
          aria-hidden="true"
          className="absolute end-0.5 top-0.5 grid min-w-6 place-items-center bg-orange px-1 text-xs font-black leading-6 text-ink"
        >
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Link>
  );
}
