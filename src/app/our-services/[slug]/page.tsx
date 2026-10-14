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
    <div className="container-site flex flex-wrap gap-10 py-14">
      <div className="min-w-0 flex-[999_1_560px]">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-orange">Our Services</p>
        <h1 className="mt-2 font-display text-4xl">{s.name}</h1>
        <img src={s.image} alt="" className="my-6 w-full rounded-xl object-cover" />
        <p className="text-[17px] leading-relaxed">{s.summary}</p>
      </div>
      <aside className="flex-[1_1_300px] lg:max-w-sm">
        <div className="rounded-xl border border-line p-5">
          <h2 className="mb-4 font-semibold">Enquire about {s.name.toLowerCase()}</h2>
          <EnquiryForm source="service" defaultMessage={`I'd like to discuss ${s.name.toLowerCase()}.`} />
        </div>
      </aside>
    </div>
  );
}
