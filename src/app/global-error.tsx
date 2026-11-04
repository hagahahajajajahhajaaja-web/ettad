'use client';

/** آخر خط دفاع إذا تعطل التخطيط نفسه. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#F7F7F5', color: '#111820', padding: '4rem 1rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900 }}>تعذر تحميل متجر عتاد</h1>
        <p style={{ marginTop: '0.75rem', color: '#4d5660' }}>حدث خطأ غير متوقع. حاول مرة أخرى بعد لحظات.</p>
        <button
          type="button"
          onClick={reset}
          style={{ marginTop: '1.5rem', minHeight: 48, padding: '0 1.5rem', background: '#F58220', color: '#111820', fontWeight: 800, border: 0 }}
        >
          إعادة المحاولة
        </button>
      </body>
    </html>
  );
}
