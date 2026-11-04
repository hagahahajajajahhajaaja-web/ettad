/**
 * يبني نسخة اختبار معزولة (out-e2e/) ثم يشغلها عبر نفس خادم Cloudflare مع قاعدة SQLite مؤقتة.
 * يُستدعى تلقائيًا من playwright.config.ts — لا يلمس مجلد الإنتاج out/.
 */
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createD1 } from './lib/d1-sqlite.mjs';
import { startLocalPages } from './lib/local-pages.mjs';

export const E2E_PORT = Number(process.env.E2E_PORT ?? 4321);
const env = {
  ...process.env,
  ETAAD_E2E_BUILD: '1',
  NEXT_TELEMETRY_DISABLED: '1',
  // رقم تجريبي غير حقيقي بصيغة صحيحة — للاختبار فقط
  NEXT_PUBLIC_WHATSAPP_NUMBER: '96550000000',
  NEXT_PUBLIC_SITE_URL: `http://localhost:${E2E_PORT}`,
};

if (process.env.E2E_SKIP_BUILD !== '1') {
  for (const cmd of [['next', 'build'], ['node', 'scripts/build-worker.mjs']]) {
    const run = spawnSync(cmd[0] === 'next' ? 'npx' : cmd[0], cmd[0] === 'next' ? cmd : cmd.slice(1), { env, stdio: 'inherit' });
    if (run.status !== 0) process.exit(run.status ?? 1);
  }
}

await startLocalPages({
  outDir: 'out-e2e',
  port: E2E_PORT,
  env: { ETAAD_DB: createD1(), ADMIN_KEY: 'e2e-admin-key-2026-test', WHATSAPP_NUMBER: '96550000000' },
  // كل طلب بعنوان مختلف حتى لا يتداخل حدّ المحاولات بين الاختبارات المتوازية
  rewriteIp: () => `e2e-${randomUUID()}`,
});
console.log(`e2e: http://localhost:${E2E_PORT}`);
