import { expect, type Page } from '@playwright/test';

export const WASHER = { id: 'boss-bs-300f-pressure-washer', name: 'ماكينة غسيل ضغط عالٍ BOSS BS-300F' };
export const SOCKETS = { id: 'boss-94pc-socket-wrench-set', name: 'طقم بوكسات BOSS من 94 قطعة' };
export const TOOLCASE = { id: 'rolling-tool-case-kit', name: 'شنطة عدة 187 قطعة بعجلات' };
export const IMPACT = { id: 'gulfik-brushless-impact-wrench-kit', name: 'مفتاح تواير السيارة GULFIK' };
/** المنتج الوحيد بدون سعر معتمد بعد. */
export const DRILL = { id: 'gulfik-brushless-drill-kit', name: 'طقم دريل لاسلكي GULFIK بمحرك Brushless' };
export const ALL_PRODUCT_IDS = [
  'himk-mk326-jump-starter-inflator',
  'car-jump-starter-6in1',
  'boss-bs-300f-pressure-washer',
  'boss-bs-2070-pressure-washer',
  'boss-239-7-cordless-water-gun',
  'gulfik-brushless-drill-kit',
  'boss-94pc-socket-wrench-set',
  'gs-lztop-94pc-socket-set',
  'rolling-tool-case-kit',
  'gulfik-brushless-impact-wrench-kit',
  'boss-cordless-impact-wrench-kit',
  'boss-12v-tire-compressor',
];

/** يجمع أخطاء المتصفح ليفشل الاختبار عند أي خطأ JavaScript. */
export function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

export async function addToCart(page: Page, productId: string, quantity = 1) {
  await page.goto(`/products/${productId}/`);
  const panel = page.locator('main');
  const add = panel.getByRole('button', { name: 'أضف إلى السلة' });
  await expect(add).toBeEnabled();
  for (let i = 1; i < quantity; i++) await panel.getByRole('button', { name: 'زيادة الكمية' }).first().click();
  await add.click();
  await expect(page.getByRole('status').filter({ hasText: 'إلى السلة' })).toBeVisible();
}

export async function cartBadgeLabel(page: Page) {
  return page.getByRole('banner').getByRole('link', { name: /سلة التسوق/ }).getAttribute('aria-label');
}
