'use client';

import { useRouter } from 'next/navigation';
import { CURRENCIES, type CurrencyCode } from '@/lib/currency';

export default function CurrencySwitcher({ current }: { current: CurrencyCode }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">Currency</span>
      <select
        value={current}
        onChange={(e) => {
          document.cookie = `currency=${e.target.value}; path=/; max-age=${60 * 60 * 24 * 180}`;
          router.refresh();
        }}
        className="h-10 rounded-md border border-white/30 bg-transparent px-2 text-sm text-white [&>option]:text-brand-ink"
      >
        {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => (
          <option key={c} value={c}>
            {CURRENCIES[c].symbol} {CURRENCIES[c].label}
          </option>
        ))}
      </select>
    </label>
  );
}
