/**
 * تجهيز صور المنتجات الحقيقية للعرض — دون تغيير المنتج:
 * - تصحيح الاتجاه حسب بيانات EXIF، وإزالة بيانات الموقع والكاميرا
 * - تصغير بدون قص (المنتج يبقى كاملًا) إلى مقاسات 480 / 960 / 1600
 * - تحويل إلى WebP بجودة عالية
 * - نسخة JPEG ‏1200×630 لمعاينة الروابط (المنتج كاملًا على خلفية فاتحة، بدون قص)
 * لا يتم أي تعديل للألوان أو إزالة خلفية أو تجميل.
 *
 * قص اختياري لعناصر ليست من الصورة (مثل ساعة الهاتف في لقطات الشاشة) عبر ملف
 * product-photos/<id>/edits.json:  { "02.jpg": { "trim": { "bottom": 64 }, "reason": "..." } }
 *
 * الاستخدام:
 *   1) ضع الصور الأصلية في product-photos/<معرّف-المنتج>/ (jpg/png/webp/heic) — الترتيب أبجدي (01.jpg, 02.jpg...)
 *   2) npm run images
 *   3) ستظهر الصور تلقائيًا في الموقع (يُحدَّث src/data/product-images.json)
 */
import { readdir, mkdir, rm, writeFile, stat, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'product-photos');
const outputDir = path.join(root, 'public/images/products');
const manifestPath = path.join(root, 'src/data/product-images.json');
const WIDTHS = [480, 960, 1600];
const SUPPORTED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.avif', '.tif', '.tiff']);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const entries = await readdir(sourceDir, { withFileTypes: true }).catch(() => []);
const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
const manifest = {};
let total = 0;

await rm(outputDir, { recursive: true, force: true });

for (const slug of folders) {
  if (!SLUG.test(slug)) {
    console.warn(`⚠ تجاهل المجلد "${slug}": الاسم يجب أن يطابق معرّف المنتج (أحرف إنجليزية صغيرة وأرقام وشرطات)`);
    continue;
  }
  const files = (await readdir(path.join(sourceDir, slug)))
    .filter((f) => SUPPORTED.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  if (files.length === 0) continue;

  await mkdir(path.join(outputDir, slug), { recursive: true });
  manifest[slug] = [];
  const edits = JSON.parse(await readFile(path.join(sourceDir, slug, 'edits.json'), 'utf8').catch(() => '{}'));

  for (const [index, file] of files.entries()) {
    const sourcePath = path.join(sourceDir, slug, file);
    const name = String(index + 1).padStart(2, '0');
    // rotate() = تطبيق اتجاه EXIF، ثم القص الاختياري الموثق في edits.json
    let input = await sharp(sourcePath, { failOn: 'error' }).rotate().toBuffer();
    const trim = edits[file]?.trim;
    if (trim) {
      const m = await sharp(input).metadata();
      const t = { top: 0, right: 0, bottom: 0, left: 0, ...trim };
      input = await sharp(input)
        .extract({ left: t.left, top: t.top, width: m.width - t.left - t.right, height: m.height - t.top - t.bottom })
        .toBuffer();
      console.log(`  ✂ ${slug}/${file}: ${edits[file].reason ?? JSON.stringify(trim)}`);
    }
    const meta = await sharp(input).metadata();
    const width = meta.width;
    const height = meta.height;
    if (!width || !height) throw new Error(`تعذر قراءة أبعاد الصورة: ${sourcePath}`);

    const widths = WIDTHS.filter((w) => w < width);
    if (widths.length < WIDTHS.length) widths.push(Math.min(width, WIDTHS.at(-1)));
    const unique = [...new Set(widths)].sort((a, b) => a - b);

    for (const w of unique) {
      await sharp(input)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 82, effort: 5 })
        .toFile(path.join(outputDir, slug, `${name}-${w}.webp`));
    }
    const largest = unique.at(-1);
    const og = `/images/products/${slug}/${name}-og.jpg`;
    await sharp(input)
      .resize({ width: 1200, height: 630, fit: 'contain', background: '#F7F7F5' })
      .flatten({ background: '#F7F7F5' })
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile(path.join(root, 'public', og));
    manifest[slug].push({
      base: `/images/products/${slug}/${name}`,
      width: largest,
      height: Math.round((height / width) * largest),
      widths: unique,
      og,
    });
    total += 1;
    const size = (await stat(sourcePath)).size;
    console.log(`✓ ${slug}/${file} (${width}×${height}, ${(size / 1024).toFixed(0)}KB) → ${unique.join('/')}px`);
  }
}

await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nتمت معالجة ${total} صورة لـ ${Object.keys(manifest).length} منتج. تم تحديث src/data/product-images.json`);
