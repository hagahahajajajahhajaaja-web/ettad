import type { NextConfig } from 'next';

/**
 * عتاد | ETAAD — تصدير ثابت (Static Export).
 * الناتج في مجلد out/ ويمكن رفعه على أي استضافة ملفات ثابتة (Cloudflare Pages، Netlify، S3...).
 * لا يوجد خادم ولا قاعدة بيانات في هذه المرحلة: الطلبات تُرسل عبر واتساب من جهاز العميل.
 */
const nextConfig: NextConfig = {
  output: 'export',
  // بناء الاختبارات الآلية يُكتب في مجلد منفصل حتى لا يختلط أبدًا بناتج الإنتاج out/
  ...(process.env.ETAAD_E2E_BUILD === '1' ? { distDir: 'out-e2e' } : {}),
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // الصور تُحسَّن مسبقًا عبر scripts/optimize-images.mjs (WebP بعدة مقاسات)
    unoptimized: true,
  },
};

export default nextConfig;
