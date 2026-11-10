import { existsSync } from 'node:fs';
import path from 'node:path';
import { DELIVERY_REFUSAL_TERM, RETURN_POLICY_TERMS } from '@/config/terms';
import { describe, expect, it } from 'vitest';
import { categories } from '@/data/categories';
import { products } from '@/data/products';
import { policies } from '@/data/policies';
import { activeCategoriesOf, buildCatalog, CatalogError, getActiveCategories, getAllProducts } from '@/lib/catalog';
import { policySchema } from '@/lib/schema';

const visibleText = (p: ReturnType<typeof getAllProducts>[number]) =>
  [p.name, p.summary, p.useLine, ...p.uses, ...p.highlights, ...p.description, ...p.contents, ...p.pendingVerification, ...p.specs.map((s) => `${s.label} ${s.value}`)].join(' ');

describe('بيانات الكتالوج', () => {
  it('تحتوي المنتجات بالترتيب والأقسام الصحيحة', () => {
    expect(getAllProducts().map((p) => [p.id, p.categoryId])).toEqual([
      ['himk-mk326-jump-starter-inflator', 'car-tools'],
      ['car-jump-starter-6in1', 'car-tools'],
      ['boss-bs-300f-pressure-washer', 'washing-cleaning'],
      ['boss-bs-2070-pressure-washer', 'washing-cleaning'],
      ['boss-239-7-cordless-water-gun', 'washing-cleaning'],
      ['gulfik-brushless-drill-kit', 'power-tools'],
      ['boss-94pc-socket-wrench-set', 'hand-tools'],
      ['gs-lztop-94pc-socket-set', 'hand-tools'],
      ['rolling-tool-case-kit', 'hand-tools'],
      ['gulfik-brushless-impact-wrench-kit', 'car-tools'],
      ['boss-cordless-impact-wrench-kit', 'car-tools'],
      ['boss-12v-tire-compressor', 'car-tools'],
    ]);
  });

  it('الأسعار هي التي اعتمدها صاحب المتجر فقط، والتوفر غير مدّعى', () => {
    // من محادثة صاحب المتجر (واتساب 2026-11-01). الدريل GULFIK لم يُذكر سعره → «استفسر عن السعر».
    const approved: Record<string, number | null> = {
      'boss-bs-300f-pressure-washer': 35000,
      'boss-bs-2070-pressure-washer': 30000,
      'boss-239-7-cordless-water-gun': 20000,
      'gulfik-brushless-drill-kit': null,
      'boss-cordless-impact-wrench-kit': 25000,
      'boss-94pc-socket-wrench-set': 20000,
      'gs-lztop-94pc-socket-set': 15000,
      'rolling-tool-case-kit': 29000, // عدّله صاحب المتجر (2026-11-06)
      'himk-mk326-jump-starter-inflator': 18000, // سعر صاحب المتجر (2026-11-10)
      'car-jump-starter-6in1': 26000, // سعر صاحب المتجر (2026-11-06)
      'gulfik-brushless-impact-wrench-kit': 30000,
      'boss-12v-tire-compressor': 17000,
    };
    expect(Object.fromEntries(getAllProducts().map((p) => [p.id, p.priceFils]))).toEqual(approved);
    for (const product of getAllProducts()) expect(product.availability).toBe('unconfirmed');
  });

  it('لا تحتوي ادعاءات غير مؤكدة في النصوص المعروضة', () => {
    const forbidden = /(ألماني|ألمانيا|german|صنع في|ضمان\s+\d|ضمان لمدة|سنة ضمان|خصم|تقييم|معتمد من|شهادة|ISO|الأفضل|الأقوى|نحاس|copper|professional|احترافي)/i;
    for (const product of getAllProducts()) {
      expect(visibleText(product), product.id).not.toMatch(forbidden);
    }
  });

  it('مفاتيح التواير تُسمى «مفتاح تواير السيارة» بدون «بلكات» أو «صدمات» (طلب صاحب المتجر)', () => {
    for (const product of getAllProducts()) expect(visibleText(product), product.id).not.toMatch(/بلكات|صدمات/);
    const names = getAllProducts().filter((p) => p.categoryId === 'car-tools').map((p) => p.name);
    expect(names).toEqual(['بطارية الطوارئ 4 في 1 HiMK MK-326', 'جهاز تشغيل السيارة 6 في 1 (جامب ستارتر)', 'مفتاح تواير السيارة GULFIK', 'مفتاح تواير السيارة BOSS', 'منفاخ إطارات محمول 12 فولت BOSS']);
  });

  it('لكل منتج سطر استخدام قصير وقائمة استخدامات', () => {
    for (const product of getAllProducts()) {
      expect(product.useLine.length, product.id).toBeLessThanOrEqual(45);
      expect(product.uses.length, product.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('لا تنشر أرقام جهد البطاريات التسويقية (288V / 88V) كمواصفة', () => {
    for (const product of getAllProducts()) {
      for (const spec of product.specs) expect(spec.value, product.id).not.toMatch(/\b2?88\s*V/i);
    }
  });

  it('مواصفات العلبة منسوبة لمصدرها', () => {
    const washer = getAllProducts().find((p) => p.id === 'boss-bs-300f-pressure-washer')!;
    expect(washer.specs).toContainEqual({ label: 'ضغط التشغيل', value: '360 بار', source: 'packaging' });
    expect(washer.specs).toContainEqual({ label: 'قدرة الدخل', value: '3600 واط', source: 'packaging' });
    // ظهرت كاملة في صورة العلبة الجديدة بعد أن كانت تحت شريط التغليف
    expect(washer.specs).toContainEqual({ label: 'معدل التدفق', value: '12 لتر/دقيقة', source: 'packaging' });
    expect(washer.specs).toContainEqual({ label: 'سرعة المحرك', value: '2850 دورة/دقيقة', source: 'packaging' });
    const bs2070 = getAllProducts().find((p) => p.id === 'boss-bs-2070-pressure-washer')!;
    expect(bs2070.specs).toContainEqual({ label: 'معدل التدفق', value: '10 لتر/دقيقة', source: 'packaging' });
  });

  it('محتويات طقم الـ 94 قطعة مجموعها 94', () => {
    const set = getAllProducts().find((p) => p.id === 'boss-94pc-socket-wrench-set')!;
    const total = set.contents.reduce((sum, line) => {
      const counted = /^(\d+) /.exec(line);
      if (counted) return sum + Number(counted[1]);
      if (line.startsWith('بوكسين')) return sum + 2;
      if (line.startsWith('ملحقات 1/4')) return sum + 8; // سقاطة + 2 تمديد + T + مفصلية + دوار + دوار مرن + محول
      if (line.startsWith('ملحقات 1/2')) return sum + 6; // سقاطة + 2 تمديد + مفصلية + حامل رؤوس + محول
      return sum;
    }, 0);
    expect(total).toBe(94);
  });

  it('عدد الصور لكل منتج كما في product-photos/SOURCES.md', () => {
    const counts = Object.fromEntries(getAllProducts().map((p) => [p.id, p.images.length]));
    expect(counts).toEqual({
      'boss-bs-300f-pressure-washer': 1,
      'boss-bs-2070-pressure-washer': 4,
      'boss-239-7-cordless-water-gun': 2,
      'gulfik-brushless-drill-kit': 1,
      'boss-cordless-impact-wrench-kit': 1,
      'boss-94pc-socket-wrench-set': 2,
      'gs-lztop-94pc-socket-set': 1,
      'rolling-tool-case-kit': 2,
      'car-jump-starter-6in1': 4,
      'himk-mk326-jump-starter-inflator': 1,
      'gulfik-brushless-impact-wrench-kit': 2,
      'boss-12v-tire-compressor': 1,
    });
  });

  it('لكل صورة وصف بديل يصفها', () => {
    for (const product of getAllProducts()) {
      expect(product.imageAlts.length, product.id).toBe(product.images.length);
    }
  });

  it('كل ملفات الصور المشار إليها موجودة', () => {
    for (const product of getAllProducts()) {
      for (const image of product.images) {
        for (const w of image.widths) {
          expect(existsSync(path.join('public', `${image.base}-${w}.webp`)), `${image.base}-${w}`).toBe(true);
        }
        expect(image.og && existsSync(path.join('public', image.og))).toBe(true);
      }
    }
  });

  it('كل الأقسام النشطة فيها منتجات، والأقسام الفارغة تُخفى', () => {
    expect(getActiveCategories().every((c) => c.productCount > 0)).toBe(true);
    const extra = [...categories, { ...categories[0]!, id: 'empty-future', sortOrder: 99 }];
    expect(activeCategoriesOf(extra, products).map((c) => c.id)).not.toContain('empty-future');
  });

  it('يرفض منتجًا يشير إلى قسم غير موجود', () => {
    const broken = [{ ...products[0]!, categoryId: 'missing-category' }];
    expect(() => buildCatalog({ categories, products: broken, images: {} })).toThrow(CatalogError);
  });

  it('يرفض المعرّفات المكررة', () => {
    expect(() => buildCatalog({ categories, products: [products[0]!, products[0]!], images: {} })).toThrow(/مكرر/);
  });

  it('يرفض صورًا لمنتج غير موجود', () => {
    const images = { 'not-a-product': [{ base: '/images/products/not-a-product/01', width: 960, height: 960, widths: [480, 960] }] };
    expect(() => buildCatalog({ categories, products, images })).toThrow(/غير موجود/);
  });

  it('يرفض سعرًا غير صالح', () => {
    const broken = [{ ...products[0]!, priceFils: -5 }];
    expect(() => buildCatalog({ categories, products: broken, images: {} })).toThrow();
  });

  it('السياسات صالحة والسياسات غير المعتمدة بلا محتوى التزامي', () => {
    for (const policy of policies) {
      expect(() => policySchema.parse(policy)).not.toThrow();
      if (policy.status === 'pending') expect(policy.sections).toHaveLength(0);
    }
    expect(policies.find((p) => p.slug === 'warranty')?.status).toBe('pending');
    // الاسترجاع: نص قانون حماية المستهلك (14 يومًا بلا تكلفة إضافية) فقط، بدون شروط إضافية
    const returns = policies.find((p) => p.slug === 'returns')!;
    expect(returns.status).toBe('approved');
    expect(returns.sections.flatMap((s) => s.body)).toEqual([...RETURN_POLICY_TERMS]);
    expect(RETURN_POLICY_TERMS[0]).toContain('14 يومًا');
    expect(RETURN_POLICY_TERMS[0]).toContain('دون أي تكلفة إضافية');
    // سياسة التوصيل: البند الوحيد المعتمد من صاحب المتجر هو تحمل قيمة التوصيل عند عدم الاستلام
    const delivery = policies.find((p) => p.slug === 'delivery')!;
    expect(delivery.status).toBe('approved');
    expect(delivery.sections.flatMap((s) => s.body)).toEqual([DELIVERY_REFUSAL_TERM]);
  });
});
