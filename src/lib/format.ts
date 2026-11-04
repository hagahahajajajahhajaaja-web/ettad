import type { Availability } from '@/lib/schema';

const kwd = new Intl.NumberFormat('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

/** يحول الفلس إلى نص بالدينار الكويتي: 12500 → «12.500 د.ك». */
export function formatKwd(fils: number): string {
  return `${kwd.format(fils / 1000)} د.ك`;
}

export const PRICE_ON_REQUEST = 'استفسر عن السعر';

export function formatPrice(fils: number | null): string {
  return fils === null ? PRICE_ON_REQUEST : formatKwd(fils);
}

export const availabilityLabels: Record<Availability, string> = {
  unconfirmed: 'التوفر قيد التأكيد',
  in_stock: 'متوفر',
  out_of_stock: 'غير متوفر حاليًا',
};

export function canAddToCart(availability: Availability): boolean {
  return availability !== 'out_of_stock';
}

/** يحول دينار مكتوب (قد يحتوي أرقامًا عربية) إلى فلس، أو null إذا كان غير صالح. */
export function parseKwdToFils(input: string): number | null {
  const normalized = toLatinDigits(input).replace(/[٫,]/g, '.').trim();
  if (!/^\d+(\.\d{1,3})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 1000);
}

/** يحول الأرقام العربية (٠-٩) والفارسية (۰-۹) إلى أرقام لاتينية. */
export function toLatinDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/** صيغ العدد العربية: منتج واحد، منتجان، 3 منتجات، 11 منتجًا. */
function arabicCount(n: number, forms: { one: string; two: string; few: string; many: string }): string {
  if (n === 1) return forms.one;
  if (n === 2) return forms.two;
  const mod100 = n % 100;
  if (mod100 >= 3 && mod100 <= 10) return `${n} ${forms.few}`;
  return `${n} ${forms.many}`;
}

export const countProducts = (n: number) =>
  arabicCount(n, { one: 'منتج واحد', two: 'منتجان', few: 'منتجات', many: 'منتجًا' });

export const countPieces = (n: number) => arabicCount(n, { one: 'قطعة واحدة', two: 'قطعتان', few: 'قطع', many: 'قطعة' });
