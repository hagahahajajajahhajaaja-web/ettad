'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useCart } from '@/components/cart/CartProvider';
import { bootPixel, linesPayload, pixelPage, productPayload, trackPixel } from '@/lib/tiktok-pixel';

const PRODUCT_PATH = /^\/products\/([a-z0-9-]+)\/?$/;
const CHECKOUT_PATH = /^\/checkout\/?$/;

/** مشاهدات الصفحات + ViewContent + InitiateCheckout. يعمل فقط على etaadq8.com (انظر bootPixel). */
export function TikTokPixel() {
  const pathname = usePathname();
  const { ready, lines, getProduct } = useCart();
  const lastPage = useRef<string | null>(null);
  const lastCheckout = useRef<string | null>(null);

  useEffect(() => {
    if (!bootPixel() || lastPage.current === pathname) return;
    lastPage.current = pathname;
    pixelPage();
    const slug = PRODUCT_PATH.exec(pathname)?.[1];
    const product = slug ? getProduct(slug) : undefined;
    if (product) trackPixel('ViewContent', productPayload(product, 1));
  }, [pathname, getProduct]);

  useEffect(() => {
    if (!CHECKOUT_PATH.test(pathname)) {
      lastCheckout.current = null;
      return;
    }
    if (!ready || !lines.length || lastCheckout.current === pathname || !bootPixel()) return;
    lastCheckout.current = pathname;
    trackPixel('InitiateCheckout', linesPayload(lines));
  }, [pathname, ready, lines]);

  return null;
}
