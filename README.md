# عتاد | ETAAD

**معدات وأدوات للصيانة والعمل — «عتادك لكل شغلة»**

متجر إلكتروني عربي (RTL) للسوق الكويتي بالدينار الكويتي. الطلبات تُحفظ برقم طلب وتظهر في لوحة تحكم، مع بديل واتساب.
مبني بـ Next.js 16 و TypeScript و Tailwind CSS 4: صفحات ثابتة + خادم Cloudflare صغير (`worker/`) + قاعدة بيانات D1.

> هذا المستودع كان سابقًا متجر «أوان». تم استبدال محتواه بالكامل بمشروع عتاد المستقل.
> نسخة أوان السابقة محفوظة في تاريخ git وفي فرع `main` حتى يتم الدمج.

## التشغيل محليًا

المتطلبات: Node.js 20.9 أو أحدث (مُختبر على Node 22).

```bash
npm install
cp .env.example .env.local   # ثم عدّل القيم (اختياري للتطوير)
npm run dev                  # http://localhost:3000
```

## الأوامر

| الأمر | الوظيفة |
| --- | --- |
| `npm run dev` | خادم التطوير |
| `npm run build` | بناء الموقع الثابت في مجلد `out/` |
| `npm start` | تشغيل ناتج البناء محليًا عبر نفس الخادم (أضف `LOCAL_DB=1 ADMIN_KEY=...` لتجربة الطلبات ولوحة التحكم) |
| `npm run lint` | فحص ESLint |
| `npm run typecheck` | فحص TypeScript |
| `npm test` | اختبارات الوحدات (Vitest) |
| `npm run test:e2e` | اختبارات المتصفح (Playwright) — تبني نسخة معزولة في `out-e2e/` |
| `npm run check` | كل ما سبق بالترتيب |
| `npm run images` | تجهيز صور المنتجات من `product-photos/` |
| `npm run brand` | إعادة توليد الأيقونات وصورة المشاركة من الشعار |
| `npm run preview:build` | بناء «معاينة خاصة» كصفحة واحدة في `preview-out/` لنشرها على claude.ai (يراها صاحبها فقط). يحتاج `npm run build` أولًا |

## الإعدادات

كل الإعدادات القابلة للتغيير في متغيرات البيئة (انظر [`.env.example`](.env.example)) وتُقرأ في
[`src/config/site.ts`](src/config/site.ts):

| المتغير | الوصف | الحالة |
| --- | --- | --- |
| `ETAAD_DB` (ربط D1) | قاعدة الطلبات والأسعار | **مطلوب للنشر** |
| `ADMIN_KEY` (Secret) | مفتاح دخول لوحة التحكم `/admin` | **مطلوب للنشر** |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` / `WHATSAPP_NUMBER` | لتغيير رقم واتساب المتجر (الافتراضي `96569976264`): `965` + 8 أرقام | اختياري |
| `NEXT_PUBLIC_SITE_URL` | الرابط النهائي للموقع | تلقائي `https://etaadq8.com` في نشر `main` على Cloudflare |
| `NEXT_PUBLIC_CONTACT_PHONE` / `_EMAIL` / `NEXT_PUBLIC_INSTAGRAM_URL` | وسائل تواصل إضافية | اختياري |

لا توجد أي أسرار أو بيانات اعتماد في الكود. كل متغيرات `NEXT_PUBLIC_` عامة بطبيعتها.

## التوثيق

- [قائمة ما يلزم قبل الإطلاق](docs/LAUNCH-CHECKLIST.md)
- [إضافة المنتجات والصور والأسعار والسياسات](docs/CONTENT-GUIDE.md)
- [النشر](docs/DEPLOYMENT.md)
- [البنية التقنية والتوسع المستقبلي](docs/ARCHITECTURE.md)
