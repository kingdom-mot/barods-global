'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { deleteListing, setAvailability } from '@/app/portal/actions';
import { setListingFlags } from '@/app/portal/admin-actions';

const LABELS = ['Hot Offer', 'New', 'Price Reduced', 'Sole Mandate', 'On Show', 'Offer Made'];

export default function ListingRowActions({
  id,
  status,
  availability,
  purpose,
  isStaff = false,
  featured = false,
  label = null,
}: {
  id: string;
  status: string;
  availability: string;
  purpose: string;
  isStaff?: boolean;
  featured?: boolean;
  label?: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const closed = purpose === 'sale' ? 'sold' : 'let';

  const flags = (f: Parameters<typeof setListingFlags>[1], confirmText?: string) => {
    if (confirmText && !confirm(confirmText)) return;
    start(async () => {
      const r = await setListingFlags(id, f);
      if (!r.ok) alert(r.error);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isStaff && status === 'published' && (
        <>
          <button
            type="button"
            disabled={pending}
            onClick={() => flags({ featured: !featured })}
            aria-pressed={featured}
            className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold ${featured ? 'border-brand-orange bg-brand-orange text-white' : 'border-line hover:border-brand-orange hover:text-brand-orange'}`}
          >
            {featured ? '★ Featured' : '☆ Feature'}
          </button>
          <label className="sr-only" htmlFor={`lb-${id}`}>Label</label>
          <select id={`lb-${id}`} className="field h-9 w-auto py-1 text-xs" defaultValue={label ?? ''} disabled={pending} onChange={(e) => flags({ label: e.target.value || null })}>
            <option value="">No label</option>
            {LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </>
      )}
      {isStaff && status === 'archived' && (
        <button type="button" disabled={pending} onClick={() => flags({ archived: false })} className="rounded-md border border-line px-2.5 py-1.5 text-xs font-semibold hover:border-brand-green hover:text-brand-greenDark">
          Restore to website
        </button>
      )}
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
      {isStaff && status !== 'archived' && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            flags(
              { archived: true },
              status === 'published'
                ? 'Archive this listing? It comes off the website but stays here, and you can restore it any time.'
                : 'Archive this listing? It moves to Archived, and you can restore it any time.',
            )
          }
          className="rounded-md border border-line px-2.5 py-1.5 text-xs font-semibold text-muted hover:border-brand-ink hover:text-brand-ink"
        >
          Archive
        </button>
      )}
      {(isStaff || status === 'draft' || status === 'sent_back') && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const live = status === 'published';
            if (
              !confirm(
                live
                  ? 'Delete this live listing permanently? It disappears from the website and can’t be restored. (Archive instead if you might need it again.) Enquiries about it stay in Leads.'
                  : 'Delete this listing permanently? This can’t be undone. Enquiries about it stay in Leads.',
              )
            )
              return;
            start(async () => {
              const r = await deleteListing(id);
              if (!r.ok) alert(r.error);
              router.refresh();
            });
          }}
          className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
        >
          Delete
        </button>
      )}
    </div>
  );
}
