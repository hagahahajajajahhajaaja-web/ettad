import { z } from 'zod';
import { normalizeKuwaitPhone } from '@/lib/phone';
import { sanitizeLine, sanitizeMultiline } from '@/lib/sanitize';

export const LIMITS = {
  name: 60,
  area: 40,
  block: 10,
  street: 60,
  house: 40,
  notes: 300,
} as const;

const NAME_PATTERN = /^[\p{L}\p{M}\s.'-]+$/u;
const ADDRESS_PATTERN = /^[\p{L}\p{M}\p{N}\s.,/#()-]+$/u;

const line = (max: number) => z.string().transform((v) => sanitizeLine(v, max));

/**
 * التحقق من نموذج إتمام الطلب. كل الرسائل بالعربية وموجهة للعميل.
 * المخرجات منظفة وجاهزة لبناء رسالة واتساب.
 */
export const checkoutSchema = z.object({
  name: line(LIMITS.name).pipe(
    z
      .string()
      .min(2, 'اكتب الاسم (حرفان على الأقل)')
      .regex(NAME_PATTERN, 'الاسم يجب أن يحتوي على حروف فقط'),
  ),
  phone: z
    .string()
    .transform((v) => normalizeKuwaitPhone(v) ?? '')
    .pipe(z.string().min(1, 'اكتب رقم هاتف كويتي صحيحًا من 8 أرقام (مثل 5XXXXXXX)')),
  area: line(LIMITS.area).pipe(
    z.string().min(2, 'اكتب اسم المنطقة').regex(ADDRESS_PATTERN, 'المنطقة تحتوي على رموز غير مسموحة'),
  ),
  block: line(LIMITS.block).pipe(
    z.string().min(1, 'اكتب رقم القطعة').regex(ADDRESS_PATTERN, 'رقم القطعة يحتوي على رموز غير مسموحة'),
  ),
  street: line(LIMITS.street).pipe(
    z.string().min(1, 'اكتب اسم أو رقم الشارع').regex(ADDRESS_PATTERN, 'الشارع يحتوي على رموز غير مسموحة'),
  ),
  house: line(LIMITS.house).pipe(
    z.string().min(1, 'اكتب رقم المنزل أو المبنى').regex(ADDRESS_PATTERN, 'رقم المنزل يحتوي على رموز غير مسموحة'),
  ),
  notes: z
    .string()
    .optional()
    .default('')
    .transform((v) => sanitizeMultiline(v, LIMITS.notes)),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;
export type CheckoutField = keyof CheckoutInput;

export const emptyCheckout: Record<CheckoutField, string> = {
  name: '',
  phone: '',
  area: '',
  block: '',
  street: '',
  house: '',
  notes: '',
};

export type CheckoutResult =
  | { ok: true; data: CheckoutData }
  | { ok: false; errors: Partial<Record<CheckoutField, string>> };

export function validateCheckout(input: Record<CheckoutField, string>): CheckoutResult {
  const parsed = checkoutSchema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };
  const errors: Partial<Record<CheckoutField, string>> = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as CheckoutField | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return { ok: false, errors };
}
