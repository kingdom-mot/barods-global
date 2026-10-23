import type { Metadata } from 'next';
import EnquiryForm from '@/components/EnquiryForm';
import { getContact, MAPS_LISTING_URL } from '@/lib/settings';

export const metadata: Metadata = { title: 'Contact Us' };

export default async function ContactPage({ searchParams }: { searchParams: { report?: string } }) {
  const report = searchParams.report;
  const contact = await getContact();
  return (
    <div className="container-site grid gap-12 py-14 lg:grid-cols-2">
      <div>
        <h1 className="section-title">Contact Us</h1>
        <p className="section-sub">Talk to an expert about buying, renting, building or managing property.</p>
        <dl className="mt-8 space-y-5">
          <div><dt className="text-xs uppercase tracking-wide text-muted">Office</dt><dd className="font-semibold">{contact.address}</dd></div>
          <div><dt className="text-xs uppercase tracking-wide text-muted">Phone</dt><dd><a href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`} className="font-semibold hover:text-brand-greenDark">{contact.phone}</a></dd></div>
          <div><dt className="text-xs uppercase tracking-wide text-muted">Email</dt><dd><a href={`mailto:${contact.email}`} className="font-semibold hover:text-brand-greenDark">{contact.email}</a></dd></div>
        </dl>
        {/* Searching the business name with the address drops the pin on the Barods Global listing itself */}
        <iframe
          title="Barods Global office on Google Maps"
          src={`https://maps.google.com/maps?q=${encodeURIComponent(`Barods Global Limited, ${contact.address}`)}&z=16&output=embed`}
          className="mt-8 h-80 w-full rounded-xl border border-line"
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
  );
}
