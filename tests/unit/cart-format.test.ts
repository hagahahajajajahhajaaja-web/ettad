import { describe, expect, it } from 'vitest';
import { addItem, clampQuantity, parseStoredCart, removeItem, serializeCart, setItemQuantity } from '@/lib/cart/store';
import { countPieces, countProducts, formatKwd, formatPrice, parseKwdToFils } from '@/lib/format';

const MAX = 20;

describe('منطق السلة', () => {
  it('يضيف ويدمج ويحصر الكمية', () => {
    let state = addItem({ items: [] }, 'a', 2, MAX);
    state = addItem(state, 'a', 3, MAX);
    expect(state.items).toEqual([{ id: 'a', quantity: 5 }]);
    state = addItem(state, 'a', 100, MAX);
    expect(state.items[0]?.quantity).toBe(MAX);
  });

  it('يعدل الكمية ويحذف', () => {
    let state = addItem({ items: [] }, 'a', 1, MAX);
    state = addItem(state, 'b', 1, MAX);
    state = setItemQuantity(state, 'a', 0, MAX);
    expect(state.items[0]?.quantity).toBe(1);
    state = removeItem(state, 'a');
    expect(state.items.map((i) => i.id)).toEqual(['b']);
  });

  it('clampQuantity يتعامل مع القيم غير الصالحة', () => {
    expect(clampQuantity(Number.NaN, MAX)).toBe(1);
    expect(clampQuantity(-3, MAX)).toBe(1);
    expect(clampQuantity(2.7, MAX)).toBe(2);
  });

  it('يقرأ السلة المحفوظة بأمان ويتجاهل التالف وغير المعروف', () => {
    const known = new Set(['a', 'b']);
    expect(parseStoredCart('{not json', known, MAX).items).toEqual([]);
    expect(parseStoredCart(JSON.stringify({ v: 2, items: [] }), known, MAX).items).toEqual([]);
    const raw = JSON.stringify({ v: 1, items: [{ id: 'a', quantity: 50 }, { id: 'zzz', quantity: 1 }, { id: 'a', quantity: 1 }] });
    expect(parseStoredCart(raw, known, MAX).items).toEqual([{ id: 'a', quantity: MAX }]);
    expect(parseStoredCart(serializeCart({ items: [{ id: 'b', quantity: 3 }] }), known, MAX).items).toEqual([{ id: 'b', quantity: 3 }]);
  });
});

describe('تنسيق العملة والأعداد', () => {
  it('ينسق الدينار الكويتي بثلاث خانات عشرية', () => {
    expect(formatKwd(12500)).toBe('12.500 د.ك');
    expect(formatKwd(1234567)).toBe('1,234.567 د.ك');
    expect(formatPrice(null)).toBe('استفسر عن السعر');
  });

  it('يحول المدخل النصي إلى فلس', () => {
    expect(parseKwdToFils('12.5')).toBe(12500);
    expect(parseKwdToFils('١٢٫٥')).toBe(12500);
    expect(parseKwdToFils('abc')).toBeNull();
    expect(parseKwdToFils('1.2345')).toBeNull();
  });

  it('صيغ العدد العربية', () => {
    expect(countProducts(1)).toBe('منتج واحد');
    expect(countProducts(2)).toBe('منتجان');
    expect(countProducts(3)).toBe('3 منتجات');
    expect(countProducts(11)).toBe('11 منتجًا');
    expect(countPieces(1)).toBe('قطعة واحدة');
    expect(countPieces(5)).toBe('5 قطع');
  });
});
