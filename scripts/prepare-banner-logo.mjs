/**
 * يجهز شعار البانر للصفحة الرئيسية من brand-source/etaad-logo-banner.png:
 * - يزيل الخلفية الكحلية الصلبة (شفافية تدريجية حسب البعد عن لون الخلفية، مع استرجاع اللون الأصلي للحواف)
 * - يقص الهوامش الفارغة
 * - يحفظ WebP شفاف بمقاسين في public/images/brand/ (المعاينة تنسخ public/images تلقائيًا)
 * التشغيل: node scripts/prepare-banner-logo.mjs
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'brand-source/etaad-logo-banner.png');
const outDir = path.join(root, 'public/images/brand');

const { data, info } = await sharp(source).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;

// لون الخلفية = متوسط الزوايا الأربع
const corner = (x, y) => [0, 1, 2].map((c) => data[(y * width + x) * 3 + c]);
const corners = [corner(4, 4), corner(width - 5, 4), corner(4, height - 5), corner(width - 5, height - 5)];
const bg = [0, 1, 2].map((c) => corners.reduce((s, p) => s + p[c], 0) / corners.length);

const SOFT = 18; // أقل من هذا البعد = خلفية تمامًا
const FULL = 110; // أكثر من هذا البعد = لون الشعار كاملًا
const rgba = Buffer.alloc(width * height * 4);
let minX = width, minY = height, maxX = -1, maxY = -1;
for (let i = 0; i < width * height; i++) {
  const px = [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]];
  const dist = Math.hypot(px[0] - bg[0], px[1] - bg[1], px[2] - bg[2]);
  const a = Math.min(1, Math.max(0, (dist - SOFT) / (FULL - SOFT)));
  for (let c = 0; c < 3; c++) {
    // استرجاع لون الحافة بدون أثر الخلفية الداكنة
    const v = a > 0 ? (px[c] - (1 - a) * bg[c]) / a : 0;
    rgba[i * 4 + c] = Math.round(Math.min(255, Math.max(0, v)));
  }
  rgba[i * 4 + 3] = Math.round(a * 255);
  if (a > 0.05) {
    const x = i % width, y = Math.floor(i / width);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
}
if (maxX < 0) throw new Error('لم يُعثر على الشعار في الصورة');

const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.02);
const crop = {
  left: Math.max(0, minX - pad),
  top: Math.max(0, minY - pad),
  width: Math.min(width, maxX + pad + 1) - Math.max(0, minX - pad),
  height: Math.min(height, maxY + pad + 1) - Math.max(0, minY - pad),
};
const logo = sharp(rgba, { raw: { width, height, channels: 4 } }).extract(crop);
const buffer = await logo.png().toBuffer();

await mkdir(outDir, { recursive: true });
for (const w of [480, 960]) {
  const out = path.join(outDir, `etaad-logo-${w}.webp`);
  await sharp(buffer).resize({ width: w }).webp({ quality: 92, alphaQuality: 100 }).toFile(out);
  const meta = await sharp(out).metadata();
  console.log(`✓ ${path.relative(root, out)} (${meta.width}×${meta.height})`);
}
console.log(`الخلفية: rgb(${bg.map(Math.round).join(', ')})، القص: ${crop.width}×${crop.height}`);
