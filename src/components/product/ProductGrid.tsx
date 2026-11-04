import type { ProductSummary } from '@/lib/catalog';
import type { Category } from '@/lib/schema';
import { ProductCard } from '@/components/product/ProductCard';

export function ProductGrid({
  products,
  icons,
  priorityCount = 0,
  headingLevel = 'h3',
}: {
  products: ProductSummary[];
  icons: Record<string, Category['icon']>;
  priorityCount?: number;
  headingLevel?: 'h2' | 'h3';
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            icon={icons[product.categoryId] ?? 'generic'}
            priority={index < priorityCount}
            headingLevel={headingLevel}
          />
        </li>
      ))}
    </ul>
  );
}
