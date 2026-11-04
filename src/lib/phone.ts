import { toLatinDigits } from '@/lib/format';

/**
 * أرقام الكويت المحلية: 8 أرقام.
 * تبدأ بـ 5 أو 6 أو 9 (جوال)، أو 4 (أرقام جوال أحدث)، أو 2 (أرضي).
 */
const LOCAL_PATTERN = /^[24569]\d{7}$/;

/** يحول المدخل إلى 8 أرقام محلية، أو null إذا لم يكن رقمًا كويتيًا صالحًا. */
export function normalizeKuwaitPhone(input: string): string | null {
  let digits = toLatinDigits(input).replace(/[\s\-().]/g, '');
  if (digits.startsWith('+965')) digits = digits.slice(4);
  else if (digits.startsWith('00965')) digits = digits.slice(5);
  else if (digits.length === 11 && digits.startsWith('965')) digits = digits.slice(3);
  if (!/^\d+$/.test(digits)) return null;
  return LOCAL_PATTERN.test(digits) ? digits : null;
}

/** عرض الرقم: 51234567 → «+965 5123 4567». */
export function formatKuwaitPhone(local: string): string {
  return `+965 ${local.slice(0, 4)} ${local.slice(4)}`;
}
