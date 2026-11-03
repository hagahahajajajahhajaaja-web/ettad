import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react';
import { navigate, pathToHash } from '../router';

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string;
  children?: ReactNode;
  prefetch?: boolean;
  scroll?: boolean;
  replace?: boolean;
};

/** بديل next/link في المعاينة: الروابط الداخلية تتحول إلى #اسم. */
const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, onClick, children, replace, ...props },
  ref,
) {
  // prefetch و scroll خاصّان بـ Next ولا معنى لهما في المعاينة
  const { prefetch, scroll, ...rest } = props;
  void prefetch;
  void scroll;
  const internal = href.startsWith('/');
  return (
    <a
      ref={ref}
      href={internal ? `#${pathToHash(href)}` : href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || !internal || event.metaKey || event.ctrlKey) return;
        event.preventDefault();
        navigate(href, { replace });
      }}
      {...rest}
    >
      {children}
    </a>
  );
});

export default Link;
