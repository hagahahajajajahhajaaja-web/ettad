/**
 * بناء الإنتاج: next build ثم خادم Cloudflare (out/_worker.js).
 *
 * على Cloudflare Pages، نشر الفرع الرئيسي main يستخدم نطاق المتجر etaadq8.com تلقائيًا
 * (Sitemap وروابط المنتجات في رسالة واتساب). ضبط NEXT_PUBLIC_SITE_URL في لوحة Cloudflare يتقدم عليه دائمًا.
 * معاينات الفروع الأخرى لا تأخذ النطاق حتى لا تشير روابطها إلى الموقع الحقيقي بالخطأ.
 */
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const PRODUCTION_SITE_URL = 'https://etaadq8.com';
export const PRODUCTION_BRANCH = 'main';

/** يرجع NEXT_PUBLIC_SITE_URL المناسب للبناء، أو '' إذا لم يُضبط وليس بناء إنتاج على Pages. */
export function resolveSiteUrl(env) {
  const explicit = (env.NEXT_PUBLIC_SITE_URL ?? '').trim();
  if (explicit) return explicit;
  if (env.CF_PAGES === '1' && env.CF_PAGES_BRANCH === PRODUCTION_BRANCH) return PRODUCTION_SITE_URL;
  return '';
}

function run(command, args, env) {
  const result = spawnSync(command, args, { env, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const env = { ...process.env };
  const siteUrl = resolveSiteUrl(env);
  if (siteUrl) env.NEXT_PUBLIC_SITE_URL = siteUrl;
  console.log(`رابط الموقع للبناء: ${siteUrl || '(غير مضبوط — روابط محلية)'}`);
  run('npx', ['next', 'build'], env);
  run('node', ['scripts/build-worker.mjs'], env);
}
