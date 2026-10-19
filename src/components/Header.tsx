'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import CurrencySwitcher from './CurrencySwitcher';
import type { CurrencyCode } from '@/lib/currency';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/about-us', label: 'About Us' },
  { href: '/properties', label: 'Properties' },
  { href: '/agents', label: 'Agents' },
  { href: '/our-services', label: 'Our Services' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact-us', label: 'Contact Us' },
];

export default function Header({ currency }: { currency: CurrencyCode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white text-brand-ink shadow-sm">
      <div className="container-site flex h-[76px] items-center gap-6">
        <Link href="/" className="shrink-0" aria-label="Barods Global Limited home">
          <img src="/brand/logo.png" alt="Barods Global Limited" className="h-12 w-auto sm:h-14" />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`text-[15px] font-bold hover:text-brand-green ${isActive(n.href) ? 'text-brand-green' : 'text-brand-ink'}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-4 lg:flex">
          <CurrencySwitcher current={currency} />
          <Link href="/login" className="btn-green">
            Agent Login
          </Link>
        </div>

        <button
          type="button"
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-md border border-line lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-white lg:hidden">
          <nav className="container-site flex flex-col py-3" aria-label="Mobile">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={`py-3 text-base font-bold hover:text-brand-green ${isActive(n.href) ? 'text-brand-green' : 'text-brand-ink'}`}>
                {n.label}
              </Link>
            ))}
            <div className="flex items-center justify-between gap-4 py-3">
              <CurrencySwitcher current={currency} />
              <Link href="/login" className="btn-green" onClick={() => setOpen(false)}>
                Agent Login
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
