# النشر على etaadq8.com (تلقائي من GitHub)

الدومين **etaadq8.com** يُخدم من مشروع Cloudflare Pages اسمه **`etaadq8`**، وهو مربوط بهذا المستودع:

- كل دمج في `main` يُبنى ويُنشر تلقائيًا على etaadq8.com.
- كل Pull Request يأخذ رابط معاينة منفصل على `*.etaadq8.pages.dev` ولا يمس الموقع الحقيقي.

الموقع صفحات ثابتة (`out/`) مع خادم صغير (`out/_worker.js`) للطلبات ولوحة التحكم، وقاعدة بيانات D1 باسم `etaad`.

> لا تلمس أي مشروع أو Worker أو قاعدة بيانات تخص Blue Store. كل ما يلي خاص بمتجر عتاد فقط.

## إعدادات المشروع `etaadq8` في Cloudflare
Workers & Pages ← **etaadq8** ← Settings:

| الإعداد | القيمة |
| --- | --- |
| Build command | `npm run build` |
| Build output directory | `out` |
| Bindings ← D1 database | `ETAAD_DB` ← `etaad` |
| Variables and Secrets ← **Secret** | `ADMIN_KEY` = مفتاح لوحة التحكم (20 حرفًا أو أكثر، تختاره أنت، يُحفظ في مدير كلمات المرور ولا يُرسل لأحد) |

بعد إضافة أو تغيير `ADMIN_KEY` أو أي ربط: Deployments ← آخر نشر للإنتاج ← **Retry deployment**، لأن الإعدادات تُطبَّق على النشر التالي فقط.

بناء الفرع `main` يستخدم `https://etaadq8.com` تلقائيًا (Sitemap وروابط المنتجات في رسائل واتساب). رقم واتساب المتجر `96569976264` مضبوط في الكود.

## التأكد بعد النشر
1. `https://etaadq8.com/api/health` يرجع `"database":true` و `"adminKey":true`.
2. `https://etaadq8.com/admin/` يفتح صفحة الدخول، وتدخل بقيمة `ADMIN_KEY`.
3. طلب تجريبي يظهر في «الطلبات».

الأسعار والتوفر تتعدل من اللوحة مباشرة بدون إعادة نشر.

## ما الذي يحدث بدون قاعدة البيانات؟
المتجر يعمل، ويعرض الأسعار المكتوبة في الكود. إتمام الطلب يتحول تلقائيًا إلى إرسال الطلب عبر واتساب، ولوحة التحكم تعرض أنها غير متاحة. لا يظهر رقم طلب ما لم يُحفظ الطلب فعلًا.

## التجربة محليًا

```bash
npm run build
LOCAL_DB=1 ADMIN_KEY=local-admin-key-123456 npm start   # http://localhost:3000 و /admin
```

## المعاينة الخاصة (ليست نشرًا)

`npm run build && npm run preview:build` يولد في `preview-out/` نسخة من المتجر كصفحة واحدة تُنشر على claude.ai، ويراها صاحب الحساب فقط. **لا ترفع هذا المجلد على Cloudflare**: لا يحتوي لوحة تحكم ولا طلبات.

## CI
`.github/workflows/ci.yml` يشغل lint والأنواع واختبارات الوحدات والبناء واختبارات المتصفح (Chromium + WebKit) على كل Pull Request. **لا ينشر شيئًا**؛ النشر يتم من Cloudflare نفسها.
