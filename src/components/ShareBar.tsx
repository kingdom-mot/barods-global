'use client';

import { useState } from 'react';

export default function ShareBar({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://barodsglobal.com${path}`;
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${t}%20${u}` },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { label: 'X', href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { label: 'Email', href: `mailto:?subject=${t}&body=${u}` },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted">Share:</span>
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="rounded-md border border-line px-3 py-1.5 hover:border-brand-green hover:text-brand-green">
          {l.label}
        </a>
      ))}
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            /* clipboard blocked: nothing to do */
          }
        }}
        className="rounded-md border border-line px-3 py-1.5 hover:border-brand-green hover:text-brand-green"
      >
        {copied ? 'Link copied' : 'Copy link'}
      </button>
    </div>
  );
}
