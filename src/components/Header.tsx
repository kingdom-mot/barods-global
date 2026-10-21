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

const PhoneIcon = ({ className = 'h-[18px] w-[18px]' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />
  </svg>
);

/** Office number from Website settings in the portal; falls back to the main line. */
export default function Header({ currency, phone = '+234 802 228 8806' }: { currency: CurrencyCode; phone?: string }) {
  const tel = `tel:${phone.replace(/[^0-9+]/g, '')}`;
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
          {/* Full number on wide screens; icon only where the menu needs the room */}
          <a href={tel} className="btn-green gap-2 whitespace-nowrap px-4 xl:px-5" aria-label={`Call ${phone}`}>
            <PhoneIcon />
            <span className="hidden xl:inline">{phone}</span>
          </a>
        </div>

        <a href={tel} className="btn-green ml-auto h-11 w-11 shrink-0 p-0 lg:hidden" aria-label={`Call ${phone}`}>
          <PhoneIcon className="h-5 w-5" />
        </a>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-line lg:hidden"
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
            <div className="flex flex-wrap items-center justify-between gap-4 py-3">
              <CurrencySwitcher current={currency} />
              <a href={tel} className="btn-green gap-2" onClick={() => setOpen(false)}>
                <PhoneIcon /> {phone}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
