'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useLiveList } from '@/components/catalog/LiveCatalog';
import type { ProductSummary } from '@/lib/catalog';
import type { Category } from '@/lib/schema';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Icon } from '@/components/ui/Icon';
import { filterProducts, priceBounds, type SortKey } from '@/lib/search';
import { countProducts, formatKwd, parseKwdToFils } from '@/lib/format';
import { paths } from '@/lib/urls';

type CategoryOption = { id: string; name: string; productCount: number };

const SORT_LABELS: Record<SortKey, string> = {
  featured: 'الترتيب المقترح',
  name: 'الاسم (أ-ي)',
  'price-asc': 'السعر: الأقل أولًا',
  'price-desc': 'السعر: الأعلى أولًا',
};

/**
 * عرض المتجر مع البحث والتصفية. الحالة محفوظة في الرابط (?q=&min=&max=&sort=)
 * لتكون قابلة للمشاركة والرجوع بزر الخلف. القسم جزء من مسار الصفحة نفسه.
 */
export function ShopView({
  products: staticProducts,
  categories,
  icons,
  categoryId,
}: {
  products: ProductSummary[];
  categories: CategoryOption[];
  icons: Record<string, Category['icon']>;
  categoryId: string | null;
}) {
  const products = useLiveList(staticProducts);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const query = params.get('q') ?? '';
  const sortParam = params.get('sort');
  const minParam = params.get('min');
  const maxParam = params.get('max');

  const bounds = useMemo(() => priceBounds(products), [products]);
  const hasPrices = bounds !== null;
  const sort: SortKey =
    sortParam && sortParam in SORT_LABELS && (hasPrices || !sortParam.startsWith('price')) ? (sortParam as SortKey) : 'featured';
  const minPrice = hasPrices && minParam ? parseKwdToFils(minParam) : null;
  const maxPrice = hasPrices && maxParam ? parseKwdToFils(maxParam) : null;

  const results = useMemo(
    () => filterProducts(products, { query, categoryId, minPrice, maxPrice, sort }),
    [products, query, categoryId, minPrice, maxPrice, sort],
  );

  const updateParams = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const categoryHref = (id: string | null) => {
    const qs = params.toString();
    const base = id ? paths.category(id) : paths.shop;
    return qs ? `${base}?${qs}` : base;
  };

  const activeFilters = Boolean(query) || minPrice !== null || maxPrice !== null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8">
      <aside aria-label="تصفية المنتجات" className="space-y-4 lg:sticky lg:top-24 lg:space-y-6 lg:self-start">

        <nav aria-label="تصفية حسب القسم">
          <p className="field-label max-lg:sr-only">القسم</p>
          <ul className="flex gap-2 overflow-x-auto pb-1 scrollbar-none lg:flex-col lg:overflow-visible">
            <li>
              <CategoryLink href={categoryHref(null)} active={categoryId === null} label="كل المنتجات" count={products.length} />
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <CategoryLink
                  href={categoryHref(category.id)}
                  active={categoryId === category.id}
                  label={category.name}
                  count={category.productCount}
                />
              </li>
            ))}
          </ul>
        </nav>

        {hasPrices ? (
          <details className="group border-2 border-line bg-white" open={minPrice !== null || maxPrice !== null || undefined}>
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 text-sm font-bold select-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <Icon name="filter" className="size-4" />
                تصفية حسب السعر
              </span>
              <Icon name="chevronDown" className="size-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-line p-3">
              <PriceRange
                key={`${minParam}-${maxParam}`}
                initialMin={minParam ?? ''}
                initialMax={maxParam ?? ''}
                placeholderMin={formatKwd(bounds.min)}
                placeholderMax={formatKwd(bounds.max)}
                onApply={(min, max) => updateParams({ min, max })}
              />
            </div>
          </details>
        ) : null}
      </aside>

      <section aria-labelledby="results-heading">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <h2 id="results-heading" className="text-base font-bold" aria-live="polite">
            {results.length === 0 ? 'لا توجد نتائج' : countProducts(results.length)}
            {query ? <span className="text-steel-700"> لـ «{query}»</span> : null}
          </h2>
          <div className="flex items-center gap-2">
            <label htmlFor="shop-sort" className="text-sm font-semibold text-steel-700">
              الترتيب
            </label>
            <select
              id="shop-sort"
              value={sort}
              onChange={(event) => updateParams({ sort: event.target.value === 'featured' ? null : event.target.value })}
              className="min-h-11 border-2 border-line bg-white px-2 font-semibold focus:border-ink focus:outline-none"
            >
              {(Object.keys(SORT_LABELS) as SortKey[])
                .filter((key) => hasPrices || !key.startsWith('price'))
                .map((key) => (
                  <option key={key} value={key}>
                    {SORT_LABELS[key]}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {activeFilters ? (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {query ? <FilterChip label={`بحث: ${query}`} onRemove={() => updateParams({ q: null })} /> : null}
            {minPrice !== null ? <FilterChip label={`من ${formatKwd(minPrice)}`} onRemove={() => updateParams({ min: null })} /> : null}
            {maxPrice !== null ? <FilterChip label={`إلى ${formatKwd(maxPrice)}`} onRemove={() => updateParams({ max: null })} /> : null}
            <button type="button" onClick={() => updateParams({ q: null, min: null, max: null })} className="min-h-10 px-2 text-sm font-bold underline underline-offset-4">
              مسح الكل
            </button>
          </div>
        ) : null}

        {results.length > 0 ? (
          <ProductGrid products={results} icons={icons} priorityCount={2} headingLevel="h3" />
        ) : (
          <div className="border-2 border-dashed border-steel-300 bg-white p-8 text-center">
            <Icon name="search" className="mx-auto size-10 text-steel" />
            <p className="mt-3 text-lg font-black">لم نجد منتجات مطابقة</p>
            <p className="mt-1 text-steel-700">جرّب كلمة أخرى أو اسم العلامة أو رقم الموديل، أو تصفح كل المنتجات.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button type="button" className="btn-dark" onClick={() => updateParams({ q: null, min: null, max: null })}>
                مسح البحث
              </button>
              <Link href={paths.shop} className="btn-outline">
                كل المنتجات
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function CategoryLink({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-11 items-center justify-between gap-3 whitespace-nowrap border-2 px-3 text-sm font-bold transition-colors ${
        active ? 'border-ink bg-ink text-paper' : 'border-line bg-white text-ink hover:border-ink'
      }`}
    >
      {label}
      <span className={`ltr-isolate font-mono text-xs ${active ? 'text-orange' : 'text-steel-700'}`}>{count}</span>
    </Link>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex min-h-10 items-center gap-1.5 border border-ink bg-white px-3 text-sm font-semibold hover:bg-plate"
      aria-label={`إزالة التصفية: ${label}`}
    >
      {label}
      <Icon name="close" className="size-4" />
    </button>
  );
}

function PriceRange({
  initialMin,
  initialMax,
  placeholderMin,
  placeholderMax,
  onApply,
}: {
  initialMin: string;
  initialMax: string;
  placeholderMin: string;
  placeholderMax: string;
  onApply: (min: string | null, max: string | null) => void;
}) {
  const [min, setMin] = useState(initialMin);
  const [max, setMax] = useState(initialMax);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      noValidate
      aria-label="نطاق السعر بالدينار"
      onSubmit={(event) => {
        event.preventDefault();
        const minFils = min.trim() ? parseKwdToFils(min) : null;
        const maxFils = max.trim() ? parseKwdToFils(max) : null;
        if ((min.trim() && minFils === null) || (max.trim() && maxFils === null)) {
          setError('اكتب السعر بالأرقام فقط، مثل 12.500');
          return;
        }
        if (minFils !== null && maxFils !== null && minFils > maxFils) {
          setError('الحد الأدنى أكبر من الحد الأعلى');
          return;
        }
        setError(null);
        onApply(min.trim() || null, max.trim() || null);
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="price-min" className="text-xs font-semibold text-steel-700">
            من (د.ك)
          </label>
          <input id="price-min" inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value)} placeholder={placeholderMin} className="field-input" aria-invalid={error ? true : undefined} aria-describedby={error ? 'price-error' : undefined} />
        </div>
        <div>
          <label htmlFor="price-max" className="text-xs font-semibold text-steel-700">
            إلى (د.ك)
          </label>
          <input id="price-max" inputMode="decimal" value={max} onChange={(e) => setMax(e.target.value)} placeholder={placeholderMax} className="field-input" aria-invalid={error ? true : undefined} aria-describedby={error ? 'price-error' : undefined} />
        </div>
      </div>
      {error ? (
        <p id="price-error" className="field-error" role="alert">
          <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}
      <p className="text-xs leading-5 text-steel-700">المنتجات غير المسعّرة لا تظهر عند تفعيل نطاق السعر.</p>
      <button type="submit" className="btn-dark w-full">
        تطبيق السعر
      </button>
    </form>
  );
}
