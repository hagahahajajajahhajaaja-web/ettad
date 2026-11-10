import { expect, test } from '@playwright/test';
import { ALL_PRODUCT_IDS, DRILL, IMPACT, SOCKETS, TOOLCASE, WASHER, cartBadgeLabel, trackErrors } from './helpers';

test.describe('الصفحة الرئيسية', () => {
  test('تعرض الهوية وكل المنتجات بأسعارها بلا أخطاء', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/');
    await expect(page).toHaveTitle(/عتاد \| ETAAD/);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('عتادك');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('لكل شغلة');
    // شعار عتاد في البانر ووصف المتجر
    await expect(page.getByRole('img', { name: 'شعار عتاد | ETAAD' })).toBeVisible();
    await expect(page.getByText('متجر معدات وأدوات في الكويت: غسيل، عدد يدوية، وأدوات للسيارة.')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'عن عتاد' })).toBeVisible();

    const products = page.locator('#products');
    await expect(products.getByRole('heading', { level: 3 })).toHaveCount(ALL_PRODUCT_IDS.length);
    for (const name of [WASHER.name, SOCKETS.name, IMPACT.name, TOOLCASE.name]) {
      await expect(products.getByRole('heading', { name, exact: true })).toBeVisible();
    }
    // صور حقيقية في بطاقات المنتجات
    await expect(page.getByRole('img', { name: /ماكينة الغسيل بالضغط العالي BOSS BS-300F/ }).first()).toBeVisible();
    // المنتج الذي وصلت صورته الآن لم يعد يعرض البديل
    await expect(products.getByRole('img', { name: /مفتاح تواير السيارة BOSS/ })).toBeVisible();
    // كل بطاقة توضح استخدام المنتج
    await expect(products.getByText('تعبئة هواء تواير السيارة', { exact: true })).toBeVisible();
    await expect(page.locator('main')).not.toContainText('بلكات');
    // الأسعار المعتمدة، والمنتج غير المسعّر يظهر «استفسر عن السعر»
    await expect(products.getByText('35.000 د.ك', { exact: true })).toBeVisible();
    await expect(products.getByText('15.000 د.ك', { exact: true })).toBeVisible();
    await expect(products.getByText('استفسر عن السعر')).toHaveCount(1);
    // التوفر غير المحدد لا يُعرض كادعاء
    await expect(page.getByText('التوفر قيد التأكيد')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('زر «أضف للسلة» في البطاقة يضيف مباشرة', async ({ page }) => {
    await page.goto('/');
    await expect.poll(() => cartBadgeLabel(page)).toBe('سلة التسوق فارغة');
    // الاسم المقروء: «أضف للسلة» + اسم المنتج (WCAG 2.5.3)
    await page.getByRole('button', { name: new RegExp(`^أضف للسلة\\s*:\\s*${SOCKETS.name}$`) }).click();
    await expect(page.getByRole('status').filter({ hasText: 'إلى السلة' })).toBeVisible();
    await expect.poll(() => cartBadgeLabel(page)).toBe('سلة التسوق: قطعة واحدة');
  });

  test('لا تحتوي ادعاءات غير مؤكدة', async ({ page }) => {
    await page.goto('/');
    const text = await page.locator('body').innerText();
    expect(text).not.toMatch(/ألماني|صنع في|ضمان لمدة|خصم|تقييم|توصيل مجاني|توصيل خلال/);
  });

  test('«تسوق الآن» ينزل للمنتجات و«بحث وتصفية» يفتح المتجر', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'تسوق الآن' }).click();
    await expect(page).toHaveURL(/#products$/);
    await expect(page.getByRole('heading', { level: 2, name: 'كل المنتجات' })).toBeInViewport();
    await page.getByRole('link', { name: 'بحث وتصفية' }).click();
    await expect(page).toHaveURL(/\/shop\/$/);
    await expect(page.getByRole('heading', { level: 1, name: 'المتجر' })).toBeVisible();
  });
});

test.describe('البحث والتصفية', () => {
  test('البحث من الهيدر بكلمة دارجة', async ({ page, isMobile }) => {
    await page.goto('/');
    const search = page.locator(isMobile ? '#header-search-mobile' : '#header-search');
    await search.fill('واشر');
    await search.press('Enter');
    await expect(page).toHaveURL(/\/shop\/\?q=/);
    await expect(page.locator('#results-heading')).toContainText('3 منتجات');
    await expect(page.getByRole('heading', { name: WASHER.name })).toBeVisible();
  });

  test('البحث برقم الموديل وبدون نتائج ثم المسح', async ({ page, isMobile }) => {
    await page.goto('/shop/');
    const search = page.locator(isMobile ? '#header-search-mobile' : '#header-search');
    await search.fill('bs300f');
    await search.press('Enter');
    await expect(page.locator('#results-heading')).toContainText('منتج واحد');

    await search.fill('ثلاجة');
    await search.press('Enter');
    await expect(page.getByText('لم نجد منتجات مطابقة')).toBeVisible();
    await page.getByRole('button', { name: 'مسح البحث' }).click();
    await expect(page.locator('#results-heading')).toContainText('12 منتجًا');
  });

  test('التصفية حسب القسم', async ({ page }) => {
    await page.goto('/shop/');
    await page.getByRole('navigation', { name: 'تصفية حسب القسم' }).getByRole('link', { name: /العدد والأدوات اليدوية/ }).click();
    await expect(page).toHaveURL(/\/shop\/hand-tools\/$/);
    await expect(page.getByRole('heading', { level: 1, name: 'العدد والأدوات اليدوية' })).toBeVisible();
    await expect(page.locator('#results-heading')).toContainText('3 منتجات');
    await expect(page.getByRole('heading', { name: SOCKETS.name })).toBeVisible();
    await expect(page.getByRole('heading', { name: TOOLCASE.name })).toBeVisible();
  });

  test('تصفية السعر مطوية وتعمل بالأسعار المعتمدة', async ({ page }) => {
    // الأسعار الافتراضية من البيانات بغض النظر عن اختبارات لوحة التحكم المتوازية
    await page.route('**/api/catalog', (route) => route.abort());
    await page.goto('/shop/');
    await expect(page.locator('#price-min')).toBeHidden();
    await page.getByText('تصفية حسب السعر').click();
    await page.locator('#price-min').fill('25');
    await page.getByRole('button', { name: 'تطبيق السعر' }).click();
    // 26 (جامب ستارتر) + 35 + 30 + 25 + 29 (شنطة العدة) + 30
    await expect(page.locator('#results-heading')).toContainText('6 منتجات');
    await expect(page.getByRole('heading', { name: DRILL.name })).toHaveCount(0);
  });

  test('بدون أي أسعار لا تظهر تصفية السعر ولا ترتيبه', async ({ page }) => {
    await page.route('**/api/catalog', async (route) => {
      const products = Object.fromEntries(ALL_PRODUCT_IDS.map((id) => [id, { priceFils: null, availability: 'unconfirmed' }]));
      await route.fulfill({ json: { ok: true, products } });
    });
    await page.goto('/shop/');
    await expect(page.getByRole('heading', { name: WASHER.name })).toBeVisible();
    await expect(page.getByText('تصفية حسب السعر')).toHaveCount(0);
    await expect(page.locator('#shop-sort option')).toHaveCount(2);
  });
});

test.describe('الأسعار الحية', () => {
  test('عند اعتماد الأسعار تظهر في البطاقات وتعمل تصفية وترتيب السعر', async ({ page }) => {
    await page.route('**/api/catalog', async (route) => {
      const res = await route.fetch();
      const data = await res.json();
      data.products['boss-bs-300f-pressure-washer'] = { priceFils: 45500, availability: 'in_stock' };
      data.products['boss-bs-2070-pressure-washer'] = { priceFils: 29750, availability: 'out_of_stock' };
      await route.fulfill({ response: res, json: data });
    });
    await page.goto('/shop/washing-cleaning/');
    await expect(page.getByText('45.500 د.ك')).toBeVisible();
    await expect(page.getByText('29.750 د.ك')).toBeVisible();
    await expect(page.getByText('غير متوفر حاليًا')).toBeVisible();
    await expect(page.locator('#shop-sort option')).toHaveCount(4);
    await page.locator('#shop-sort').selectOption('price-asc');
    // الترتيب يُطبَّق بعد تحديث الرابط — ننتظر النتيجة بدل قراءة القائمة فورًا
    await expect(page).toHaveURL(/sort=price-asc/);
    const names = page.locator('section[aria-labelledby="results-heading"] h3');
    await expect(names.nth(0)).toContainText('239-7'); // 20.000 ثم 29.750 ثم 45.500
    await expect(names.nth(1)).toContainText('BS-2070');
    await page.getByText('تصفية حسب السعر').click();
    await page.locator('#price-min').fill('40');
    await page.getByRole('button', { name: 'تطبيق السعر' }).click();
    await expect(page.locator('#results-heading')).toContainText('منتج واحد');

    await page.goto('/products/boss-bs-2070-pressure-washer/');
    await expect(page.getByText('هذا المنتج غير متوفر حاليًا ولا يمكن إضافته للسلة.')).toBeVisible();
  });
});

test.describe('صفحة المنتج', () => {
  test('شنطة العدة: صورها وسعرها، بلا قوائم داخلية', async ({ page }) => {
    await page.goto(`/products/${TOOLCASE.id}/`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(TOOLCASE.name);
    await expect(page.locator('main').getByText('29.000 د.ك').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'المواصفات', exact: true })).toBeVisible();
    await expect(page.getByRole('list', { name: 'الصور المصغرة' }).getByRole('button')).toHaveCount(2);
    // كل المنتجات صار لها صور، فلا يظهر البديل
    await expect(page.getByRole('img', { name: 'صورة المنتج تُضاف قريبًا' })).toHaveCount(0);
    // ما ينتظر التحقق ملاحظة داخلية ولا يُعرض للعميل
    await expect(page.getByText('تفاصيل نتأكد منها')).toHaveCount(0);
  });

  test('مواصفات العلبة منسوبة لمصدرها ومحتويات العلبة ظاهرة', async ({ page }) => {
    await page.goto(`/products/${WASHER.id}/`);
    await expect(page.getByRole('heading', { name: 'يُستخدم في', exact: true })).toBeVisible();
    await expect(page.locator('main').getByText('غسيل الحوش والأرضيات', { exact: true })).toBeVisible();
    const specs = page.locator('dl').filter({ hasText: 'ضغط التشغيل' });
    await expect(specs).toContainText('360 بار');
    await expect(page.getByText('الأرقام حسب بيانات المصنع المطبوعة على العلبة.')).toBeVisible();
    await expect(page.getByRole('heading', { name: /محتويات العلبة/ })).toBeVisible();
    await expect(page.getByText('قارورة رغوة', { exact: true })).toBeVisible();
  });

  test('معرض بأربع صور: الماكينة والعلبة وصورتان توضيحيتان', async ({ page }) => {
    await page.goto('/products/boss-bs-2070-pressure-washer/');
    const thumbs = page.getByRole('list', { name: 'الصور المصغرة' }).getByRole('button');
    await expect(thumbs).toHaveCount(4);
    await thumbs.nth(2).click();
    await expect(thumbs.nth(2)).toHaveAttribute('aria-current', 'true');
  });

  test('معرض الصور: الصور المصغرة والتكبير', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(`/products/${IMPACT.id}/`);
    const thumbs = page.getByRole('list', { name: 'الصور المصغرة' }).getByRole('button');
    await expect(thumbs).toHaveCount(2);
    await thumbs.nth(1).click();
    await expect(thumbs.nth(1)).toHaveAttribute('aria-current', 'true');
    await page.getByRole('button', { name: 'تكبير الصورة' }).click();
    const zoom = page.getByRole('dialog', { name: /عرض مكبر/ });
    await expect(zoom).toBeVisible();
    await expect(zoom.getByRole('img')).toHaveAttribute('src', /02-\d+\.webp$/);
    await zoom.getByRole('button', { name: 'إغلاق العرض المكبر' }).click();
    await expect(zoom).toBeHidden();
    expect(errors).toEqual([]);
  });

  test('صفحات المنتجات لا تحتوي ادعاءات العلبة التسويقية', async ({ page }) => {
    for (const id of ALL_PRODUCT_IDS) {
      await page.goto(`/products/${id}/`);
      const text = await page.locator('main').innerText();
      expect(text, id).not.toMatch(/german|ألماني|copper|نحاس|professional|288V/i);
    }
  });

  test('زر الاستفسار يفتح واتساب برسالة المنتج', async ({ page }) => {
    await page.goto(`/products/${WASHER.id}/`);
    const link = page.getByRole('link', { name: 'اسأل عن المنتج عبر واتساب' });
    const href = await link.getAttribute('href');
    expect(href).toMatch(/^https:\/\/wa\.me\/96550000000\?text=/);
    expect(decodeURIComponent(href!.split('text=')[1]!)).toContain(WASHER.name);
    await expect(link).toHaveAttribute('target', '_blank');

    await page.goto(`/products/${DRILL.id}/`);
    await expect(page.locator('main').getByText('استفسر عن السعر', { exact: true }).first()).toBeVisible();
    const ask = page.getByRole('link', { name: 'استفسر عن السعر عبر واتساب' });
    expect(decodeURIComponent((await ask.getAttribute('href'))!)).toContain('الاستفسار عن سعر المنتج');
  });

  test('رابط منتج غير موجود يعرض 404 واضحة', async ({ page }) => {
    const response = await page.goto('/products/not-a-real-product/');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'الصفحة غير موجودة' })).toBeVisible();
  });
});

test.describe('الصفحات التعريفية والسياسات', () => {
  test('من نحن والتواصل والسياسات', async ({ page }) => {
    await page.goto('/about/');
    await expect(page.getByRole('heading', { level: 1, name: 'من نحن' })).toBeVisible();
    await expect(page.getByText('عتاد متجر إلكتروني في الكويت للمعدات والأدوات التي تحتاجها في الصيانة والعمل')).toBeVisible();

    await page.goto('/contact/');
    const whatsapp = page.locator('main').getByRole('link', { name: /واتساب/ });
    await expect(whatsapp).toHaveAttribute('href', /^https:\/\/wa\.me\/96550000000/);

    await page.goto('/policies/');
    const returns = page.locator('main').getByRole('link', { name: /الاسترجاع والاستبدال/ });
    await expect(returns).toContainText('معتمدة');
    await returns.click();
    await expect(page.getByText('خلال 14 يومًا من تاريخ الاستلام', { exact: false })).toBeVisible();

    await page.goto('/policies/');
    const warranty = page.locator('main').getByRole('link', { name: /الضمان/ });
    await expect(warranty).toContainText('قيد الإعداد');
    await warranty.click();
    await expect(page.getByRole('heading', { name: 'هذه السياسة لم تُعتمد بعد' })).toBeVisible();

    await page.goto('/policies/ordering/');
    await expect(page.getByText('فيُحفظ الطلب في نظام المتجر ويظهر لك رقم الطلب', { exact: false })).toBeVisible();
  });
});

test.describe('القائمة على الجوال', () => {
  test('تفتح وتغلق وتنتقل', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'القائمة الجانبية للجوال فقط');
    await page.goto('/');
    await page.getByRole('button', { name: 'فتح قائمة الأقسام والصفحات' }).click();
    const dialog = page.getByRole('dialog', { name: 'القائمة الرئيسية' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await page.getByRole('button', { name: 'فتح قائمة الأقسام والصفحات' }).click();
    await dialog.getByRole('link', { name: 'من نحن' }).click();
    await expect(page).toHaveURL(/\/about\/$/);
    await expect(dialog).toBeHidden();
  });
});

test.describe('الهيدر', () => {
  test('رابط الشعار اسمه يحتوي النص الظاهر (WCAG 2.5.3) ويعود للرئيسية', async ({ page }) => {
    await page.goto('/about/');
    const home = page.getByRole('banner').getByRole('link', { name: 'عتاد ETAAD — الصفحة الرئيسية' });
    await expect(home).toBeVisible();
    await expect(home).not.toHaveAttribute('aria-label', /.*/);
    await home.click();
    await expect(page).toHaveURL(/\/$/);
  });
});
