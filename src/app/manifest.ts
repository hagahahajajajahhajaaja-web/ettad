import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.fullName,
    short_name: siteConfig.nameAr,
    description: `${siteConfig.description} — ${siteConfig.tagline}`,
    lang: 'ar',
    dir: 'rtl',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F7F5',
    theme_color: '#111820',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/brand/etaad-icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/etaad-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
