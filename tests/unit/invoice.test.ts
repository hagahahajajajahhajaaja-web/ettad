import { describe, expect, it } from 'vitest';
import { invoiceIsPriced, invoiceLines, invoiceWhatsAppText } from '@/lib/order/invoice';
import type { OrderRecord } from '@/lib/order/status';

const base: OrderRecord = {
  id: 'ET-261105-7KQ4',
  createdAt: Date.UTC(2026, 10, 5, 9, 0),
  updatedAt: Date.UTC(2026, 10, 5, 9, 0),
  status: 'confirmed',
  customer: { name: 'أحمد', phone: '51234567', area: 'السالمية', block: '10', street: '5', house: '12', notes: '' },
  items: [
    { id: 'a', name: 'ماكينة غسيل ضغط عالٍ BOSS BS-300F', model: 'BS-300F', quantity: 2, unitPriceFils: 35000 },
    { id: 'b', name: 'طقم بوكسات GS LZTOP من 94 قطعة', model: null, quantity: 1, unitPriceFils: 15000 },
  ],
  itemCount: 3,
  totalFils: 85000,
  adminNote: 'سري',
  paymentStatus: 'unpaid',
  paidAt: null,
  history: [],
};

describe('الفاتورة', () => {
  it('مجموع كل سطر = السعر × الكمية', () => {
    expect(invoiceLines(base).map((l) => l.lineTotalFils)).toEqual([70000, 15000]);
    expect(invoiceIsPriced(base)).toBe(true);
  });

  it('منتج بدون سعر: السطر والإجمالي «يُحدد» ولا تُعتبر جاهزة للإرسال', () => {
    const order = { ...base, totalFils: null, items: [{ ...base.items[0]!, unitPriceFils: null }] };
    expect(invoiceLines(order)[0]!.lineTotalFils).toBeNull();
    expect(invoiceIsPriced(order)).toBe(false);
    expect(invoiceWhatsAppText(order)).toContain('الإجمالي: يُحدد عند التأكيد');
  });

  it('نص واتساب: رقم الفاتورة، المنتجات، الإجمالي وحالة الدفع، بدون الملاحظة الداخلية', () => {
    const text = invoiceWhatsAppText(base);
    expect(text).toContain('رقم الفاتورة: ‎ET-261105-7KQ4');
    expect(text).toContain('× 2 = 70.000');
    expect(text).toContain('الإجمالي: 85.000');
    expect(text).toContain('حالة الدفع: غير مدفوع');
    expect(text).not.toContain('سري');
    expect(invoiceWhatsAppText({ ...base, paymentStatus: 'paid', paidAt: base.createdAt })).toContain('حالة الدفع: مدفوع');
  });
});
