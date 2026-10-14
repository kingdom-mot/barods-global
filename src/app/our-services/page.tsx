import type { Metadata } from 'next';
import Link from 'next/link';
import { services } from '@/lib/content';

export const metadata: Metadata = { title: 'Our Services' };

export default function ServicesPage() {
  return (
    <div className="container-site py-14">
      <div className="mb-12 text-center">
        <h1 className="section-title">Our Services</h1>
        <p className="section-sub">Comprehensive real estate and construction solutions, tailored for you.</p>
      </div>
      <div className="space-y-12">
        {services.map((s, i) => (
          <article key={s.slug} className={`grid items-center gap-8 md:grid-cols-2 ${i % 2 ? 'md:[&>img]:order-2' : ''}`}>
            <img src={s.image} alt="" className="w-full rounded-xl object-cover" loading="lazy" />
            <div>
              <h2 className="font-display text-3xl">{s.name}</h2>
              <p className="mt-3 text-[17px] leading-relaxed text-brand-ink/90">{s.summary}</p>
              <Link href={`/our-services/${s.slug}`} className="btn-green mt-6">Learn more and enquire</Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
