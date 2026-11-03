import type { ReactNode } from 'react';

/** عنوان قسم برقم تسلسلي ومسطرة قياس — عنصر هوية متكرر في عتاد. */
export function SectionHeading({
  index,
  eyebrow,
  title,
  action,
  id,
}: {
  index: string;
  eyebrow: string;
  title: string;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <span className="ltr-isolate bg-ink px-1.5 py-0.5 font-mono text-xs text-paper">{index}</span>
            {eyebrow}
          </p>
          <h2 id={id} className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
            {title}
          </h2>
        </div>
        {action}
      </div>
      <div className="ruler mt-4 h-3 text-steel-300" aria-hidden="true" />
    </div>
  );
}
