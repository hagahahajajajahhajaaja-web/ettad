import { toLatinDigits } from '@/lib/format';

/**
 * توحيد النص العربي للبحث: حذف التشكيل والتطويل، وتوحيد الألف والتاء المربوطة والياء،
 * وتحويل الأرقام العربية، وتصغير الإنجليزية، وحذف الرموز.
 */
export function normalizeArabic(input: string): string {
  return toLatinDigits(input)
    .toLowerCase()
    .replace(/[ً-ٰٟۖ-ۭ]/g, '')
    .replace(/ـ/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** يحذف «ال» التعريف من بداية الكلمة لتحسين المطابقة («المفاتيح» ↔ «مفاتيح»). */
function stem(token: string): string {
  return token.length > 3 && token.startsWith('ال') ? token.slice(2) : token;
}

export type Searchable = {
  name: string;
  brand: string | null;
  model: string | null;
  categoryName: string;
  keywords: string[];
};

export function buildHaystack(item: Searchable): string {
  const text = [item.name, item.brand, item.model, item.model?.replace(/[-\s]/g, ''), item.categoryName, ...item.keywords]
    .filter(Boolean)
    .join(' ');
  const normalized = normalizeArabic(text);
  return `${normalized} ${normalized.split(' ').map(stem).join(' ')}`;
}

/** كل كلمة في البحث يجب أن تظهر في المنتج (مطابقة جزئية). */
export function matchesQuery(item: Searchable, query: string): boolean {
  const tokens = normalizeArabic(query).split(' ').filter(Boolean).map(stem);
  if (tokens.length === 0) return true;
  const haystack = buildHaystack(item);
  return tokens.every((token) => haystack.includes(token));
}

export type SortKey = 'featured' | 'name' | 'price-asc' | 'price-desc';

export type ShopFilters = {
  query: string;
  categoryId: string | null;
  /** بالفلس */
  minPrice: number | null;
  /** بالفلس */
  maxPrice: number | null;
  sort: SortKey;
};

export type FilterableProduct = Searchable & {
  id: string;
  categoryId: string;
  priceFils: number | null;
  sortOrder: number;
};

export function filterProducts<T extends FilterableProduct>(items: T[], filters: ShopFilters): T[] {
  const priceFilterActive = filters.minPrice !== null || filters.maxPrice !== null;
  const result = items.filter((item) => {
    if (filters.categoryId && item.categoryId !== filters.categoryId) return false;
    if (priceFilterActive) {
      if (item.priceFils === null) return false;
      if (filters.minPrice !== null && item.priceFils < filters.minPrice) return false;
      if (filters.maxPrice !== null && item.priceFils > filters.maxPrice) return false;
    }
    return matchesQuery(item, filters.query);
  });

  const byOrder = (a: T, b: T) => a.sortOrder - b.sortOrder;
  const priceOrInfinity = (p: number | null) => (p === null ? Number.POSITIVE_INFINITY : p);
  switch (filters.sort) {
    case 'name':
      return result.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    case 'price-asc':
      return result.sort((a, b) => priceOrInfinity(a.priceFils) - priceOrInfinity(b.priceFils) || byOrder(a, b));
    case 'price-desc':
      // المنتجات غير المسعرة في النهاية دائمًا
      return result.sort((a, b) => {
        if (a.priceFils === null && b.priceFils === null) return byOrder(a, b);
        if (a.priceFils === null) return 1;
        if (b.priceFils === null) return -1;
        return b.priceFils - a.priceFils || byOrder(a, b);
      });
    default:
      return result.sort(byOrder);
  }
}

export function priceBounds(items: { priceFils: number | null }[]): { min: number; max: number } | null {
  const prices = items.map((i) => i.priceFils).filter((p): p is number => p !== null);
  if (prices.length === 0) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
