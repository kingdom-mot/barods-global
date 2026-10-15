'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

type Item = { href: string; label: string; badge?: number };

export default function PortalNav({ items, name, roleLabel }: { items: Item[]; name: string; roleLabel: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Highlight the most specific match, so "Add a listing" doesn't also light up "My listings".
  const best = items
    .map((i) => i.href)
    .filter((h) => pathname === h || pathname.startsWith(h + '/'))
    .sort((a, b) => b.length - a.length)[0];
  const active = (href: string) => href === best;

  const links = (
    <nav className="flex flex-col gap-1" aria-label="Portal">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          onClick={() => setOpen(false)}
          className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors ${
            active(i.href) ? 'bg-brand-green text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
          }`}
        >
          {i.label}
          {!!i.badge && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${active(i.href) ? 'bg-white text-brand-greenDark' : 'bg-brand-orange text-white'}`}>
              {i.badge}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-white/10 pt-4">
      <div className="truncate text-sm font-semibold text-white">{name}</div>
      <div className="mb-3 text-xs text-white/60">{roleLabel}</div>
      <div className="flex gap-2">
        <Link href="/" className="flex-1 rounded-md border border-white/20 px-3 py-2 text-center text-xs text-white/80 hover:bg-white/10">View website</Link>
        <form action="/auth/signout" method="post" className="flex-1">
          <button type="submit" className="w-full rounded-md border border-white/20 px-3 py-2 text-xs text-white/80 hover:bg-white/10">Sign out</button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 bg-brand-ink p-5 lg:flex">
        <Link href="/portal"><img src="/brand/logo-white.png" alt="Barods Global" className="h-12 w-auto" /></Link>
        <div className="flex-1 overflow-y-auto">{links}</div>
        {footer}
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 bg-brand-ink lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/portal"><img src="/brand/logo-white.png" alt="Barods Global" className="h-10 w-auto" /></Link>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-white/20 text-white"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
        {open && <div className="space-y-4 border-t border-white/10 p-4">{links}{footer}</div>}
      </div>
    </>
  );
}
