/**
 * شعار عتاد: صامولة سداسية بداخلها حرف E، والذراع الأوسط البرتقالي يخترق إطار الصامولة
 * كأداة مُدخلة — يجمع بين حرف العلامة والطابع الميكانيكي.
 */
export function LogoMark({
  className = 'size-10',
  title,
  tone = 'light-bg',
}: {
  className?: string;
  title?: string;
  /** light-bg: صامولة فحمية على خلفية فاتحة. dark-bg: صامولة أفتح بإطار معدني لتظهر على الخلفية الداكنة. */
  tone?: 'light-bg' | 'dark-bg';
}) {
  const hex = 'M24 2.5 42.6 13.25v21.5L24 45.5 5.4 34.75v-21.5Z';
  return (
    <svg viewBox="0 0 48 48" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      <path d={hex} fill={tone === 'dark-bg' ? '#242E39' : '#111820'} />
      {tone === 'dark-bg' ? <path d={hex} fill="none" stroke="#69737D" strokeWidth="1.5" /> : null}
      <rect x="13.5" y="13" width="4.75" height="22" fill="#F7F7F5" />
      <rect x="13.5" y="13" width="18.5" height="4.75" fill="#F7F7F5" />
      <rect x="13.5" y="30.25" width="18.5" height="4.75" fill="#F7F7F5" />
      <rect x="18.25" y="21.6" width="29.75" height="4.8" fill="#F58220" />
    </svg>
  );
}

export function Logo({ tone = 'dark', className = '' }: { tone?: 'dark' | 'light'; className?: string }) {
  const text = tone === 'dark' ? 'text-ink' : 'text-paper';
  const sub = tone === 'dark' ? 'text-steel-700' : 'text-steel-300';
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="size-10 shrink-0 sm:size-11" tone={tone === 'light' ? 'dark-bg' : 'light-bg'} />
      <span className="flex flex-col leading-none">
        <span className={`text-[1.65rem] font-black sm:text-[1.8rem] ${text}`}>عتاد</span>{' '}
        <span className={`ltr-isolate mt-0.5 text-[0.68rem] font-bold tracking-[0.42em] ${sub}`}>ETAAD</span>
      </span>
    </span>
  );
}
