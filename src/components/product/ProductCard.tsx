import Link from 'next/link';
import type { ProductSummary } from '@/lib/catalog';
import type { Category } from '@/lib/schema';
import { ProductImage } from '@/components/product/ProductImage';
import { ProductName } from '@/components/product/ProductName';
import { LivePriceTag } from '@/components/product/LivePrice';
import { QuickAddButton } from '@/components/product/QuickAddButton';
import { paths } from '@/lib/urls';

/** بطاقة منتج مختصرة: الصورة، الاسم، السعر، وزر الإضافة للسلة. */
export function ProductCard({
  product,
  icon,
  priority = false,
  headingLevel = 'h3',
}: {
  product: ProductSummary;
  icon: Category['icon'];
  priority?: boolean;
  headingLevel?: 'h2' | 'h3';
}) {
  const Heading = headingLevel;
  return (
    <article className="group relative flex h-full flex-col border border-line bg-white transition-colors hover:border-ink">
      <div className="relative aspect-square overflow-hidden bg-plate">
        <ProductImage
          image={product.thumbnail}
          alt={product.thumbnailAlt}
          sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw"
          priority={priority}
          fallbackIcon={icon}
          compactFallback
          className="p-2 transition-transform duration-300 group-hover:scale-[1.03] sm:p-3"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <div>
          <Heading className="line-clamp-3 text-[0.95rem] leading-6 font-black sm:text-base">
            <Link href={paths.product(product.id)} className="after:absolute after:inset-0 focus-visible:outline-none">
              <ProductName name={product.name} />
            </Link>
          </Heading>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-steel-700">{product.useLine}</p>
        </div>
        <div className="mt-auto space-y-2.5">
          <LivePriceTag productId={product.id} priceFils={product.priceFils} availability={product.availability} />
          <QuickAddButton
            productId={product.id}
            productName={product.name}
            priceFils={product.priceFils}
            availability={product.availability}
          />
        </div>
      </div>
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1 scale-x-0 bg-orange transition-transform group-hover:scale-x-100 group-has-[a:focus-visible]:scale-x-100"
      />
    </article>
  );
}
