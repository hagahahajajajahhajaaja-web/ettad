/**
 * يبني «معاينة خاصة» للمتجر كصفحة واحدة تُنشر على claude.ai (يراها صاحبها فقط).
 * تستخدم نفس مكونات الموقع الحقيقي، مع موجّه # وبدائل بسيطة لـ next/link و next/navigation.
 *
 * الناتج: preview-out/index.html + preview-out/images/** (الصور بمسارات نسبية)
 * التشغيل: npm run preview:build   (يحتاج بناء الموقع أولًا للحصول على CSS المجمّع)
 *
 * ليست بديلًا عن النشر الحقيقي: لا SEO ولا روابط مستقلة لكل صفحة.
 */
import { build } from 'esbuild';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'preview-out');
const env = (key) => JSON.stringify(process.env[key] ?? '');

// 1) CSS المجمّع من بناء Next (Tailwind) — بدون تعريفات الخطوط ذات المسارات المطلقة
const cssDir = path.join(root, 'out/_next/static/chunks');
if (!existsSync(cssDir)) throw new Error('شغّل npm run build أولًا (لا يوجد out/_next/static/chunks)');
const cssFiles = (await readdir(cssDir)).filter((f) => f.endsWith('.css'));
if (cssFiles.length === 0) throw new Error('لم يُعثر على CSS في ناتج البناء');
let css = (await Promise.all(cssFiles.map((f) => readFile(path.join(cssDir, f), 'utf8')))).join('\n');
css = css.replace(/@font-face\{[^}]*\}/g, ''); // خطوط Next بمسارات لا تعمل في المعاينة — نضيف خطوطنا كـ data URI

const font = async (file) => `data:font/woff2;base64,${(await readFile(path.join(root, 'src/fonts', file))).toString('base64')}`;
const fontCss = `@font-face{font-family:EtaadCairoAr;src:url(${await font('cairo-arabic.woff2')}) format('woff2');font-weight:200 1000;font-display:swap}
@font-face{font-family:EtaadCairoLt;src:url(${await font('cairo-latin.woff2')}) format('woff2');font-weight:200 1000;font-display:swap}
:root{--font-cairo-ar:EtaadCairoAr;--font-cairo-latin:EtaadCairoLt}`;

// 2) حزمة JavaScript واحدة
const result = await build({
  entryPoints: [path.join(root, 'preview/entry.tsx')],
  bundle: true,
  write: false,
  minify: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020', 'safari15'],
  jsx: 'automatic',
  tsconfig: path.join(root, 'tsconfig.json'),
  alias: {
    'next/link': path.join(root, 'preview/shims/next-link.tsx'),
    'next/navigation': path.join(root, 'preview/shims/next-navigation.ts'),
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.NEXT_PUBLIC_ASSETS_RELATIVE': '"1"',
    'process.env.NEXT_PUBLIC_STATIC_PREVIEW': '"1"',
    'process.env.NEXT_PUBLIC_SITE_URL': env('NEXT_PUBLIC_SITE_URL'),
    'process.env.NEXT_PUBLIC_WHATSAPP_NUMBER': env('NEXT_PUBLIC_WHATSAPP_NUMBER'),
    'process.env.NEXT_PUBLIC_CONTACT_PHONE': env('NEXT_PUBLIC_CONTACT_PHONE'),
    'process.env.NEXT_PUBLIC_CONTACT_EMAIL': env('NEXT_PUBLIC_CONTACT_EMAIL'),
    'process.env.NEXT_PUBLIC_INSTAGRAM_URL': env('NEXT_PUBLIC_INSTAGRAM_URL'),
  },
  logLevel: 'warning',
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

// 3) الصفحة — محتوى فقط: صفحات claude.ai تضيف هيكل المستند (doctype/head/body) عند النشر
const safeAreaCss = `header.sticky{top:env(safe-area-inset-top,0px)}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:45;background:#111820}
body{background:#f7f7f5;color:#111820}`;
const html = `<title>متجر عتاد | ETAAD</title>
<meta name="theme-color" content="#111820">
<script>document.documentElement.lang='ar';document.documentElement.dir='rtl';</script>
<style>${fontCss}\n${css}\n${safeAreaCss}</style>
<div id="root" class="flex min-h-dvh flex-col"></div>
<noscript>المتجر يحتاج تفعيل JavaScript.</noscript>
<script>${js}</script>
`;

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, 'index.html'), html);

// 4) الصور (WebP فقط — صور المشاركة JPEG لا تلزم في المعاينة)
await cp(path.join(root, 'public/images'), path.join(outDir, 'images'), {
  recursive: true,
  filter: (src) => !src.endsWith('-og.jpg'),
});

const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else files.push(path.relative(outDir, full));
  }
}
await walk(outDir);
console.log(`✓ preview-out/: ${files.length} ملف، index.html = ${(html.length / 1024).toFixed(0)}KB`);
await writeFile(path.join(outDir, 'files.json'), JSON.stringify(files.sort(), null, 2));
