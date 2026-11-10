import { describe, expect, it } from 'vitest';
import { filterProducts, matchesQuery, normalizeArabic, priceBounds, type FilterableProduct } from '@/lib/search';
import { getProductSummaries } from '@/lib/catalog';

const item = (overrides: Partial<FilterableProduct>): FilterableProduct => ({
  id: 'x',
  name: 'منتج',
  brand: null,
  model: null,
  categoryName: 'قسم',
  categoryId: 'c',
  keywords: [],
  priceFils: null,
  sortOrder: 0,
  ...overrides,
});

describe('توحيد النص العربي', () => {
  it('يوحد الألف والتاء المربوطة والياء ويحذف التشكيل', () => {
    expect(normalizeArabic('إِطارُ الماكينةِ')).toBe('اطار الماكينه');
    expect(normalizeArabic('مُستشفى')).toBe('مستشفي');
    expect(normalizeArabic('٩٤ قطعة')).toBe('94 قطعه');
    expect(normalizeArabic('BS-300F')).toBe('bs 300f');
  });
});

describe('البحث', () => {
  const products = getProductSummaries();
  const find = (q: string) => products.filter((p) => matchesQuery(p, q)).map((p) => p.id);

  it('يجد المنتج بالاسم العربي مع اختلاف الهمزات والتعريف', () => {
    expect(find('ماكينه غسيل')).toEqual(['boss-bs-300f-pressure-washer', 'boss-bs-2070-pressure-washer']);
    expect(find('مفاتيح')).toEqual(['boss-94pc-socket-wrench-set', 'gs-lztop-94pc-socket-set']);
    expect(find('المفاتيح')).toEqual(['boss-94pc-socket-wrench-set', 'gs-lztop-94pc-socket-set']);
    expect(find('حقيبة')).toEqual(['rolling-tool-case-kit']);
    expect(find('بوكسات')).toEqual(['boss-94pc-socket-wrench-set', 'gs-lztop-94pc-socket-set']);
    expect(find('لقم')).toEqual(['boss-94pc-socket-wrench-set', 'gs-lztop-94pc-socket-set']);
    expect(find('منفاخ')).toEqual(['himk-mk326-jump-starter-inflator', 'car-jump-starter-6in1', 'boss-12v-tire-compressor']);
    expect(find('جامب ستارتر')).toEqual(['himk-mk326-jump-starter-inflator', 'car-jump-starter-6in1']);
    expect(find('mk326')).toEqual(['himk-mk326-jump-starter-inflator']);
  });

  it('يجد بالعلامة والموديل بصيغ مختلفة', () => {
    expect(find('gulfik')).toEqual(['gulfik-brushless-drill-kit', 'gulfik-brushless-impact-wrench-kit']);
    expect(find('lztop')).toEqual(['gs-lztop-94pc-socket-set']);
    expect(find('BS-300F')).toEqual(['boss-bs-300f-pressure-washer']);
    expect(find('bs300f')).toEqual(['boss-bs-300f-pressure-washer']);
    expect(find('bs 2070')).toEqual(['boss-bs-2070-pressure-washer']);
    expect(find('239-7')).toEqual(['boss-239-7-cordless-water-gun']);
    expect(find('٩٤')).toEqual(['boss-94pc-socket-wrench-set', 'gs-lztop-94pc-socket-set']);
  });

  it('يجد بالكلمات الدارجة', () => {
    expect(find('بلكات')).toEqual(['gulfik-brushless-impact-wrench-kit', 'boss-cordless-impact-wrench-kit']);
    expect(find('مفتاح تواير')).toEqual(['gulfik-brushless-impact-wrench-kit', 'boss-cordless-impact-wrench-kit']);
    expect(find('دريل')).toEqual(['gulfik-brushless-drill-kit', 'gulfik-brushless-impact-wrench-kit', 'boss-cordless-impact-wrench-kit']);
    expect(find('شنطة عدة')).toEqual(['rolling-tool-case-kit']);
    expect(find('187')).toEqual(['rolling-tool-case-kit']);
    expect(find('كمبروسر')).toEqual(['boss-12v-tire-compressor']);
  });

  it('لا يعيد نتائج لكلمات غير موجودة', () => {
    expect(find('ثلاجة')).toEqual([]);
  });
});

describe('التصفية والترتيب', () => {
  const list = [
    item({ id: 'a', name: 'ب', priceFils: 5000, sortOrder: 2, categoryId: 'c1' }),
    item({ id: 'b', name: 'أ', priceFils: null, sortOrder: 1, categoryId: 'c1' }),
    item({ id: 'c', name: 'ج', priceFils: 12000, sortOrder: 3, categoryId: 'c2' }),
  ];
  const base = { query: '', categoryId: null, minPrice: null, maxPrice: null, sort: 'featured' as const };

  it('يصفي حسب القسم', () => {
    expect(filterProducts(list, { ...base, categoryId: 'c2' }).map((p) => p.id)).toEqual(['c']);
  });

  it('نطاق السعر يستبعد غير المسعّر', () => {
    expect(filterProducts(list, { ...base, minPrice: 1000 }).map((p) => p.id)).toEqual(['a', 'c']);
    expect(filterProducts(list, { ...base, maxPrice: 6000 }).map((p) => p.id)).toEqual(['a']);
  });

  it('الترتيب بالسعر يضع غير المسعّر في النهاية دائمًا', () => {
    expect(filterProducts(list, { ...base, sort: 'price-asc' }).map((p) => p.id)).toEqual(['a', 'c', 'b']);
    expect(filterProducts(list, { ...base, sort: 'price-desc' }).map((p) => p.id)).toEqual(['c', 'a', 'b']);
  });

  it('الترتيب الافتراضي حسب sortOrder', () => {
    expect(filterProducts(list, base).map((p) => p.id)).toEqual(['b', 'a', 'c']);
  });

  it('حدود السعر تتجاهل غير المسعّر', () => {
    expect(priceBounds(list)).toEqual({ min: 5000, max: 12000 });
    expect(priceBounds([item({ priceFils: null })])).toBeNull();
  });
});
