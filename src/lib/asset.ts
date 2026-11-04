/**
 * مسار الملفات الثابتة (الصور). في الموقع الحقيقي المسار مطلق (/images/...).
 * في المعاينة الخاصة على claude.ai تُحمَّل الملفات بمسار نسبي، فيُحذف «/» الأول.
 */
const relative = process.env.NEXT_PUBLIC_ASSETS_RELATIVE === '1';

export function assetUrl(path: string): string {
  return relative ? path.replace(/^\//, '') : path;
}
