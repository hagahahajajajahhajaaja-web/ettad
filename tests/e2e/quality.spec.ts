import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { WASHER, addToCart } from './helpers';

const pages = ['/', '/shop/', '/shop/washing-cleaning/', `/products/${WASHER.id}/`, '/cart/', '/checkout/', '/about/', '/contact/', '/policies/', '/policies/privacy/', '/admin/'];

test.describe('الجودة', () => {
  for (const path of pages) {
    test(`${path}: لا تمرير أفقي ولا مخالفات وصول جسيمة`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    });
  }

  test('صفحة الطلب بعد إضافة منتج متاحة لقارئ الشاشة', async ({ page }) => {
    await addToCart(page, WASHER.id);
    await page.goto('/checkout/');
    await expect(page.getByLabel('الاسم')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
  });
});

test.describe('SEO', () => {
  test('Metadata و Open Graph للمنتج', async ({ page }) => {
    await page.goto(`/products/${WASHER.id}/`);
    await expect(page).toHaveTitle(`${WASHER.name} | عتاد | ETAAD`);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', new RegExp(WASHER.name));
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\/etaad-og\.png|\/images\/products\//);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'ar_KW');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`/products/${WASHER.id}/$`));
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    const product = jsonLd.map((t) => JSON.parse(t)).find((d) => d['@type'] === 'Product');
    expect(product.brand.name).toBe('BOSS');
    // السعر المعتمد فقط، بدون ادعاء توفر لم يحدده المتجر
    expect(product.offers).toEqual({ '@type': 'Offer', priceCurrency: 'KWD', price: '35.000', url: expect.stringContaining(`/products/${WASHER.id}/`) });
  });

  test('لوحة التحكم غير مفهرسة وخارج الـ sitemap', async ({ page, request }) => {
    await page.goto('/admin/');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    expect(await (await request.get('/sitemap.xml')).text()).not.toContain('/admin');
  });

  test('sitemap و robots', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain(`/products/${WASHER.id}/`);
    expect(sitemap).toContain('/shop/hand-tools/');
    expect(sitemap).toContain('/policies/returns/');
    expect(sitemap).not.toContain('/policies/warranty/');
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Disallow: /checkout/');
    expect(robots).toContain('Sitemap:');
  });

  test('صفحات السلة والطلب غير مفهرسة', async ({ page }) => {
    await page.goto('/checkout/');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
});
