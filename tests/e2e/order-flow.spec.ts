import { expect, test } from '@playwright/test';
import { SOCKETS, WASHER, addToCart, cartBadgeLabel, trackErrors } from './helpers';

test.describe('السلة', () => {
  test('إضافة وتعديل وحذف والحفظ بعد إعادة التحميل', async ({ page }) => {
    const errors = trackErrors(page);
    await addToCart(page, WASHER.id, 2);
    await expect.poll(() => cartBadgeLabel(page)).toBe('سلة التسوق: قطعتان');
    await addToCart(page, SOCKETS.id, 1);

    await page.goto('/cart/');
    await expect(page.getByRole('link', { name: WASHER.name })).toBeVisible();
    await expect(page.getByRole('link', { name: SOCKETS.name })).toBeVisible();
    await expect(page.getByText('3 قطع')).toBeVisible();
    // 2 × 35.000 + 20.000 — من الأسعار المعتمدة
    await expect(page.getByText('90.000 د.ك').first()).toBeVisible();

    await page.getByRole('textbox', { name: `كمية ${WASHER.name}` }).fill('5');
    await expect(page.getByText('6 قطع')).toBeVisible();
    await expect(page.getByText('195.000 د.ك').first()).toBeVisible();

    await page.reload();
    await expect(page.getByRole('textbox', { name: `كمية ${WASHER.name}` })).toHaveValue('5');

    await page.getByRole('button', { name: `حذف ${SOCKETS.name} من السلة` }).click();
    await expect(page.getByRole('link', { name: SOCKETS.name })).toHaveCount(0);
    await page.getByRole('button', { name: `حذف ${WASHER.name} من السلة` }).click();
    await expect(page.getByText('سلتك فارغة')).toBeVisible();
    await expect.poll(() => cartBadgeLabel(page)).toBe('سلة التسوق فارغة');
    expect(errors).toEqual([]);
  });

  test('الكمية محصورة بالحد الأعلى', async ({ page }) => {
    await addToCart(page, WASHER.id);
    await page.goto('/cart/');
    const qty = page.getByRole('textbox', { name: `كمية ${WASHER.name}` });
    await qty.fill('999');
    await expect(qty).toHaveValue('20');
    await expect(page.getByRole('button', { name: 'زيادة الكمية' })).toBeDisabled();
  });

  test('إتمام الطلب بسلة فارغة يعرض رسالة واضحة', async ({ page }) => {
    await page.goto('/checkout/');
    await expect(page.getByText('لا توجد منتجات في السلة')).toBeVisible();
  });
});

const fillCustomer = async (page: import('@playwright/test').Page, phone = '+965 5123 4567') => {
  const fields: [string, string][] = [['الاسم', 'أحمد الكويتي'], ['رقم الهاتف', phone], ['المنطقة', 'السالمية'], ['القطعة', '10'], ['الشارع', 'شارع 5'], ['المنزل أو المبنى', 'منزل 12']];
  for (const [label, value] of fields) {
    await page.getByLabel(label).fill(value);
  }
};

test.describe('إتمام الطلب في الموقع (حفظ الطلب ولوحة التحكم)', () => {
  test('يُحفظ الطلب برقم طلب وتُفرغ السلة', async ({ page, context }) => {
    const errors = trackErrors(page);
    await context.route('https://wa.me/**', (route) => route.fulfill({ status: 200, body: 'whatsapp' }));
    await addToCart(page, WASHER.id, 2);
    await addToCart(page, SOCKETS.id, 1);
    await page.goto('/checkout/');
    await page.getByRole('button', { name: 'مراجعة الطلب' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'يرجى تصحيح' })).toBeVisible();
    await fillCustomer(page);
    await page.getByRole('button', { name: 'مراجعة الطلب' }).click();
    await expect(page.getByRole('heading', { name: 'راجع طلبك قبل الإرسال' })).toBeVisible();
    await expect(page.getByText('ستحصل على رقم طلب')).toBeVisible();

    await page.getByRole('button', { name: 'تأكيد الطلب' }).click();
    await expect(page.getByRole('heading', { name: 'تم استلام طلبك' })).toBeVisible();
    const orderId = (await page.locator('main .font-mono').first().innerText()).trim();
    expect(orderId).toMatch(/^ET-\d{6}-[A-Z2-9]{4}$/);
    await expect(page.getByText('90.000 د.ك').first()).toBeVisible();
    await expect(page.getByText('+965 5123 4567')).toBeVisible();
    const follow = page.getByRole('link', { name: 'تواصل معنا عبر واتساب برقم الطلب' });
    expect(decodeURIComponent((await follow.getAttribute('href'))!)).toContain(orderId);
    await expect.poll(() => cartBadgeLabel(page)).toBe('سلة التسوق فارغة');

    await page.goto('/checkout/');
    await expect(page.getByText('لا توجد منتجات في السلة')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('إذا تعذر حفظ الطلب في النظام يظهر بديل واتساب بدون رقم طلب', async ({ page, context }) => {
    await context.route('**/api/orders', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false, code: 'DB_NOT_BOUND', message: 'قاعدة البيانات غير مربوطة بعد.' }) }));
    await addToCart(page, SOCKETS.id);
    await page.goto('/checkout/');
    await fillCustomer(page);
    await page.getByRole('button', { name: 'مراجعة الطلب' }).click();
    await page.getByRole('button', { name: 'تأكيد الطلب' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'تعذر تسجيل الطلب في النظام الآن' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'إرسال الطلب عبر واتساب' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'تم استلام طلبك' })).toHaveCount(0);
  });
});

test.describe('بديل واتساب (عند عدم توفر نظام الطلبات)', () => {
  test.beforeEach(async ({ context }) => {
    await context.route('**/api/**', (route) => route.abort());
  });

  test('التحقق والمراجعة وبناء رسالة واتساب دون ادعاء التأكيد', async ({ page, context }) => {
    const errors = trackErrors(page);
    await context.route('https://wa.me/**', (route) => route.fulfill({ status: 200, body: 'whatsapp' }));
    await addToCart(page, WASHER.id, 2);
    await addToCart(page, SOCKETS.id, 1);
    await page.goto('/cart/');
    await page.getByRole('link', { name: 'إتمام الطلب' }).click();
    await expect(page).toHaveURL(/\/checkout\/$/);

    // إرسال فارغ ← ملخص أخطاء يأخذ التركيز
    await page.getByRole('button', { name: 'مراجعة الطلب' }).click();
    const summary = page.getByRole('alert').filter({ hasText: 'يرجى تصحيح' });
    await expect(summary).toBeVisible();
    await expect(summary).toBeFocused();
    await expect(summary.getByRole('listitem')).toHaveCount(6);

    await page.getByLabel('الاسم').fill('أحمد الكويتي');
    await page.getByLabel('رقم الهاتف').fill('1234');
    await page.getByLabel('المنطقة').fill('السالمية');
    await page.getByLabel('القطعة').fill('10');
    await page.getByLabel('الشارع').fill('شارع 5');
    await page.getByLabel('المنزل أو المبنى').fill('منزل 12');
    await page.getByLabel(/تفاصيل إضافية/).fill('الدور الثاني\nبجانب المسجد');
    await expect(page.getByText('اكتب رقم هاتف كويتي صحيحًا').first()).toBeVisible();
    await expect(page.getByLabel('رقم الهاتف')).toHaveAttribute('aria-invalid', 'true');

    await page.getByLabel('رقم الهاتف').fill('+965 5123 4567');
    await expect(page.getByRole('alert').filter({ hasText: 'يرجى تصحيح' })).toHaveCount(0);
    await page.getByRole('button', { name: 'مراجعة الطلب' }).click();

    // المراجعة
    await expect(page.getByRole('heading', { name: 'راجع طلبك قبل الإرسال' })).toBeVisible();
    await expect(page.getByText('+965 5123 4567', { exact: true })).toBeVisible();
    const send = page.getByRole('link', { name: 'إرسال الطلب عبر واتساب' });
    const href = (await send.getAttribute('href'))!;
    expect(href).toMatch(/^https:\/\/wa\.me\/96550000000\?text=/);
    const message = decodeURIComponent(href.split('text=')[1]!);
    for (const part of [
      'طلب مبدئي بانتظار تأكيد المتجر',
      WASHER.name,
      'الكمية: 2',
      SOCKETS.name,
      'الاسم: أحمد الكويتي',
      'الهاتف: \u200E+965 5123 4567',
      'المنطقة: السالمية',
      'القطعة: 10',
      'الشارع: شارع 5',
      'المنزل/المبنى: منزل 12',
      '- بجانب المسجد',
      'مجموع المنتجات: 90.000 د.ك',
    ]) {
      expect(message).toContain(part);
    }
    expect(message).not.toMatch(/تم تأكيد|رقم الطلب/);

    // فتح واتساب ← حالة «أكمل الإرسال» وليست «تم التأكيد»
    const popupPromise = page.waitForEvent('popup');
    await send.click();
    const popup = await popupPromise;
    expect(popup.url()).toContain('wa.me/96550000000');
    await popup.close();
    await expect(page.getByRole('heading', { name: 'أكمل الإرسال من واتساب' })).toBeVisible();
    await expect(page.getByText('الطلب لا يصل إلى المتجر إلا بعد أن تضغط زر الإرسال')).toBeVisible();
    await expect(page.locator('main')).not.toContainText('تم تأكيد الطلب');
    // السلة لا تُفرغ تلقائيًا
    await expect.poll(() => cartBadgeLabel(page)).toBe('سلة التسوق: 3 قطع');

    await page.getByRole('button', { name: 'أرسلت الرسالة — أفرغ السلة' }).click();
    await expect(page.getByRole('heading', { name: 'تم تفريغ السلة' })).toBeVisible();
    await expect.poll(() => cartBadgeLabel(page)).toBe('سلة التسوق فارغة');
    expect(errors.filter((e) => !e.includes('ERR_FAILED') && !e.includes('Failed to load resource'))).toEqual([]);
  });

  test('نسخ نص الطلب يعمل', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'صلاحيات الحافظة مدعومة في Chromium للاختبار الآلي');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await addToCart(page, SOCKETS.id);
    await page.goto('/checkout/');
    await page.getByLabel('الاسم').fill('سارة');
    await page.getByLabel('رقم الهاتف').fill('99887766');
    await page.getByLabel('المنطقة').fill('حولي');
    await page.getByLabel('القطعة').fill('3');
    await page.getByLabel('الشارع').fill('تونس');
    await page.getByLabel('المنزل أو المبنى').fill('7');
    await page.getByRole('button', { name: 'مراجعة الطلب' }).click();
    await page.getByRole('button', { name: 'نسخ نص الطلب' }).click();
    await expect(page.getByText('نُسخ نص الطلب')).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain('الاسم: سارة');
    expect(copied).toContain(SOCKETS.name);
  });
});
