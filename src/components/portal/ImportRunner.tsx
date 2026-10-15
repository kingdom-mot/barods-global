'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Progress = { total: number; done: number; errors: number; pending: number; missing?: number };

async function call(step: string, extra: Record<string, unknown> = {}) {
  const res = await fetch('/api/admin/wordpress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step, ...extra }) });
  const body = await res.json().catch(() => ({
    error: res.status === 504 ? 'That step took too long (Vercel time limit). Click the button again; finished parts are kept.' : `Server error ${res.status}`,
  }));
  if (!res.ok || body.error) throw new Error(body.error ?? `Server error ${res.status}`);
  return body;
}

export default function ImportRunner({ initial }: { initial: Progress | null }) {
  const router = useRouter();
  const [log, setLog] = useState<string[]>([]);
  const [progress, setProgress] = useState<Progress | null>(initial);
  const [running, setRunning] = useState<'' | 'all' | 'media'>('');
  const [stage, setStage] = useState('');
  const add = (line: string) => setLog((l) => [...l, line]);

  async function copyImages() {
    let p: Progress | null = progress;
    // Small batches so each request finishes well inside Vercel's time limit.
    for (let i = 0; i < 400; i++) {
      let r;
      try {
        r = await call('media');
      } catch (e) {
        add(`Retrying images (${e instanceof Error ? e.message : e})…`);
        r = await call('media');
      }
      p = { total: r.total, done: r.done, errors: r.errors, pending: r.pending, missing: r.missing };
      setProgress(p);
      r.results
        .filter((x: { ok: boolean }) => !x.ok)
        .forEach((x: { path: string; error: string }) => add(x.error === 'missing on WordPress' ? `– ${x.path.split('/').pop()}: no longer on WordPress, removed from its listing` : `✗ ${x.path}: ${x.error}`));
      if (!r.pending || r.results.length === 0) break;
    }
    return p;
  }

  async function runAll() {
    setRunning('all');
    setLog([]);
    try {
      add('Reading agents and the list of listings from WordPress…');
      const start = await call('start');
      start.log.forEach(add);
      const ids: number[] = start.ids ?? [];
      // Two listings per request keeps each step short.
      for (let i = 0; i < ids.length; i += 2) {
        setStage(`Listings ${Math.min(i + 2, ids.length)} of ${ids.length}`);
        let tries = 0;
        for (;;) {
          try {
            const r = await call('listings', { ids: ids.slice(i, i + 2) });
            r.log.forEach(add);
            break;
          } catch (e) {
            if (++tries >= 3) throw e;
            add(`Retrying (${e instanceof Error ? e.message : e})…`);
          }
        }
      }
      setStage('');
      add('Copying photos into Supabase…');
      const p = await copyImages();
      add(`Done. ${p?.done ?? 0} of ${p?.total ?? 0} images copied${p?.missing ? `, ${p.missing} no longer on WordPress` : ''}${p?.errors ? `, ${p.errors} failed (use “Retry failed images”)` : ''}.`);
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

  const pct = progress?.total ? Math.round(((progress.done + (progress.missing ?? 0)) / progress.total) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-line bg-white p-5">
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="font-semibold">Images copied to Supabase</span>
          <span className="text-muted">{progress ? `${progress.done} of ${progress.total}${progress.missing ? ` · ${progress.missing} not on WordPress` : ''}${progress.errors ? ` · ${progress.errors} failed` : ''}` : 'Not started'}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-paper" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-brand-green transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {stage && <p className="text-sm font-semibold text-brand-greenDark" aria-live="polite">{stage}…</p>}

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
