import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EnquiryForm from '@/components/EnquiryForm';
import { services } from '@/lib/content';

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const s = services.find((x) => x.slug === params.slug);
  return s ? { title: s.name, description: s.summary } : {};
}

export default function ServicePage({ params }: Props) {
  const s = services.find((x) => x.slug === params.slug);
  if (!s) notFound();
  return (
    <div className="container-site py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-orange">Our Services</p>
      <h1 className="mt-2 font-display text-4xl">{s.name}</h1>
      {/* Image and form share one row, so their top edges line up */}
      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
        <div className="min-w-0">
          <img src={s.image} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />
          <p className="mt-6 text-[17px] leading-relaxed">{s.summary}</p>
        </div>
        <aside className="rounded-xl border border-line p-5 lg:sticky lg:top-24">
          <h2 className="mb-4 font-semibold">Enquire about {s.name.toLowerCase()}</h2>
          <EnquiryForm source="service" defaultMessage={`I'd like to discuss ${s.name.toLowerCase()}.`} />
        </aside>
      </div>
    </div>
  );
}
