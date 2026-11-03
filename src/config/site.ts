/**
 * إعدادات المتجر القابلة للتعديل.
 * القيم الحساسة للإطلاق (الرابط، واتساب، التواصل) تُقرأ من متغيرات البيئة — انظر .env.example.
 * لا تضع أي أسرار هنا: هذا الملف يُضمَّن في كود المتصفح.
 */

const env = (value: string | undefined) => (value ?? '').trim();

/** يقبل 965 متبوعًا بـ 8 أرقام فقط (رقم كويتي بالصيغة الدولية بدون +). */
export const WHATSAPP_NUMBER_PATTERN = /^965[24569]\d{7}$/;

/**
 * رقم واتساب المتجر المعتمد من صاحب المتجر (+965 6997 6264).
 * رقم تواصل عام وليس سرًا؛ يمكن تجاوزه بالمتغير NEXT_PUBLIC_WHATSAPP_NUMBER (والعامل WHATSAPP_NUMBER).
 */
export const STORE_WHATSAPP_NUMBER = '96569976264';

function readWhatsAppNumber(raw: string): string | null {
  const digits = raw.replace(/[\s+\-()]/g, '');
  if (!digits) return null;
  if (!WHATSAPP_NUMBER_PATTERN.test(digits)) {
    throw new Error(
      `NEXT_PUBLIC_WHATSAPP_NUMBER غير صالح: "${raw}". المطلوب 965 ثم 8 أرقام بدون + أو مسافات، مثل 965XXXXXXXX.`,
    );
  }
  return digits;
}

export const DEFAULT_SITE_URL = 'http://localhost:3000';

function readSiteUrl(raw: string): string {
  if (!raw) return DEFAULT_SITE_URL;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`NEXT_PUBLIC_SITE_URL غير صالح: "${raw}"`);
  }
  return url.origin;
}

function readOptionalUrl(raw: string): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export const siteConfig = {
  nameAr: 'عتاد',
  nameEn: 'ETAAD',
  fullName: 'عتاد | ETAAD',
  description: 'معدات وأدوات للصيانة والعمل',
  /** سطر قصير يصف المتجر — البانر الرئيسي. */
  blurb: 'متجر معدات وأدوات في الكويت: غسيل، عدد يدوية، وأدوات للسيارة. الأسعار بالدينار الكويتي والطلب من الموقع.',
  /** وصف المتجر — الصفحة الرئيسية وصفحة «من نحن». بدون وعود غير معتمدة (ضمان، توصيل مجاني، خصومات). */
  about:
    'عتاد متجر إلكتروني في الكويت للمعدات والأدوات التي تحتاجها في الصيانة والعمل: ماكينات الغسيل بالضغط ومسدس الغسيل اللاسلكي، الدريل، أطقم البوكسات وشنطة العدة، ومفتاح التواير ومنفاخ الإطارات للسيارة. الأسعار بالدينار الكويتي، وتطلب من الموقع ونتواصل معك لتأكيد الطلب وموعد التوصيل.',
  tagline: 'عتادك لكل شغلة',
  market: 'الكويت',
  locale: 'ar_KW',
  currency: 'KWD',
  url: readSiteUrl(env(process.env.NEXT_PUBLIC_SITE_URL)),
  /** false إذا لم يُضبط الرابط النهائي بعد — عندها لا نضع روابط المنتجات داخل رسالة واتساب. */
  siteUrlConfigured: readSiteUrl(env(process.env.NEXT_PUBLIC_SITE_URL)) !== DEFAULT_SITE_URL,
  /** رقم واتساب المتجر (الافتراضي STORE_WHATSAPP_NUMBER). */
  whatsappNumber: readWhatsAppNumber(env(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER) || STORE_WHATSAPP_NUMBER),
  contact: {
    phone: env(process.env.NEXT_PUBLIC_CONTACT_PHONE) || null,
    email: env(process.env.NEXT_PUBLIC_CONTACT_EMAIL) || null,
    instagram: readOptionalUrl(env(process.env.NEXT_PUBLIC_INSTAGRAM_URL)),
  },
  /** الحد الأعلى لكمية المنتج الواحد في السلة (حماية من الإدخال الخاطئ). */
  maxQuantityPerItem: 20,
} as const;

export type SiteConfig = typeof siteConfig;
