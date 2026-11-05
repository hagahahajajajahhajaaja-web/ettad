import { expect, test } from '@playwright/test';
import { addToCart, trackErrors } from './helpers';

const ADMIN_KEY = 'e2e-admin-key-2026-test';
const COMPRESSOR = { id: 'boss-12v-tire-compressor', name: 'منفاخ إطارات محمول 12 فولت BOSS' };

test.describe('لوحة التحكم', () => {
  // كوكي الجلسة Secure على http://localhost غير مدعوم في WebKit على Linux — يُختبر على Chromium
  test.skip(({ browserName }) => browserName === 'webkit', 'Secure cookie على localhost');
  test.describe.configure({ mode: 'serial' });

  test('الدخول بمفتاح خاطئ يُرفض برسالة واضحة', async ({ page }) => {
    await page.goto('/admin/');
    await page.getByLabel('مفتاح الدخول').fill('wrong-key-123456');
    await page.getByRole('button', { name: 'دخول' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'المفتاح غير صحيح' })).toBeVisible();
    await expect(page.getByRole('tab', { name: /الطلبات/ })).toHaveCount(0);
  });

  test('قائمة الطلبات تُحدَّث كل 20 ثانية فقط، لا طلبات متتالية بلا توقف', async ({ page }) => {
    let calls = 0;
    page.on('request', (r) => {
      if (new URL(r.url()).pathname.startsWith('/api/admin/orders')) calls++;
    });
    await page.goto('/admin/');
    await page.getByLabel('مفتاح الدخول').fill(ADMIN_KEY);
    await page.getByRole('button', { name: 'دخول' }).click();
    await expect(page.getByRole('tab', { name: /الطلبات/ })).toBeVisible();
    await expect.poll(() => calls).toBeGreaterThan(0);
    const afterFirstLoad = calls;
    await page.waitForTimeout(3000);
    expect(calls - afterFirstLoad).toBeLessThanOrEqual(1);
  });

  test('تسعير منتج من اللوحة يظهر في المتجر، والطلب يصل للوحة وتتغير حالته', async ({ page, context }) => {
    const errors = trackErrors(page);
    await page.goto('/admin/');
    await page.getByLabel('مفتاح الدخول').fill(ADMIN_KEY);
    await page.getByRole('button', { name: 'دخول' }).click();
    await expect(page.getByRole('tab', { name: /الطلبات/ })).toBeVisible();

    // 1) السعر والتوفر
    await page.getByRole('tab', { name: 'الأسعار والتوفر' }).click();
    const row = page.getByRole('form', { name: COMPRESSOR.name });
    await row.getByLabel('السعر (د.ك)').fill('abc');
    await row.getByRole('button', { name: 'حفظ' }).click();
    await expect(row.getByRole('alert')).toContainText('اكتب السعر بالأرقام');
    await row.getByLabel('السعر (د.ك)').fill('8.750');
    await row.getByLabel('التوفر').selectOption('in_stock');
    await row.getByRole('button', { name: 'حفظ' }).click();
    await expect(page.getByText('تم الحفظ: 8.750 د.ك — متوفر')).toBeVisible();

    // 2) المتجر يعرض السعر الحي
    const shop = await context.newPage();
    await shop.goto(`/products/${COMPRESSOR.id}/`);
    await expect(shop.locator('main').getByText('8.750 د.ك').first()).toBeVisible();
    await expect(shop.locator('main').getByText('متوفر', { exact: true }).first()).toBeVisible();

    // 3) طلب من المتجر
    await addToCart(shop, COMPRESSOR.id, 2);
    await shop.goto('/checkout/');
    const fields: [string, string][] = [['الاسم', 'منيرة'], ['رقم الهاتف', '66554433'], ['المنطقة', 'الجابرية'], ['القطعة', '4'], ['الشارع', '12'], ['المنزل أو المبنى', '30']];
    for (const [label, value] of fields) {
      await shop.getByLabel(label).fill(value);
    }
    await shop.getByRole('button', { name: 'مراجعة الطلب' }).click();
    await shop.getByRole('button', { name: 'تأكيد الطلب' }).click();
    await expect(shop.getByRole('heading', { name: 'تم استلام طلبك' })).toBeVisible();
    const orderId = (await shop.locator('main .font-mono').first().innerText()).trim();
    expect(orderId).toMatch(/^ET-\d{6}-[A-Z2-9]{4}$/);
    await expect(shop.getByText('17.500 د.ك').last()).toBeVisible();

    // 4) اللوحة: الطلب موجود، تغيير الحالة والملاحظة
    await page.getByRole('tab', { name: /الطلبات/ }).click();
    await page.getByRole('button', { name: 'تحديث' }).click();
    const card = page.getByRole('article', { name: orderId });
    await expect(card).toBeVisible();
    await expect(card).toContainText('منيرة');
    await expect(card).toContainText('+965 6655 4433');
    await expect(card.getByRole('link', { name: 'واتساب' })).toHaveAttribute('href', /wa\.me\/96566554433/);
    await card.getByLabel('الحالة').selectOption('confirmed');
    await card.getByLabel('ملاحظة داخلية').fill('اتصلت وأكدت');
    await card.getByRole('button', { name: 'حفظ' }).click();
    await expect(page.getByText(`حُفظ الطلب ${orderId}.`)).toBeVisible();
    await page.getByRole('button', { name: /^مؤكد/ }).click();
    await expect(page.getByRole('article', { name: orderId })).toBeVisible();

    // 4ب) الفاتورة: تُنشأ تلقائيًا من الطلب، وتسجيل الدفع منها
    const paidCard = page.getByRole('article', { name: orderId });
    await expect(paidCard.locator('header').getByText('غير مدفوع', { exact: true })).toBeVisible();
    await paidCard.getByRole('button', { name: 'الفاتورة' }).click();
    const invoice = page.getByRole('dialog', { name: 'فاتورة' });
    await expect(invoice).toBeVisible();
    await expect(invoice).toContainText(orderId);
    await expect(invoice).toContainText('منيرة');
    await expect(invoice).toContainText('الجابرية، قطعة 4، شارع 12، 30');
    await expect(invoice.getByRole('row').filter({ hasText: COMPRESSOR.name })).toContainText('17.500 د.ك');
    await expect(invoice.getByLabel('حالة الدفع: غير مدفوع')).toBeVisible();
    await expect(invoice.getByRole('region', { name: 'الشروط' })).toContainText('يتحمل العميل قيمة التوصيل');
    await expect(invoice.getByRole('link', { name: 'إرسال للعميل واتساب' })).toHaveAttribute('href', /wa\.me\/96566554433\?text=.*%D9%81%D8%A7%D8%AA%D9%88%D8%B1%D8%A9/);
    await invoice.getByRole('button', { name: 'تسجيل كمدفوع' }).click();
    await expect(invoice.getByLabel('حالة الدفع: مدفوع')).toBeVisible();
    // عند الطباعة تظهر الفاتورة فقط، بدون أزرار اللوحة
    await page.emulateMedia({ media: 'print' });
    await expect(invoice.getByRole('button', { name: 'طباعة / حفظ PDF' })).toBeHidden();
    await expect(page.getByRole('tab', { name: /الطلبات/ })).toBeHidden();
    await expect(invoice.getByRole('heading', { name: 'فاتورة' })).toBeVisible();
    await page.emulateMedia({ media: 'screen' });
    await invoice.getByRole('button', { name: 'إغلاق الفاتورة' }).click();
    await expect(invoice).toBeHidden();
    await expect(paidCard.locator('header').getByText('مدفوع', { exact: true })).toBeVisible();
    await expect(paidCard.getByLabel('الدفع')).toHaveValue('paid');

    // 5) إعادة السعر المعتمد (17.000) كما كان حتى لا تتأثر بقية الاختبارات
    await page.getByRole('tab', { name: 'الأسعار والتوفر' }).click();
    await row.getByLabel('السعر (د.ك)').fill('17');
    await row.getByLabel('التوفر').selectOption('unconfirmed');
    await row.getByRole('button', { name: 'حفظ' }).click();
    await expect(page.getByText('تم الحفظ: 17.000 د.ك — التوفر قيد التأكيد')).toBeVisible();

    // 6) إخفاء السعر يعيد «استفسر عن السعر»
    const drill = page.getByRole('form', { name: 'طقم دريل لاسلكي GULFIK بمحرك Brushless' });
    await expect(drill.getByLabel('السعر (د.ك)')).toHaveValue('');

    // 7) الخروج
    await page.getByRole('button', { name: 'خروج' }).click();
    await expect(page.getByLabel('مفتاح الدخول')).toBeVisible();
    expect(errors).toEqual([]);
  });
});
