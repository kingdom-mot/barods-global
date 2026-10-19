'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { deletePost, savePost } from '@/app/portal/blog-actions';
import { renderMarkdown } from '@/lib/markdown';
import { createClient } from '@/lib/supabase/browser';

export type EditablePost = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverUrl: string | null;
  category: string;
  author: string;
  featured: boolean;
  status?: string;
  publishedAt?: string | null;
};

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);

async function upload(userId: string, file: File) {
  const supabase = createClient();
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/blog-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('listing-photos').upload(path, file, { contentType: file.type, cacheControl: '31536000' });
  if (error) throw error;
  return supabase.storage.from('listing-photos').getPublicUrl(path).data.publicUrl;
}

export default function BlogEditor({ userId, categories, initial }: { userId: string; categories: string[]; initial: EditablePost }) {
  const router = useRouter();
  const [p, setP] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [publishMode, setPublishMode] = useState<'publish' | 'schedule'>(initial.status === 'scheduled' ? 'schedule' : 'publish');
  const [scheduleAt, setScheduleAt] = useState(
    initial.status === 'scheduled' && initial.publishedAt ? new Date(initial.publishedAt).toISOString().slice(0, 16) : '',
  );
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const set = <K extends keyof EditablePost>(k: K, v: EditablePost[K]) => setP((x) => ({ ...x, [k]: v }));

  /** Wrap the selection (or insert at the cursor) with Markdown. */
  function format(before: string, after = '', placeholder = 'text') {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const chosen = value.slice(s, e) || placeholder;
    const next = value.slice(0, s) + before + chosen + after + value.slice(e);
    set('body', next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + chosen.length);
    });
  }
  function linePrefix(prefix: string) {
    const el = bodyRef.current;
    if (!el) return;
    const s = el.selectionStart;
    const lineStart = el.value.lastIndexOf('\n', s - 1) + 1;
    set('body', el.value.slice(0, lineStart) + prefix + el.value.slice(lineStart));
    requestAnimationFrame(() => el.focus());
  }

  async function onCover(file?: File) {
    if (!file) return;
    setBusy('Uploading cover…');
    try {
      set('coverUrl', await upload(userId, file));
    } catch {
      setMsg({ ok: false, text: 'Couldn’t upload that image. Use a JPG or PNG under 10MB.' });
    }
    setBusy('');
  }
  async function onInlineImage(file?: File) {
    if (!file) return;
    setBusy('Uploading image…');
    try {
      const url = await upload(userId, file);
      format('![', `](${url})`, 'Describe the image');
    } catch {
      setMsg({ ok: false, text: 'Couldn’t upload that image.' });
    }
    setBusy('');
  }

  function save(intent: 'draft' | 'publish' | 'schedule') {
    setMsg(null);
    start(async () => {
      const r = await savePost({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        body: p.body,
        coverUrl: p.coverUrl,
        category: p.category,
        author: p.author,
        featured: p.featured,
        intent,
        scheduleAt: intent === 'schedule' && scheduleAt ? new Date(scheduleAt).toISOString() : null,
      });
      if (!r.ok) return setMsg({ ok: false, text: r.error });
      setMsg({ ok: true, text: intent === 'draft' ? 'Draft saved.' : intent === 'schedule' ? 'Scheduled. It goes live automatically.' : 'Published on the blog.' });
      if (!p.id) router.replace(`/portal/blog/${r.id}`);
      else router.refresh();
      setP((x) => ({ ...x, id: r.id, slug: r.slug }));
    });
  }

  const tool = 'h-9 min-w-[36px] rounded-md px-2 text-sm font-semibold text-brand-ink hover:bg-paper';
  const words = p.body.split(/\s+/).filter(Boolean).length;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <input
          className="w-full rounded-xl border border-line bg-white px-4 py-3 font-display text-3xl font-bold outline-none focus:border-brand-green"
          placeholder="Post title"
          value={p.title}
          onChange={(e) => {
            set('title', e.target.value);
            if (!slugTouched) set('slug', slugify(e.target.value));
          }}
          aria-label="Title"
        />
        <label className="label">
          Short summary (shown on the blog page and Google)
          <textarea className="field" rows={2} maxLength={400} value={p.excerpt} onChange={(e) => set('excerpt', e.target.value)} placeholder="One or two sentences that make people want to read on." />
        </label>

        <div className="overflow-hidden rounded-xl border border-line bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-white px-2 py-1.5">
            <div className="flex flex-wrap items-center gap-0.5" role="toolbar" aria-label="Formatting">
              <button type="button" className={tool} onClick={() => linePrefix('## ')} title="Heading">H2</button>
              <button type="button" className={tool} onClick={() => linePrefix('### ')} title="Sub-heading">H3</button>
              <button type="button" className={tool} onClick={() => format('**', '**')} title="Bold"><b>B</b></button>
              <button type="button" className={tool} onClick={() => format('*', '*')} title="Italic"><i>I</i></button>
              <button type="button" className={tool} onClick={() => linePrefix('- ')} title="Bullet list">• List</button>
              <button type="button" className={tool} onClick={() => linePrefix('1. ')} title="Numbered list">1. List</button>
              <button type="button" className={tool} onClick={() => linePrefix('> ')} title="Quote">❝</button>
              <button type="button" className={tool} onClick={() => format('[', '](https://)', 'link text')} title="Link">Link</button>
              <label className={`${tool} flex cursor-pointer items-center`} title="Insert image">
                Image
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onInlineImage(e.target.files?.[0])} />
              </label>
            </div>
            <div className="flex rounded-lg bg-paper p-0.5 text-sm" role="tablist">
              {(['write', 'preview'] as const).map((t) => (
                <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-md px-3 py-1.5 font-semibold capitalize ${tab === t ? 'bg-white shadow-sm' : 'text-muted'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          {tab === 'write' ? (
            <textarea
              ref={bodyRef}
              className="block min-h-[480px] w-full resize-y p-4 font-mono text-[15px] leading-relaxed outline-none"
              value={p.body}
              onChange={(e) => set('body', e.target.value)}
              placeholder={'Write your article here.\n\n## A heading\nNormal paragraphs are just text. Use the buttons above for bold, lists, links and images.'}
              aria-label="Article"
            />
          ) : (
            <div className="article min-h-[480px] p-6" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body || '*Nothing written yet.*') }} />
          )}
          <div className="border-t border-line px-4 py-2 text-xs text-muted">{words} words · about {Math.max(1, Math.round(words / 200))} min read</div>
        </div>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-6">
        <div className="space-y-3 rounded-xl border border-line bg-white p-5">
          <h2 className="font-semibold">Publish</h2>
          {p.status && (
            <p className="text-sm text-muted">
              Status: <strong className="text-brand-ink">{p.status === 'published' ? 'Live' : p.status === 'scheduled' ? 'Scheduled' : 'Draft'}</strong>
            </p>
          )}
          <div className="flex rounded-lg bg-paper p-0.5 text-sm">
            {(['publish', 'schedule'] as const).map((m) => (
              <button key={m} type="button" onClick={() => setPublishMode(m)} className={`flex-1 rounded-md px-3 py-1.5 font-semibold ${publishMode === m ? 'bg-white shadow-sm' : 'text-muted'}`}>
                {m === 'publish' ? 'Publish now' : 'Schedule'}
              </button>
            ))}
          </div>
          {publishMode === 'schedule' && (
            <label className="label">Go live on<input type="datetime-local" className="field" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} /></label>
          )}
          <button type="button" className="btn-green w-full" disabled={pending || !!busy} onClick={() => save(publishMode)}>
            {pending ? 'Saving…' : publishMode === 'schedule' ? 'Schedule post' : p.status === 'published' ? 'Update live post' : 'Publish now'}
          </button>
          <button type="button" className="btn w-full border border-line bg-white hover:border-brand-ink" disabled={pending || !!busy} onClick={() => save('draft')}>
            {p.status === 'published' ? 'Unpublish (back to draft)' : 'Save draft'}
          </button>
          {p.status === 'published' && p.slug && (
            <a href={`/blog/${p.slug}`} target="_blank" className="block text-center text-sm font-semibold text-brand-greenDark hover:underline">View live post →</a>
          )}
          {msg && <p className={`rounded-md px-3 py-2 text-sm ${msg.ok ? 'bg-brand-greenLight text-brand-greenDark' : 'bg-red-50 text-red-800'}`} role="status">{msg.text}</p>}
          {busy && <p className="text-sm text-muted">{busy}</p>}
        </div>

        <div className="space-y-4 rounded-xl border border-line bg-white p-5">
          <div>
            <div className="label mb-2">Cover image</div>
            {p.coverUrl ? (
              <div className="space-y-2">
                <img src={p.coverUrl} alt="" className="aspect-[16/10] w-full rounded-lg object-cover" />
                <div className="flex gap-3 text-xs font-semibold">
                  <label className="cursor-pointer text-brand-greenDark">Change<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onCover(e.target.files?.[0])} /></label>
                  <button type="button" className="text-red-700" onClick={() => set('coverUrl', null)}>Remove</button>
                </div>
              </div>
            ) : (
              <label className="flex aspect-[16/10] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-brand-green/50 bg-brand-greenLight/40 text-sm font-semibold text-brand-greenDark hover:bg-brand-greenLight">
                + Add cover image
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onCover(e.target.files?.[0])} />
              </label>
            )}
          </div>
          <label className="label">
            Category
            <select className="field" value={p.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">No category</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="label">Author<input className="field" value={p.author} onChange={(e) => set('author', e.target.value)} /></label>
          <label className="label">
            Web address
            <span className="flex items-center rounded-md border border-line bg-paper text-sm normal-case tracking-normal">
              <span className="pl-3 text-muted">/blog/</span>
              <input
                className="min-w-0 flex-1 bg-transparent px-1 py-2.5 outline-none"
                value={p.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set('slug', slugify(e.target.value));
                }}
              />
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-brand-green" checked={p.featured} onChange={(e) => set('featured', e.target.checked)} />
            Feature at the top of the blog page
          </label>
        </div>

        {p.id && (
          <button
            type="button"
            className="w-full rounded-md px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
            onClick={() => {
              if (!confirm('Delete this post? This can’t be undone.')) return;
              start(async () => {
                await deletePost(p.id!);
                router.push('/portal/blog');
                router.refresh();
              });
            }}
          >
            Delete post
          </button>
        )}
      </aside>
    </div>
  );
}
