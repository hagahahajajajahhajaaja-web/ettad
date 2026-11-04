import type { ReactNode } from 'react';
import { Breadcrumbs, type Crumb } from '@/components/ui/Breadcrumbs';

export function PageHeader({
  title,
  description,
  crumbs,
  children,
}: {
  title: string;
  description?: string;
  crumbs: Crumb[];
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-line bg-white">
      <div className="container-etaad py-5 sm:py-8">
        <Breadcrumbs items={crumbs} />
        <h1 className="mt-3 text-2xl font-black leading-tight sm:mt-4 sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-base leading-7 text-steel-700 sm:text-lg">{description}</p> : null}
        {children}
      </div>
    </div>
  );
}
