import { Icon } from '@/components/ui/Icon';
import { paths } from '@/lib/urls';

/** نموذج بحث يعمل حتى بدون JavaScript (GET إلى صفحة المتجر). */
export function SearchForm({ id, className = '', tone = 'dark' }: { id: string; className?: string; tone?: 'dark' | 'light' }) {
  const field =
    tone === 'dark'
      ? 'bg-ink-800 text-paper placeholder:text-steel-300 border-ink-600 focus:border-orange'
      : 'bg-white text-ink placeholder:text-steel border-line focus:border-ink';
  return (
    <form action={paths.shop} method="get" role="search" className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        ابحث في منتجات عتاد
      </label>
      <input
        id={id}
        name="q"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        maxLength={80}
        placeholder="ابحث عن منتج، علامة، موديل…"
        className={`h-12 w-full border-2 pe-14 ps-4 transition-colors focus:outline-none ${field}`}
      />
      <button
        type="submit"
        className="absolute inset-y-0 end-0 grid w-12 place-items-center bg-orange text-ink hover:bg-orange-600"
        aria-label="بحث"
      >
        <Icon name="search" />
      </button>
    </form>
  );
}
