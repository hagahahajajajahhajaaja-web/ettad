import { describe, expect, it } from 'vitest';
import { emptyCheckout, validateCheckout } from '@/lib/order/validation';
import { formatKuwaitPhone, normalizeKuwaitPhone } from '@/lib/phone';
import { sanitizeLine, sanitizeMultiline } from '@/lib/sanitize';

const valid = {
  ...emptyCheckout,
  name: 'أحمد محمد',
  phone: '5123 4567',
  area: 'السالمية',
  block: '10',
  street: 'شارع 5',
  house: 'منزل 12',
};

describe('رقم الهاتف الكويتي', () => {
  it.each([
    ['51234567', '51234567'],
    ['5123 4567', '51234567'],
    ['+965 6123-4567', '61234567'],
    ['0096591234567', '91234567'],
    ['96541234567', '41234567'],
    ['٥١٢٣٤٥٦٧', '51234567'],
    ['22345678', '22345678'],
  ])('يقبل %s', (input, expected) => {
    expect(normalizeKuwaitPhone(input)).toBe(expected);
  });

  it.each(['1234567', '512345678', '31234567', '71234567', 'abc', '', '+966512345678'])('يرفض %s', (input) => {
    expect(normalizeKuwaitPhone(input)).toBeNull();
  });

  it('ينسق الرقم للعرض', () => {
    expect(formatKuwaitPhone('51234567')).toBe('+965 5123 4567');
  });
});

describe('تنظيف المدخلات', () => {
  it('يحذف الأسطر الجديدة ومحارف الاتجاه الخفية ورموز تنسيق واتساب', () => {
    expect(sanitizeLine('أحمد\nالسعر: 0', 60)).toBe('أحمد السعر: 0');
    expect(sanitizeLine('a‮b‏c', 60)).toBe('abc');
    expect(sanitizeLine('*عريض* _مائل_ ~شطب~', 60)).toBe('عريض مائل شطب');
  });

  it('يقص النص للطول الأقصى', () => {
    expect(sanitizeLine('أ'.repeat(100), 10)).toHaveLength(10);
  });

  it('يحدد عدد أسطر الملاحظات', () => {
    expect(sanitizeMultiline('1\n2\n3\n4\n5\n6\n7\n8', 300).split('\n')).toHaveLength(6);
  });
});

describe('التحقق من نموذج الطلب', () => {
  it('يقبل بيانات صحيحة ويعيدها منظفة', () => {
    const result = validateCheckout({ ...valid, notes: 'الدور 2\n\nشقة 4' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.phone).toBe('51234567');
      expect(result.data.notes).toBe('الدور 2\nشقة 4');
    }
  });

  it('يرفض الحقول الإلزامية الفارغة برسائل عربية', () => {
    const result = validateCheckout(emptyCheckout);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(['area', 'block', 'house', 'name', 'phone', 'street']);
      expect(result.errors.phone).toMatch(/رقم هاتف كويتي/);
    }
  });

  it('يرفض اسمًا يحتوي أرقامًا أو رموزًا', () => {
    const result = validateCheckout({ ...valid, name: 'Ahmed123<script>' });
    expect(result.ok).toBe(false);
  });

  it('يرفض عنوانًا يحتوي رموز HTML', () => {
    expect(validateCheckout({ ...valid, street: '<img src=x>' }).ok).toBe(false);
  });

  it('الملاحظات اختيارية', () => {
    expect(validateCheckout({ ...valid, notes: '' }).ok).toBe(true);
  });
});
