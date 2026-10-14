import type { Metadata } from 'next';
import EnquiryForm from '@/components/EnquiryForm';
import { contact } from '@/lib/content';

export const metadata: Metadata = { title: 'Contact Us' };

export default function ContactPage({ searchParams }: { searchParams: { report?: string } }) {
  const report = searchParams.report;
  return (
    <div className="container-site grid gap-12 py-14 lg:grid-cols-2">
      <div>
        <h1 className="section-title">Contact Us</h1>
        <p className="section-sub">Talk to an expert about buying, renting, building or managing property.</p>
        <dl className="mt-8 space-y-5">
          <div><dt className="text-xs uppercase tracking-wide text-muted">Office</dt><dd className="font-semibold">{contact.address}</dd></div>
          <div><dt className="text-xs uppercase tracking-wide text-muted">Phone</dt><dd><a href={contact.phoneHref} className="font-semibold hover:text-brand-greenDark">{contact.phone}</a></dd></div>
          <div><dt className="text-xs uppercase tracking-wide text-muted">Email</dt><dd><a href={`mailto:${contact.email}`} className="font-semibold hover:text-brand-greenDark">{contact.email}</a></dd></div>
        </dl>
        <iframe
          title="Barods Global office map"
          src="https://maps.google.com/maps?q=Providence%20Mall%2C%20Leme%20Abiola%20Way%2C%20Abeokuta&z=15&output=embed"
          className="mt-8 h-72 w-full rounded-xl border border-line"
          loading="lazy"
        />
      </div>
      <div className="rounded-xl border border-line p-6">
        <h2 className="mb-4 font-semibold">{report ? `Report listing ${report}` : 'Send us a message'}</h2>
        <EnquiryForm source="contact" defaultMessage={report ? `I'd like to report listing ${report}: ` : ''} />
      </div>
    </div>
  );
}
