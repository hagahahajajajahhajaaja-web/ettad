import { Suspense } from 'react';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ShopView } from '@/components/shop/ShopView';
import { PageHeader } from '@/components/ui/PageHeader';
import { getActiveCategories, getAllProducts, getCategory, getCategoryIconMap, toSummary } from '@/lib/catalog';
import { paths } from '@/lib/urls';

/** صفحة المتجر (كل المنتجات أو قسم محدد). المحتوى يُولد ثابتًا ثم تعمل التصفية في المتصفح. */
export function ShopPage({ categoryId }: { categoryId: string | null }) {
  const category = categoryId ? getCategory(categoryId) : undefined;
  const products = getAllProducts().map(toSummary);
  const categories = getActiveCategories().map(({ id, name, productCount }) => ({ id, name, productCount }));
  const icons = getCategoryIconMap();
  const visible = categoryId ? products.filter((p) => p.categoryId === categoryId) : products;

  return (
    <>
      <PageHeader
        title={category ? category.name : 'المتجر'}
        description={category ? category.description : 'كل منتجات عتاد بأسعار واضحة بالدينار الكويتي.'}
        crumbs={category ? [{ label: 'المتجر', href: paths.shop }, { label: category.name }] : [{ label: 'المتجر' }]}
      />
      <div className="container-etaad py-5 sm:py-8">
        <Suspense fallback={<ProductGrid products={visible} icons={icons} priorityCount={2} />}>
          <ShopView products={products} categories={categories} icons={icons} categoryId={categoryId} />
        </Suspense>
      </div>
    </>
  );
}
