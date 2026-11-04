'use client';

import { useId } from 'react';
import { Icon } from '@/components/ui/Icon';
import { toLatinDigits } from '@/lib/format';

export function QuantityStepper({
  value,
  onChange,
  max,
  label,
  size = 'md',
}: {
  value: number;
  onChange: (value: number) => void;
  max: number;
  label: string;
  size?: 'sm' | 'md';
}) {
  const id = useId();
  const box = size === 'sm' ? 'size-10' : 'size-12';
  return (
    <div className="inline-flex items-stretch border-2 border-ink bg-white">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <button
        type="button"
        className={`grid ${box} place-items-center hover:bg-plate disabled:opacity-35`}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="زيادة الكمية"
      >
        <Icon name="plus" className="size-4" />
      </button>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(event) => {
          const parsed = Number.parseInt(toLatinDigits(event.target.value).replace(/\D/g, ''), 10);
          if (Number.isFinite(parsed)) onChange(Math.min(max, Math.max(1, parsed)));
        }}
        className={`ltr-isolate w-12 border-x-2 border-ink text-center font-black focus:outline-none ${size === 'sm' ? 'text-base' : 'text-lg'}`}
      />
      <button
        type="button"
        className={`grid ${box} place-items-center hover:bg-plate disabled:opacity-35`}
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="إنقاص الكمية"
      >
        <Icon name="minus" className="size-4" />
      </button>
    </div>
  );
}
