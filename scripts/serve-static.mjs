/**
 * معاينة ناتج البناء محليًا (out/) عبر نفس خادم Cloudflare.
 * بدون قاعدة بيانات: المتجر يعمل ويعرض بديل واتساب، ولوحة التحكم تعرض أنها غير متاحة.
 * لتجربة الطلبات ولوحة التحكم محليًا: LOCAL_DB=1 ADMIN_KEY=مفتاح-تجريبي-طويل npm start
 */
import { startLocalPages } from './lib/local-pages.mjs';

const port = Number(process.env.PORT ?? 3000);
const env = {};
if (process.env.LOCAL_DB === '1') {
  const { createD1 } = await import('./lib/d1-sqlite.mjs');
  env.ETAAD_DB = createD1(process.env.LOCAL_DB_FILE ?? ':memory:');
  env.ADMIN_KEY = process.env.ADMIN_KEY ?? '';
  env.WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';
}
await startLocalPages({ outDir: process.env.OUT_DIR ?? 'out', port, env });
console.log(`عتاد ETAAD: http://localhost:${port}${env.ETAAD_DB ? ' (مع قاعدة بيانات محلية مؤقتة)' : ''}`);
