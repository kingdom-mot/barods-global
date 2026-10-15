'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { deleteListing, setAvailability } from '@/app/portal/actions';

export default function ListingRowActions({ id, status, availability, purpose }: { id: string; status: string; availability: string; purpose: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const closed = purpose === 'sale' ? 'sold' : 'let';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === 'published' && (
        <label className="sr-only" htmlFor={`av-${id}`}>Availability</label>
      )}
      {status === 'published' && (
        <select
          id={`av-${id}`}
          className="field h-9 w-auto py-1 text-xs"
          defaultValue={availability}
          disabled={pending}
          onChange={(e) => {
            const v = e.target.value as 'available' | 'under_offer' | 'sold' | 'let';
            start(async () => {
              await setAvailability(id, v);
              router.refresh();
            });
          }}
        >
          <option value="available">Available</option>
          <option value="under_offer">Under offer</option>
          <option value={closed}>{closed === 'sold' ? 'Sold' : 'Let'}</option>
        </select>
      )}
      {(status === 'draft' || status === 'sent_back') && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm('Delete this listing? This can’t be undone.')) return;
            start(async () => {
              const r = await deleteListing(id);
              if (!r.ok) alert(r.error);
              router.refresh();
            });
          }}
          className="rounded-md px-2 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
        >
          Delete
        </button>
      )}
    </div>
  );
}
