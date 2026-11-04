import { describe, expect, it } from 'vitest';
import { STORE_WHATSAPP_NUMBER, WHATSAPP_NUMBER_PATTERN, siteConfig } from '@/config/site';
import {
  buildOrderMessage,
  buildProductInquiryMessage,
  buildWhatsAppUrl,
  computeTotals,
  displayWhatsAppNumber,
  type OrderLine,
} from '@/lib/order/whatsapp';
import type { CheckoutData } from '@/lib/order/validation';

const customer: CheckoutData = {
  name: 'أحمد',
  phone: '51234567',
  area: 'حولي',
  block: '3',
  street: 'شارع تونس',
  house: 'مبنى 7',
  notes: 'الدور الثاني',
};

const unpriced: OrderLine = {
  id: 'boss-bs-300f-pressure-washer',
  name: 'ماكينة غسيل ضغط عالٍ BOSS BS-300F',
  model: 'BS-300F',
  quantity: 2,
  priceFils: null,
  availability: 'unconfirmed',
  url: 'https://etaad.example/products/boss-bs-300f-pressure-washer/',
};

const priced: OrderLine = { ...unpriced, id: 'p', name: 'منتج مسعّر', model: null, quantity: 3, priceFils: 4250, availability: 'in_stock', url: null };

describe('رسالة طلب واتساب', () => {
  const message = buildOrderMessage(customer, [unpriced]);

  it('تحتوي كل بيانات العميل والعنوان والمنتجات والكميات', () => {
    for (const text of ['أحمد', '+965 5123 4567', 'المنطقة: حولي', 'القطعة: 3', 'الشارع: شارع تونس', 'المنزل/المبنى: مبنى 7', '- الدور الثاني']) {
      expect(message).toContain(text);
    }
    expect(message).toContain('ماكينة غسيل ضغط عالٍ BOSS BS-300F');
    expect(message).toContain('الكمية: 2');
    // الموديل ظاهر في الاسم فلا يتكرر في سطر مستقل
    expect(message).not.toContain('الموديل:');
    expect(message).toContain('السعر: استفسر عن السعر');
    expect(message).not.toContain('الحالة:'); // التوفر غير المحدد لا يُكتب في الرسالة
    expect(message).toContain(unpriced.url);
  });

  it('رقم الهاتف لا يظهر مقلوبًا في واتساب (علامة اتجاه قبل الرقم)', () => {
    expect(message).toContain('الهاتف: \u200E+965 5123 4567');
  });

  it('يكتب الموديل في سطر مستقل إذا لم يكن في الاسم', () => {
    const other = buildOrderMessage(customer, [{ ...unpriced, name: 'ماكينة غسيل', model: 'BS-300F' }]);
    expect(other).toContain('الموديل: BS-300F');
  });

  it('تصف الطلب كطلب مبدئي ولا تدعي التأكيد ولا تحتوي رقم طلب', () => {
    expect(message).toContain('طلب مبدئي بانتظار تأكيد المتجر');
    expect(message).not.toMatch(/تم تأكيد|مؤكد|رقم الطلب|#\d+/);
  });

  it('لا تعرض إجماليًا نهائيًا عند وجود منتجات غير مسعّرة', () => {
    expect(message).toContain('الإجمالي يحدده المتجر بعد تأكيد الأسعار');
    const mixed = buildOrderMessage(customer, [unpriced, priced]);
    expect(mixed).toContain('مجموع المنتجات المسعّرة: 12.750 د.ك');
    expect(mixed).toContain('منتجات بانتظار التسعير: 1');
  });

  it('تعرض المجموع عندما تكون كل الأسعار معتمدة دون رسوم توصيل مخترعة', () => {
    const full = buildOrderMessage(customer, [priced]);
    expect(full).toContain('مجموع المنتجات: 12.750 د.ك');
    expect(full).toContain('لا يشمل أي رسوم توصيل');
  });

  it('ترفض طلبًا بلا منتجات', () => {
    expect(() => buildOrderMessage(customer, [])).toThrow();
  });

  it('رابط واتساب يرمّز الرسالة ويستخدم رقم المتجر فقط', () => {
    const url = buildWhatsAppUrl('96550000000', message);
    expect(url).toMatch(/^https:\/\/wa\.me\/96550000000\?text=/);
    expect(decodeURIComponent(url!.split('text=')[1]!)).toBe(message);
  });

  it('لا يُنشئ رابطًا إذا لم يُضبط رقم المتجر', () => {
    expect(buildWhatsAppUrl(null, message)).toBeNull();
  });

  it('رسالة الاستفسار عن منتج', () => {
    const inquiry = buildProductInquiryMessage({ name: 'طقم', model: null, priceFils: null }, null);
    expect(inquiry).toContain('الاستفسار عن سعر المنتج');
    expect(inquiry).toContain('طقم');
    const priced = buildProductInquiryMessage({ name: 'ماكينة', model: 'BS-300F', priceFils: 35000 }, 'https://etaad.example/products/x/');
    expect(priced).toContain('الاستفسار عن المنتج:');
    expect(priced).toContain('الموديل: BS-300F');
    expect(priced).toContain('https://etaad.example/products/x/');
  });
});

describe('حساب الإجمالي', () => {
  it('يجمع المسعّر فقط ويعد غير المسعّر', () => {
    expect(computeTotals([unpriced, priced])).toEqual({ pricedSubtotalFils: 12750, unpricedCount: 1, itemCount: 5, complete: false });
    expect(computeTotals([priced]).complete).toBe(true);
    expect(computeTotals([]).complete).toBe(false);
  });
});

describe('رقم واتساب المتجر', () => {
  it('الرقم المعتمد صالح ويُستخدم افتراضيًا ويُعرض بشكل مقروء', () => {
    expect(STORE_WHATSAPP_NUMBER).toMatch(WHATSAPP_NUMBER_PATTERN);
    if (!process.env.NEXT_PUBLIC_WHATSAPP_NUMBER) expect(siteConfig.whatsappNumber).toBe(STORE_WHATSAPP_NUMBER);
    expect(displayWhatsAppNumber('96569976264')).toBe('+965 6997 6264');
  });
});
