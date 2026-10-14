import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-site py-24 text-center">
      <p className="font-display text-6xl text-brand-green">404</p>
      <h1 className="mt-2 text-2xl font-semibold">We couldn’t find that page</h1>
      <p className="mt-2 text-muted">It may have moved when we updated our website.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/properties" className="btn-green">Browse properties</Link>
        <Link href="/" className="btn-outline">Go home</Link>
      </div>
    </div>
  );
}
