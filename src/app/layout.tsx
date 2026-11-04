import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import { JsonLd } from '@/components/ui/JsonLd';
import { NoticeProvider } from '@/components/ui/Notices';
import { siteConfig } from '@/config/site';
import { pageMetadata } from '@/lib/seo';
import { absoluteUrl } from '@/lib/urls';
import './globals.css';

const cairoArabic = localFont({
  src: '../fonts/cairo-arabic.woff2',
  variable: '--font-cairo-ar',
  weight: '200 1000',
  display: 'swap',
  preload: true,
});

const cairoLatin = localFont({
  src: '../fonts/cairo-latin.woff2',
  variable: '--font-cairo-latin',
  weight: '200 1000',
  display: 'swap',
  preload: true,
});

const base = pageMetadata({
  description: `${siteConfig.nameAr} | ${siteConfig.nameEn}: ${siteConfig.description} في ${siteConfig.market}. ماكينات الغسيل بالضغط العالي، الأدوات الكهربائية، أطقم العدة ومعدات السيارات — اطلب أونلاين.`,
  path: '/',
});

export const metadata: Metadata = {
  ...base,
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.fullName} — ${siteConfig.description} في ${siteConfig.market}`, template: `%s | ${siteConfig.fullName}` },
  applicationName: siteConfig.fullName,
  formatDetection: { telephone: false, address: false, email: false },
  appleWebApp: { title: siteConfig.nameAr, statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#111820',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairoArabic.variable} ${cairoLatin.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only z-[60] bg-orange px-4 py-3 font-bold text-ink focus:not-sr-only focus:fixed focus:start-3 focus:top-3"
        >
          تخطَّ إلى المحتوى
        </a>
        <NoticeProvider>{children}</NoticeProvider>
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'OnlineStore',
            name: siteConfig.fullName,
            alternateName: [siteConfig.nameAr, siteConfig.nameEn],
            description: siteConfig.description,
            slogan: siteConfig.tagline,
            url: absoluteUrl('/'),
            logo: absoluteUrl('/brand/etaad-logo.png'),
            areaServed: { '@type': 'Country', name: 'Kuwait' },
          }}
        />
      </body>
    </html>
  );
}
