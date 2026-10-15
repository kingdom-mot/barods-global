import type { Metadata } from 'next';
import Link from 'next/link';
import { services, team } from '@/lib/content';

export const metadata: Metadata = { title: 'About Us' };

export default function AboutPage() {
  return (
    <>
      <section className="bg-brand-ink py-16 text-white">
        <div className="container-site">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-green">About Us</p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">Who We Are</h1>
        </div>
      </section>
      <section className="container-site grid gap-10 py-14 lg:grid-cols-2">
        <div className="space-y-4 text-[17px] leading-relaxed">
          <p>
            <strong>Barods Global Limited</strong> was founded with a singular vision: to provide expert guidance and support to
            individuals and businesses across Nigeria. Our journey began with a small team of dedicated professionals who
            shared a passion for excellence in service delivery.
          </p>
          <p>
            The values that guide our business include integrity, professionalism, innovation and exceptional customer
            service. We build lasting relationships with our clients based on trust and mutual respect.
          </p>
          <p>
            Today we stand as a trusted partner to individuals and organisations, helping them buy, sell, build and manage
            property with confidence.
          </p>
        </div>
        <img src="https://barodsglobal.com/wp-content/uploads/2025/07/Barods-image.jpeg" alt="Barods Global project" className="w-full rounded-xl object-cover" />
      </section>

      <section className="bg-paper py-14">
        <div className="container-site">
          <h2 className="section-title mb-8 text-center">Meet Our Team</h2>
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {team.map((m) => (
              <div key={m.email} className="flex flex-col overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-md">
                <img src={m.photoUrl} alt={m.name} className="aspect-[4/5] w-full object-cover object-top" loading="lazy" />
                <div className="flex-1 p-3.5 text-center">
                  <div className="text-[15px] font-semibold leading-snug">{m.name}</div>
                  <div className="mt-0.5 text-[13px] text-muted">{m.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-site py-14">
        <h2 className="section-title mb-8 text-center">Our Services</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {services.map((s) => (
            <Link key={s.slug} href={`/our-services/${s.slug}`} className="group overflow-hidden rounded-xl border border-line">
              <img src={s.image} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
              <div className="p-5 font-semibold group-hover:text-brand-greenDark">{s.name} →</div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
