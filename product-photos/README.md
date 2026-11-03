# صور المنتجات الأصلية

ضع الصور الحقيقية لكل منتج في مجلد باسم **معرّف المنتج** (`id` في `src/data/products.ts`):

```
product-photos/
  boss-bs-300f-pressure-washer/
    01.jpg   ← الصورة الرئيسية (تظهر في البطاقات ومشاركة الرابط)
    02.jpg
  boss-94pc-socket-wrench-set/
    01.jpg
  rolling-tool-case-kit/
    01.jpg
```

ثم شغّل:

```bash
npm run images
```

السكربت يصحح اتجاه الصورة ويصغّرها إلى WebP بثلاثة مقاسات **دون قص أو تعديل للمنتج**، ويحدّث
`src/data/product-images.json` تلقائيًا. الصور الأصلية تبقى هنا كمرجع.
