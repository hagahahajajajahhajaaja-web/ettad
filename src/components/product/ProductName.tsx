import type { ReactNode } from 'react';

/** تسلسل لاتيني كامل داخل الاسم، مثل «BOSS BS-300F» أو «GS LZTOP» أو «239-7». */
const LATIN_RUN = /[A-Za-z0-9][A-Za-z0-9./-]*(?:\s+[A-Za-z0-9][A-Za-z0-9./-]*)*/g;

/**
 * يعرض اسم المنتج مع عزل كل تسلسل لاتيني كاملًا (العلامة + الموديل) باتجاه LTR،
 * فيظهر «BOSS BS-300F» بترتيبه الصحيح داخل النص العربي ولا ينكسر السطر داخله.
 */
export function ProductName({ name }: { name: string }) {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of name.matchAll(LATIN_RUN)) {
    const start = match.index;
    if (start > last) nodes.push(name.slice(last, start));
    nodes.push(
      <bdi key={start} dir="ltr" className="whitespace-nowrap">
        {match[0]}
      </bdi>,
    );
    last = start + match[0].length;
  }
  if (last < name.length) nodes.push(name.slice(last));
  return <>{nodes}</>;
}
