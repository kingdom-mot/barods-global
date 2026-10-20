import Link from 'next/link';
import type { ReactNode } from 'react';
import type { LegalDoc } from '@/lib/legal';

/** Turns email addresses and the policy name into links inside plain legal text. */
function linkify(text: string): ReactNode[] {
  return text.split(/(support@barodsglobal\.com|Privacy Policy\.)/g).map((part, i) => {
    if (part === 'support@barodsglobal.com')
      return <a key={i} href="mailto:support@barodsglobal.com" className="font-medium text-brand-greenDark underline underline-offset-2">{part}</a>;
    if (part === 'Privacy Policy.')
      return <span key={i}><Link href="/privacy" className="font-medium text-brand-greenDark underline underline-offset-2">Privacy Policy</Link>.</span>;
    return part;
  });
}

export default function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <>
      <section className="bg-brand-ink py-14 text-white">
        <div className="container-site">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-green">Barods Global Limited</p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">{doc.title}</h1>
          <p className="mt-3 max-w-2xl text-white/75">{doc.subtitle}</p>
          <p className="mt-5 text-sm text-white/60">RC 1728787 · Last updated {doc.updated}</p>
        </div>
      </section>

      <div className="container-site grid gap-10 py-12 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label="On this page" className="hidden lg:block">
          <div className="sticky top-[150px] max-h-[calc(100vh-170px)] overflow-y-auto">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">On this page</p>
            <ol className="space-y-1.5 text-sm">
              {doc.sections.map((sec, i) => (
                <li key={sec.id}>
                  <a href={`#${sec.id}`} className="flex gap-2 text-muted hover:text-brand-greenDark">
                    <span className="w-5 shrink-0 tabular-nums">{i + 1}.</span>
                    <span>{sec.heading}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <article className="max-w-3xl">
          {doc.sections.map((sec, i) => (
            <section key={sec.id} id={sec.id} className="scroll-mt-[150px] border-b border-line py-7 first:pt-0 last:border-0">
              <h2 className="flex gap-3 text-xl font-semibold">
                <span className="text-brand-green tabular-nums">{i + 1}.</span>
                {sec.heading}
              </h2>
              <div className="mt-3 space-y-3 text-[16px] leading-relaxed text-brand-ink/85">
                {sec.blocks.map((b, j) =>
                  Array.isArray(b) ? (
                    <ul key={j} className="list-disc space-y-2 pl-5 marker:text-brand-green">
                      {b.map((li) => <li key={li}>{linkify(li)}</li>)}
                    </ul>
                  ) : (
                    <p key={j}>{linkify(b)}</p>
                  ),
                )}
              </div>
            </section>
          ))}
        </article>
      </div>
    </>
  );
}
