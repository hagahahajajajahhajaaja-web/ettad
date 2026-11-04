import { useEffect, useSyncExternalStore } from 'react';
import AboutPage from '@/app/(store)/about/page';
import CartPage from '@/app/(store)/cart/page';
import CheckoutPage from '@/app/(store)/checkout/page';
import ContactPage from '@/app/(store)/contact/page';
import { NotFoundContent as NotFound } from '@/components/ui/NotFoundContent';
import HomePage from '@/app/(store)/page';
import PoliciesPage from '@/app/(store)/policies/page';
import { CartProvider } from '@/components/cart/CartProvider';
import { LiveCatalogProvider } from '@/components/catalog/LiveCatalog';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { ProductDetail } from '@/components/product/ProductDetail';
import { ShopPage } from '@/components/shop/ShopPage';
import { NoticeProvider } from '@/components/ui/Notices';
import { PolicyDetail } from '@/components/ui/PolicyDetail';
import { siteConfig } from '@/config/site';
import { policies } from '@/data/policies';
import { getActiveCategories, getCategory, getProduct, getProductSummaries } from '@/lib/catalog';
import { getRouteState, subscribeRoute } from './router';

function resolve(path: string): { title: string; node: React.ReactNode } {
  if (path === '/') return { title: siteConfig.fullName, node: <HomePage /> };
  if (path === '/shop/') return { title: 'المتجر', node: <ShopPage categoryId={null} /> };
  if (path === '/cart/') return { title: 'سلة التسوق', node: <CartPage /> };
  if (path === '/checkout/') return { title: 'إتمام الطلب', node: <CheckoutPage /> };
  if (path === '/about/') return { title: 'من نحن', node: <AboutPage /> };
  if (path === '/contact/') return { title: 'تواصل معنا', node: <ContactPage /> };
  if (path === '/policies/') return { title: 'سياسات المتجر', node: <PoliciesPage /> };
  let m = path.match(/^\/shop\/([a-z0-9-]+)\/$/);
  if (m && getActiveCategories().some((c) => c.id === m![1])) {
    return { title: getCategory(m[1]!)!.name, node: <ShopPage key={m[1]} categoryId={m[1]!} /> };
  }
  m = path.match(/^\/products\/([a-z0-9-]+)\/$/);
  const product = m ? getProduct(m[1]!) : undefined;
  if (product) return { title: product.name, node: <ProductDetail key={product.id} product={product} /> };
  m = path.match(/^\/policies\/([a-z0-9-]+)\/$/);
  const policy = m ? policies.find((p) => p.slug === m![1]) : undefined;
  if (policy) return { title: policy.title, node: <PolicyDetail key={policy.slug} policy={policy} /> };
  return { title: 'الصفحة غير موجودة', node: <NotFound /> };
}

export function PreviewApp() {
  const path = useSyncExternalStore(subscribeRoute, () => getRouteState().path);
  const { title, node } = resolve(path);
  useEffect(() => {
    document.title = title === siteConfig.fullName ? title : `${title} | عتاد`;
  }, [title]);

  return (
    <NoticeProvider>
      <LiveCatalogProvider>
      <CartProvider products={getProductSummaries()} maxQuantity={siteConfig.maxQuantityPerItem}>
        <SiteHeader />
        <main id="main" className="flex-1">
          {node}
        </main>
        <SiteFooter />
      </CartProvider>
      </LiveCatalogProvider>
    </NoticeProvider>
  );
}
