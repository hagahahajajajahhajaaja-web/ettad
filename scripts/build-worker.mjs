/**
 * يبني خادم Cloudflare (worker/index.ts) إلى out/_worker.js بصيغة ES module (Pages Advanced mode).
 * يُستدعى تلقائيًا ضمن npm run build بعد next build.
 */
import { build } from 'esbuild';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, process.env.ETAAD_E2E_BUILD === '1' ? 'out-e2e' : 'out');
if (!existsSync(outDir)) throw new Error(`لا يوجد ${outDir} — شغّل next build أولًا`);

await build({
  entryPoints: [path.join(root, 'worker/index.ts')],
  outfile: path.join(outDir, '_worker.js'),
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  mainFields: ['module', 'main'],
  conditions: ['worker', 'browser', 'import'],
  target: 'es2022',
  minify: true,
  tsconfig: path.join(root, 'tsconfig.json'),
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.NEXT_PUBLIC_SITE_URL': JSON.stringify(process.env.NEXT_PUBLIC_SITE_URL ?? ''),
    'process.env.NEXT_PUBLIC_WHATSAPP_NUMBER': JSON.stringify(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''),
    'process.env.NEXT_PUBLIC_CONTACT_PHONE': '""',
    'process.env.NEXT_PUBLIC_CONTACT_EMAIL': '""',
    'process.env.NEXT_PUBLIC_INSTAGRAM_URL': '""',
    'process.env.NEXT_PUBLIC_ASSETS_RELATIVE': '""',
    'process.env.NEXT_PUBLIC_STATIC_PREVIEW': '""',
  },
  logLevel: 'warning',
});
console.log(`✓ ${path.relative(root, outDir)}/_worker.js`);
