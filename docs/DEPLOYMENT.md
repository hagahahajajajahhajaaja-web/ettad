# النشر على etaadq8.com (تلقائي من GitHub)

الموقع صفحات ثابتة (`out/`) مع خادم صغير (`out/_worker.js`) للطلبات ولوحة التحكم، وقاعدة بيانات D1 باسم `etaad` (الجداول جاهزة).

النشر يتم عبر GitHub Actions (`.github/workflows/deploy.yml`) على **مشروع Cloudflare Pages الحالي المربوط بـ etaadq8.com**، فلا حاجة لإنشاء مشروع جديد ولا نقل الدومين. الخطوات أدناه تتم مرة واحدة.

> لا تلمس أي مشروع أو Worker أو قاعدة بيانات تخص Blue Store. كل ما يلي خاص بمتجر عتاد فقط.

## 1) رمز Cloudflare (مرة واحدة)
dash.cloudflare.com ← My Profile ← API Tokens ← **Create Token** ← **Create Custom Token**:
- Permissions:
  - Account ← **Cloudflare Pages** ← Edit
  - Account ← **D1** ← Edit
- Account Resources: حسابك فقط
- ← Continue ← Create Token، وانسخ الرمز (يظهر مرة واحدة).

## 2) سرّان في GitHub (مرة واحدة)
مستودع `ettad` ← Settings ← Secrets and variables ← Actions ← **New repository secret**:

| الاسم | القيمة |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | الرمز من الخطوة 1 |
| `ADMIN_KEY` | مفتاح لوحة التحكم: 20 حرفًا أو أكثر تختاره أنت. احفظه في مدير كلمات المرور ولا ترسله لأحد |

اختياري: `CLOUDFLARE_ACCOUNT_ID` إذا كان الرمز يصل لأكثر من حساب.

## 3) النشر
- **تلقائي:** كل دمج في `main` يُنشر على etaadq8.com.
- **يدوي:** Actions ← **Deploy to etaadq8.com** ← Run workflow.

خطوات سير العمل: اختبارات الوحدات ← البناء ← العثور على مشروع Pages المربوط بـ etaadq8.com ← ربط D1 (`ETAAD_DB`) ← حفظ `ADMIN_KEY` كـ Secret في Cloudflare ← النشر ← التأكد أن `https://etaadq8.com/api/health` يرجع `database: true` و `adminKey: true`.

## بعد النشر
- لوحة التحكم: **https://etaadq8.com/admin/** وتدخل بقيمة `ADMIN_KEY`.
- الأسعار والتوفر تتعدل من اللوحة مباشرة بدون إعادة نشر.
- لتغيير مفتاح اللوحة: عدّل السر `ADMIN_KEY` في GitHub ثم شغّل النشر يدويًا.
- لا يتطلب أي تعديل في إعدادات المشروع داخل Cloudflare؛ ربط D1 يُكتب في `wrangler.toml` أثناء النشر.

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
`.github/workflows/ci.yml` يشغل lint والأنواع واختبارات الوحدات والبناء واختبارات المتصفح (Chromium + WebKit) على كل Pull Request ولا ينشر شيئًا. النشر فقط في `deploy.yml`.
