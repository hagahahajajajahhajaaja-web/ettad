import { describe, expect, it } from 'vitest';
import { isPixelHost, linesPayload, productPayload } from '@/lib/tiktok-pixel';

describe('TikTok pixel', () => {
  it('runs only on the real store domain', () => {
    expect(isPixelHost('etaadq8.com')).toBe(true);
    expect(isPixelHost('www.etaadq8.com')).toBe(true);
    expect(isPixelHost('localhost')).toBe(false);
    expect(isPixelHost('etaad.pages.dev')).toBe(false);
    expect(isPixelHost('etaadq8.com.evil.example')).toBe(false);
  });

  it('sends KWD price and value only when the price is known', () => {
    expect(productPayload({ id: 'a', name: 'A', priceFils: 20000 }, 2)).toEqual({
      content_type: 'product',
      contents: [{ content_id: 'a', content_name: 'A', quantity: 2, price: 20 }],
      currency: 'KWD',
      value: 40,
    });
    expect(productPayload({ id: 'b', name: 'B', priceFils: null }, 1)).toEqual({
      content_type: 'product',
      contents: [{ content_id: 'b', content_name: 'B', quantity: 1 }],
    });
  });

  it('totals a cart in KWD, or omits the value if any price is unknown', () => {
    const priced = linesPayload([
      { product: { id: 'a', name: 'A', priceFils: 17500 }, quantity: 1 },
      { product: { id: 'b', name: 'B', priceFils: 22000 }, quantity: 2 },
    ]);
    expect(priced.value).toBe(61.5);
    expect(priced.currency).toBe('KWD');
    expect(priced.contents).toHaveLength(2);

    const mixed = linesPayload([
      { product: { id: 'a', name: 'A', priceFils: 17500 }, quantity: 1 },
      { product: { id: 'c', name: 'C', priceFils: null }, quantity: 1 },
    ]);
    expect(mixed.value).toBeUndefined();
    expect(mixed.currency).toBeUndefined();
    expect(mixed.contents).toHaveLength(2);
  });
});
