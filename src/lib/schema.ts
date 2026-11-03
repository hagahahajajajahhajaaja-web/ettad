import { z } from 'zod';

/** معرّف آمن للروابط: أحرف إنجليزية صغيرة وأرقام وشرطات. */
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'المعرّف يجب أن يكون أحرفًا إنجليزية صغيرة وأرقامًا وشرطات فقط');

/**
 * حالة التوفر.
 * - unconfirmed: التوفر قيد التأكيد (الافتراضي إلى أن يعتمد المتجر المخزون)
 * - in_stock: متوفر
 * - out_of_stock: غير متوفر حاليًا
 */
export const availabilitySchema = z.enum(['unconfirmed', 'in_stock', 'out_of_stock']);

/**
 * مصدر المعلومة — يُعرض للعميل بجانب كل مواصفة:
 * - store: أكدها المتجر
 * - packaging: منقولة حرفيًا من علبة المصنع (لم يختبرها المتجر)
 * - marking: مطبوعة على المنتج نفسه
 * - photo: ظاهرة في صورة المنتج الفعلية
 */
export const infoSourceSchema = z.enum(['store', 'packaging', 'marking', 'photo']);

export const specSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  source: infoSourceSchema.default('store'),
});

export const categorySchema = z.object({
  id: slugSchema,
  name: z.string().min(2),
  shortName: z.string().min(2),
  description: z.string().min(10),
  icon: z.enum(['washer', 'sockets', 'toolcase', 'power', 'compressor', 'generic']),
  sortOrder: z.number().int(),
});

export const productSchema = z.object({
  /** معرّف ثابت يُستخدم في السلة والرابط. لا تغيّره بعد الإطلاق. */
  id: slugSchema,
  name: z.string().min(3),
  brand: z.string().min(1).nullable(),
  model: z.string().min(1).nullable(),
  categoryId: slugSchema,
  /** وصف مختصر يحتوي على معلومات مؤكدة فقط. */
  summary: z.string().min(10),
  /** استخدام المنتج في سطر قصير — يظهر تحت الاسم في بطاقة المنتج حتى يعرف العميل فائدته مباشرة. */
  useLine: z.string().min(5).max(45),
  /** استخدامات المنتج بكلمات بسيطة — تظهر في صفحة المنتج تحت «يُستخدم في». */
  uses: z.array(z.string().min(3)).min(2).max(5),
  /** نقاط مختصرة وسهلة للعميل تظهر أعلى صفحة المنتج (3–4 نقاط). */
  highlights: z.array(z.string().min(3)).max(6).default([]),
  /** وصف تفصيلي (فقرات) — معلومات مؤكدة أو منسوبة لمصدرها فقط. */
  description: z.array(z.string().min(10)).default([]),
  /** محتويات العلبة/الطقم. */
  contents: z.array(z.string().min(2)).default([]),
  contentsSource: infoSourceSchema.default('store'),
  /** السعر بالفلس (1 د.ك = 1000 فلس). null = «استفسر عن السعر». */
  priceFils: z.number().int().positive().nullable(),
  availability: availabilitySchema,
  /** مواصفات مؤكدة فقط. */
  specs: z.array(specSchema),
  /** معلومات معروف أنها ناقصة وتنتظر التحقق — تُعرض للعميل بوضوح. */
  pendingVerification: z.array(z.string().min(2)),
  /** كلمات بحث مرادفة (لا تُعرض كادعاءات). */
  keywords: z.array(z.string()),
  /** نص بديل لكل صورة بالترتيب (اختياري). */
  imageAlts: z.array(z.string()).default([]),
  featured: z.boolean(),
  sortOrder: z.number().int(),
  /** ملاحظات داخلية لا تظهر في الموقع. */
  internalNotes: z.array(z.string()).default([]),
  updatedAt: z.iso.date(),
});

export const productImageSchema = z.object({
  /** المسار الأساسي بدون المقاس والامتداد، مثل /images/products/boss-bs-300f/01 */
  base: z.string().startsWith('/images/products/'),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** المقاسات المولدة بالعرض (px) */
  widths: z.array(z.number().int().positive()).min(1),
  /** نسخة JPEG ‏1200×630 لمعاينة الروابط (واتساب وغيره) */
  og: z.string().startsWith('/images/products/').optional(),
});

export const productImageManifestSchema = z.record(slugSchema, z.array(productImageSchema));

export const policySchema = z.object({
  slug: slugSchema,
  title: z.string().min(2),
  /**
   * approved: معتمدة ومنشورة.
   * describes-current-operation: تصف آلية عمل الموقع الحالية تقنيًا (ليست التزامًا تجاريًا جديدًا).
   * pending: لم تُعتمد — لا يُنشر أي محتوى التزامي.
   */
  status: z.enum(['approved', 'describes-current-operation', 'pending']),
  summary: z.string().min(10),
  sections: z.array(z.object({ heading: z.string().min(2), body: z.array(z.string().min(2)) })),
  updatedAt: z.iso.date(),
});

export type Availability = z.infer<typeof availabilitySchema>;
export type InfoSource = z.infer<typeof infoSourceSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Product = z.infer<typeof productSchema>;
export type ProductInput = z.input<typeof productSchema>;
export type ProductImage = z.infer<typeof productImageSchema>;
export type Policy = z.infer<typeof policySchema>;
