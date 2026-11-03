/**
 * يولد أصول الهوية الثابتة من الشعار:
 * - أيقونات PNG (Apple / PWA) عبر sharp
 * - صورة المشاركة Open Graph ‏1200×630 عبر متصفح Chromium (لضمان تشكيل الحروف العربية بخط Cairo)
 * التشغيل: npm run brand
 */
import { readFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { chromium } from '@playwright/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mark = await readFile(path.join(root, 'src/app/icon.svg'));
const PAPER = '#F7F7F5';

async function icon(size, out, { padding = 0.14, background = PAPER } = {}) {
  const inner = Math.round(size * (1 - padding * 2));
  const rendered = await sharp(mark, { density: 1200 }).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: rendered, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(root, out));
  console.log('✓', out);
}

await mkdir(path.join(root, 'public/brand'), { recursive: true });
await mkdir(path.join(root, 'public/og'), { recursive: true });
await icon(180, 'src/app/apple-icon.png');
await icon(192, 'public/brand/etaad-icon-192.png');
await icon(512, 'public/brand/etaad-icon-512.png');
await icon(512, 'public/brand/etaad-logo.png', { padding: 0.04, background: { r: 0, g: 0, b: 0, alpha: 0 } });

const fontUrl = (file) => 'data:font/woff2;base64,' + Buffer.from(readFileSync(path.join(root, 'src/fonts', file))).toString('base64');
const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
@font-face{font-family:Cairo;src:url(${fontUrl('cairo-arabic.woff2')}) format('woff2');font-weight:200 1000}
@font-face{font-family:CairoL;src:url(${fontUrl('cairo-latin.woff2')}) format('woff2');font-weight:200 1000}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#111820;color:#F7F7F5;font-family:Cairo,CairoL,sans-serif;position:relative;overflow:hidden}
.grid{position:absolute;inset:0;background-image:linear-gradient(to right,rgba(105,115,125,.18) 1px,transparent 1px),linear-gradient(to bottom,rgba(105,115,125,.18) 1px,transparent 1px);background-size:40px 40px}
.wrap{position:absolute;inset:72px 80px 96px;display:flex;align-items:center;justify-content:space-between}
h1{font-size:150px;font-weight:1000;line-height:1}
.en{font-family:CairoL;font-size:34px;font-weight:800;letter-spacing:.45em;color:#AAB1B8;margin-top:6px;direction:ltr;text-align:right}
.tag{margin-top:34px;font-size:58px;font-weight:900;display:inline-block;position:relative}
.tag:after{content:'';position:absolute;inset:auto 0 -6px 0;height:14px;background:#F58220;z-index:-1}
.desc{margin-top:26px;font-size:30px;font-weight:600;color:#AAB1B8}
.hz{position:absolute;inset:auto 0 0 0;height:28px;background:repeating-linear-gradient(-45deg,#F58220 0 18px,#111820 18px 36px)}
svg{width:330px;height:330px}
</style></head><body><div class="grid"></div><div class="wrap"><div><h1>عتاد</h1><div class="en">ETAAD</div><div class="tag">عتادك لكل شغلة</div><div class="desc">معدات وأدوات للصيانة والعمل · الكويت</div></div>
${mark.toString().replace('<svg ', '<svg aria-hidden="true" ').replace('fill="#111820"/>', 'fill="#242E39" stroke="#69737D" stroke-width="1.2"/>')}</div><div class="hz"></div></body></html>`;

const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const png = await page.screenshot({ type: 'png' });
await browser.close();
await sharp(png).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(path.join(root, 'public/og/etaad-og.png'));
console.log('✓ public/og/etaad-og.png');
