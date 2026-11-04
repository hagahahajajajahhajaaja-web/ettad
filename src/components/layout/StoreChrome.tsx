import type { ReactNode } from 'react';
import { TikTokPixel } from '@/components/analytics/TikTokPixel';
import { CartProvider } from '@/components/cart/CartProvider';
import { LiveCatalogProvider } from '@/components/catalog/LiveCatalog';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { siteConfig } from '@/config/site';
import { getProductSummaries } from '@/lib/catalog';

/** إطار صفحات المتجر: الأسعار الحية + السلة + الهيدر والفوتر. */
export function StoreChrome({ children }: { children: ReactNode }) {
  return (
    <LiveCatalogProvider>
      <CartProvider products={getProductSummaries()} maxQuantity={siteConfig.maxQuantityPerItem}>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <TikTokPixel />
      </CartProvider>
    </LiveCatalogProvider>
  );
}
