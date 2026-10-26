import type { Metadata } from 'next';
import EnquiryForm from '@/components/EnquiryForm';
import MarketEvaluation from '@/components/MarketEvaluation';
import { waNumber } from '@/lib/phone';
import { getContact, MAPS_LISTING_URL } from '@/lib/settings';

export const metadata: Metadata = { title: 'Contact Us' };

export default async function ContactPage({ searchParams }: { searchParams: { report?: string } }) {
  const report = searchParams.report;
  const contact = await getContact();
  const tel = `tel:${contact.phone.replace(/[^0-9+]/g, '')}`;
  const info = [
    { label: 'Office', value: contact.address, href: MAPS_LISTING_URL, external: true },
    { label: 'Phone', value: contact.phone, href: tel },
    { label: 'Email', value: contact.email, href: `mailto:${contact.email}` },
    {
      label: 'WhatsApp',
      value: 'Chat with us on WhatsApp',
      href: `https://wa.me/${waNumber(contact.whatsapp || contact.phone)}?text=${encodeURIComponent('Hello Barods Global, I have an enquiry.')}`,
      external: true,
    },
  ];
  return (
    <>
    <div className="container-site py-14">
      <h1 className="section-title">Contact Us</h1>
      <p className="section-sub">Talk to an expert about buying, renting, building or managing property.</p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {info.map((i) => (
          <div key={i.label} className="rounded-xl border border-line bg-paper p-5">
            <dt className="text-xs uppercase tracking-wide text-muted">{i.label}</dt>
            <dd className="mt-1">
              <a
                href={i.href}
                {...(i.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="font-semibold hover:text-brand-greenDark"
              >
                {i.value}
              </a>
            </dd>
          </div>
        ))}
      </dl>
      {(contact.hours || contact.reply) && (
        <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
          {contact.hours && (
            <span className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-green" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
              <span><strong className="font-semibold text-brand-ink">Office hours:</strong> {contact.hours}</span>
            </span>
          )}
          {contact.reply && (
            <span className="flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-green" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /></svg>
              {contact.reply}
            </span>
          )}
        </p>
      )}

      {/* Map and message box side by side: same top, same bottom */}
      <div className="mt-8 grid items-stretch gap-8 lg:grid-cols-2">
        <div className="flex min-h-[420px] flex-col">
          {/* Searching the business name with the address drops the pin on the Barods Global listing itself */}
          <iframe
            title="Barods Global office on Google Maps"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(`Barods Global Limited, ${contact.address}`)}&z=16&output=embed`}
            className="min-h-[320px] w-full flex-1 rounded-xl border border-line"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <a href={MAPS_LISTING_URL} target="_blank" rel="noopener noreferrer" className="btn-green">Get directions</a>
            <a href={MAPS_LISTING_URL} target="_blank" rel="noopener noreferrer" className="btn-outline">Open in Google Maps</a>
          </div>
        </div>
        <div className="rounded-xl border border-line p-6">
          <h2 className="mb-4 font-semibold">{report ? `Report listing ${report}` : 'Send us a message'}</h2>
          <EnquiryForm source="contact" defaultMessage={report ? `I'd like to report listing ${report}: ` : ''} />
        </div>
      </div>
    </div>
    <MarketEvaluation />
    </>
  );
}
