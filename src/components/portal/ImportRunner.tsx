'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Progress = { total: number; done: number; errors: number; pending: number };

async function call(step: string) {
  const res = await fetch('/api/admin/wordpress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step }) });
  const body = await res.json().catch(() => ({ error: `Server error ${res.status}` }));
  if (!res.ok || body.error) throw new Error(body.error ?? `Server error ${res.status}`);
  return body;
}

export default function ImportRunner({ initial }: { initial: Progress | null }) {
  const router = useRouter();
  const [log, setLog] = useState<string[]>([]);
  const [progress, setProgress] = useState<Progress | null>(initial);
  const [running, setRunning] = useState<'' | 'all' | 'media'>('');
  const add = (line: string) => setLog((l) => [...l, line]);

  async function copyImages() {
    let p: Progress | null = progress;
    // Small batches so each request finishes well inside Vercel's time limit.
    for (let i = 0; i < 400; i++) {
      const r = await call('media');
      p = { total: r.total, done: r.done, errors: r.errors, pending: r.pending };
      setProgress(p);
      r.results.filter((x: { ok: boolean }) => !x.ok).forEach((x: { path: string; error: string }) => add(`✗ ${x.path}: ${x.error}`));
      if (!r.pending || r.results.length === 0) break;
    }
    return p;
  }

  async function runAll() {
    setRunning('all');
    setLog([]);
    try {
      add('Reading listings, agents and photos from WordPress…');
      const r = await call('data');
      r.log.forEach(add);
      add('Copying photos into Supabase…');
      const p = await copyImages();
      add(`Done. ${p?.done ?? 0} of ${p?.total ?? 0} images copied${p?.errors ? `, ${p.errors} failed (use “Retry failed images”)` : ''}.`);
      router.refresh();
    } catch (e) {
      add(`Stopped: ${e instanceof Error ? e.message : String(e)}`);
    }
    setRunning('');
  }

  async function retry() {
    setRunning('media');
    try {
      setProgress(await call('retry'));
      const p = await copyImages();
      add(`Retry finished: ${p?.done ?? 0} of ${p?.total ?? 0} images copied.`);
    } catch (e) {
      add(`Stopped: ${e instanceof Error ? e.message : String(e)}`);
    }
    setRunning('');
  }

  const pct = progress?.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-line bg-white p-5">
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="font-semibold">Images copied to Supabase</span>
          <span className="text-muted">{progress ? `${progress.done} of ${progress.total}${progress.errors ? ` · ${progress.errors} failed` : ''}` : 'Not started'}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-paper" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-brand-green transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-green px-6" disabled={!!running} onClick={runAll}>
          {running === 'all' ? 'Importing… keep this page open' : progress?.total ? 'Run the import again' : 'Import everything from WordPress'}
        </button>
        {!!progress?.errors && (
          <button type="button" className="btn-outline" disabled={!!running} onClick={retry}>
            {running === 'media' ? 'Retrying…' : 'Retry failed images'}
          </button>
        )}
      </div>

      {log.length > 0 && (
        <ol className="max-h-96 space-y-1 overflow-y-auto rounded-xl bg-brand-ink p-4 font-mono text-xs text-white/85" aria-live="polite">
          {log.map((l, i) => <li key={i}>{l}</li>)}
        </ol>
      )}
    </div>
  );
}
