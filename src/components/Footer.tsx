import Link from 'next/link';
import { contact } from '@/lib/content';

export default function Footer() {
  return (
    <footer className="bg-brand-ink text-white/80">
      <div className="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-4">
          <img src="/brand/logo-white.png" alt="Barods Global Limited" className="h-12 w-auto self-start" />
          <p className="text-sm">{contact.tagline}</p>
        </div>
        <div>
          <h3 className="mb-4 font-semibold text-white">Explore</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/properties?purpose=sale" className="hover:text-brand-green">Properties for sale</Link></li>
            <li><Link href="/properties?purpose=rent" className="hover:text-brand-green">Properties for rent</Link></li>
            <li><Link href="/properties?purpose=shortlet" className="hover:text-brand-green">Shortlets</Link></li>
            <li><Link href="/agents" className="hover:text-brand-green">Our agents</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-semibold text-white">Company</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about-us" className="hover:text-brand-green">About Us</Link></li>
            <li><Link href="/our-services" className="hover:text-brand-green">Our Services</Link></li>
            <li><Link href="/contact-us" className="hover:text-brand-green">Contact Us</Link></li>
            <li><Link href="/login" className="hover:text-brand-green">Agent Login</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-semibold text-white">Contact us</h3>
          <ul className="space-y-2 text-sm">
            <li>{contact.address}</li>
            <li><a href={contact.phoneHref} className="hover:text-brand-green">{contact.phone}</a></li>
            <li><a href={`mailto:${contact.email}`} className="hover:text-brand-green">{contact.email}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-site flex flex-wrap justify-between gap-2 py-5 text-xs text-white/60">
          <span>© {new Date().getFullYear()} Barods Global Limited · RC 1728787 · All rights reserved</span>
          <span>
            <Link href="/terms" className="hover:text-white">Terms</Link> ·{' '}
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
