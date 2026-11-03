# النشر على Cloudflare Pages (تلقائي من GitHub)

كل دمج في الفرع `main` بهذا المستودع (`ettad`) يُنشر تلقائيًا على **etaadq8.com**. الخطوات أدناه تتم مرة واحدة من لوحة Cloudflare، ولا تحتاج مشاركة أي كلمة مرور أو رمز.

> لا تلمس أي مشروع أو Worker أو قاعدة بيانات تخص Blue Store. كل ما يلي خاص بمتجر عتاد فقط.

الموقع صفحات ثابتة (`out/`) مع خادم صغير (`out/_worker.js`) للطلبات ولوحة التحكم، وقاعدة بيانات D1 للأسعار والطلبات.

## لماذا مشروع جديد؟
المشروع الحالي `etaad` أُنشئ بالرفع اليدوي (Direct Upload)، وCloudflare لا تسمح بتحويل مشروع رفع يدوي إلى ربط GitHub. لذلك ننشئ مشروعًا جديدًا مربوطًا بالمستودع، ثم ننقل له الدومين.

## 1) إنشاء المشروع وربطه بـ GitHub
Workers & Pages ← Create ← Pages ← **Connect to Git** ← اختر المستودع `ettad`.

- Project name: مثلًا `etaad-store`
- Production branch: `main`
- Framework preset: `None`
- Build command: `npm run build`
- Build output directory: `out`
- Environment variables:
  - `NODE_VERSION` = `22`

ملاحظات:
- **الدومين:** بناء الفرع `main` يستخدم `https://etaadq8.com` تلقائيًا (Sitemap وروابط المنتجات في رسائل واتساب). لا حاجة لضبط `NEXT_PUBLIC_SITE_URL` إلا إذا أردت رابطًا آخر.
- **رقم واتساب** المتجر `96569976264` مضبوط في الكود؛ أضف `NEXT_PUBLIC_WHATSAPP_NUMBER` فقط إذا أردت رقمًا آخر.

## 2) ربط قاعدة البيانات
قاعدة D1 باسم `etaad` موجودة مسبقًا (المعرّف `77dc4656-7a8c-4e21-95f2-ceaf372f7a60`) والجداول جاهزة.

في المشروع الجديد: Settings ← Bindings ← Add ← D1 database:
- Variable name: `ETAAD_DB`
- Database: `etaad`

## 3) مفتاح لوحة التحكم
Settings ← Variables and Secrets ← Add:
- Type: **Secret**
- Name: `ADMIN_KEY`
- Value: مفتاح طويل تختاره أنت (20 حرفًا أو أكثر، احفظه في مدير كلمات المرور، ولا ترسله لأحد)

## 4) إعادة النشر
الإعدادات في 2 و3 تُطبَّق على النشر التالي: Deployments ← آخر نشر ← **Retry deployment**.

تأكد على رابط `*.pages.dev` الخاص بالمشروع الجديد:
1. `/api/health` يرجع نصًا قصيرًا بصيغة JSON (وليس صفحة المتجر).
2. `/admin` يفتح صفحة الدخول، وتدخل بالمفتاح.
3. طلب تجريبي يظهر في «الطلبات».

## 5) نقل الدومين etaadq8.com
بعد التأكد أن المشروع الجديد يعمل:
1. في المشروع القديم `etaad`: Custom domains ← `etaadq8.com` ← **Remove**.
2. في المشروع الجديد: Custom domains ← **Set up a custom domain** ← `etaadq8.com` ← Activate.

الدومين على Cloudflare نفسها، فيتحدث سجل DNS تلقائيًا، وعادة يعمل خلال دقائق. بعدها تقدر تحذف المشروع القديم `etaad` إذا أردت.

## بعد ذلك
- أي Pull Request يُبنى كمعاينة على رابط `pages.dev` منفصل، ولا يمس الموقع الحقيقي.
- الدمج في `main` = نشر تلقائي على etaadq8.com.
- الأسعار والتوفر تتعدل من `/admin` مباشرة بدون إعادة نشر.

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
`.github/workflows/ci.yml` يشغل lint والأنواع واختبارات الوحدات والبناء واختبارات المتصفح (Chromium + WebKit) على كل Pull Request. **لا ينشر شيئًا** — النشر يتم من Cloudflare نفسها.
