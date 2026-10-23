/**
 * Turns any YouTube link into a player the site can show, whatever form the agent pasted:
 * youtube.com/watch?v=…, youtu.be/…, youtube.com/shorts/…, /live/…, /embed/…, /v/…, m./music. subdomains,
 * links with ?si=, &t=1m30s, &list=… and so on. Shorts are vertical, so they get a portrait player.
 */
export type VideoEmbed = { src: string; vertical: boolean; id: string };

const ID = /^[A-Za-z0-9_-]{11}$/;

function seconds(t: string | null): number {
  if (!t) return 0;
  if (/^\d+$/.test(t)) return Number(t);
  const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0;
}

export function youTubeEmbed(raw: string | null | undefined): VideoEmbed | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw.trim().startsWith('http') ? raw.trim() : `https://${raw.trim()}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, '');
  let id = '';
  let vertical = false;

  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1] ?? '';
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const [first, second] = url.pathname.split('/').filter(Boolean);
    if (first === 'watch') id = url.searchParams.get('v') ?? '';
    else if (first === 'shorts') {
      id = second ?? '';
      vertical = true;
    } else if (['embed', 'live', 'v', 'e'].includes(first ?? '')) id = second ?? '';
    else id = url.searchParams.get('v') ?? '';
  } else {
    return null;
  }
  if (!ID.test(id)) return null;

  const params = new URLSearchParams({ rel: '0', modestbranding: '1', playsinline: '1' });
  const start = seconds(url.searchParams.get('t') ?? url.searchParams.get('start'));
  if (start) params.set('start', String(start));
  return { id, vertical, src: `https://www.youtube.com/embed/${id}?${params.toString()}` };
}
