'use client';

import { useEffect, useState } from 'react';
import { adminApi, type AdminProduct } from '@/components/admin/api';
import { ProductName } from '@/components/product/ProductName';
import { useNotify } from '@/components/ui/Notices';
import { availabilityLabels, formatKwd, parseKwdToFils } from '@/lib/format';
import type { Availability } from '@/lib/schema';

const AVAILABILITY_OPTIONS: Availability[] = ['unconfirmed', 'in_stock', 'out_of_stock'];

function filsToInput(fils: number | null): string {
  return fils === null ? '' : (fils / 1000).toFixed(3).replace(/\.?0+$/, '');
}

export function ProductsPanel({ onError }: { onError: (e: unknown) => void }) {
  const [products, setProducts] = useState<AdminProduct[] | null>(null);

  useEffect(() => {
    adminApi
      .products()
      .then((r) => setProducts(r.products))
      .catch(onError);
  }, [onError]);

  return (
    <section aria-labelledby="products-heading">
      <h1 id="products-heading" className="text-2xl font-black">
        الأسعار والتوفر
      </h1>
      <p className="mt-1 leading-7 text-steel-700">
        اكتب السعر بالدينار (مثل 12.500) واترك الخانة فارغة ليظهر «استفسر عن السعر». يظهر التغيير في المتجر خلال ثوانٍ.
      </p>
      <p className="mt-1 text-sm leading-6 text-steel-700">
        التوفر: «التوفر قيد التأكيد» لا يظهر للعميل، و«متوفر» يظهر بجانب السعر، و«غير متوفر حاليًا» يوقف الطلب على المنتج.
      </p>
      <div className="mt-5 space-y-3">
        {products === null ? (
          <p role="status" className="py-10 text-center font-bold text-steel-700">
            جارٍ تحميل المنتجات…
          </p>
        ) : (
          products.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              onSaved={(updated) => setProducts((list) => list?.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)) ?? null)}
              onError={onError}
            />
          ))
        )}
      </div>
    </section>
  );
}

function ProductRow({ product, onSaved, onError }: { product: AdminProduct; onSaved: (p: AdminProduct) => void; onError: (e: unknown) => void }) {
  const [price, setPrice] = useState(filsToInput(product.priceFils));
  const [availability, setAvailability] = useState<Availability>(product.availability);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const notify = useNotify();
  const dirty = price !== filsToInput(product.priceFils) || availability !== product.availability;
  const inputId = `price-${product.id}`;

  return (
    <form
      className="grid gap-3 border border-line bg-white p-3 sm:grid-cols-[4rem_1fr] md:grid-cols-[4rem_1fr_9rem_11rem_auto] md:items-end"
      aria-label={product.name}
      onSubmit={async (e) => {
        e.preventDefault();
        const trimmed = price.trim();
        const priceFils = trimmed ? parseKwdToFils(trimmed) : null;
        if (trimmed && (priceFils === null || priceFils <= 0)) {
          setError('اكتب السعر بالأرقام، مثل 12.500');
          return;
        }
        setError(null);
        setBusy(true);
        try {
          await adminApi.updateProduct(product.id, { priceFils, availability });
          notify({ tone: 'success', message: `تم الحفظ: ${priceFils === null ? 'استفسر عن السعر' : formatKwd(priceFils)} — ${availabilityLabels[availability]}` });
          onSaved({ ...product, priceFils, availability, updatedAt: Date.now() });
        } catch (err) {
          onError(err);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="hidden aspect-square bg-plate sm:block">
        {product.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element -- صورة مصغرة محسّنة مسبقًا
          <img src={product.thumbnail} alt="" className="h-full w-full object-contain p-1" loading="lazy" />
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="font-black leading-snug">
          <ProductName name={product.name} />
        </p>
        <p className="text-sm text-steel-700">{product.categoryName}</p>
      </div>
      <div>
        <label htmlFor={inputId} className="field-label">
          السعر (د.ك)
        </label>
        <input
          id={inputId}
          inputMode="decimal"
          dir="ltr"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="استفسر"
          className="field-input"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
        />
      </div>
      <div>
        <label htmlFor={`avail-${product.id}`} className="field-label">
          التوفر
        </label>
        <select id={`avail-${product.id}`} value={availability} onChange={(e) => setAvailability(e.target.value as Availability)} className="field-input">
          {AVAILABILITY_OPTIONS.map((a) => (
            <option key={a} value={a}>
              {availabilityLabels[a]}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn-primary" disabled={!dirty || busy}>
        {busy ? 'جارٍ الحفظ…' : 'حفظ'}
      </button>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="field-error md:col-span-5">
          {error}
        </p>
      ) : null}
    </form>
  );
}
