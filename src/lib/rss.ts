/** Small helpers for the RSS feeds (/feed and /properties/feed). */
export const SITE_URL = 'https://barodsglobal.com';

export const xml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/** Site paths and storage links → full https addresses (feed readers need absolute links). */
export const absolute = (u: string) => (/^https?:\/\//.test(u) ? u : `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`);

export type FeedItem = { title: string; link: string; description: string; date: string; image?: string | null; category?: string | null; author?: string | null };

export function rss({ title, link, self, description, items }: { title: string; link: string; self: string; description: string; items: FeedItem[] }) {
  const body = items
    .map((i) => {
      const img = i.image ? absolute(i.image) : null;
      const html = `${img ? `<p><img src="${xml(img)}" alt="${xml(i.title)}"/></p>` : ''}<p>${xml(i.description)}</p>`;
      return `    <item>
      <title>${xml(i.title)}</title>
      <link>${xml(i.link)}</link>
      <guid isPermaLink="true">${xml(i.link)}</guid>
      <pubDate>${new Date(i.date).toUTCString()}</pubDate>
      ${i.author ? `<dc:creator>${xml(i.author)}</dc:creator>` : ''}
      ${i.category ? `<category>${xml(i.category)}</category>` : ''}
      <description><![CDATA[${html.replace(/]]>/g, ']]]]><![CDATA[>')}]]></description>
      ${img ? `<media:content url="${xml(img)}" medium="image"/>` : ''}
    </item>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${xml(title)}</title>
    <link>${xml(link)}</link>
    <atom:link href="${xml(self)}" rel="self" type="application/rss+xml"/>
    <description>${xml(description)}</description>
    <language>en-ng</language>
    <lastBuildDate>${new Date(items[0]?.date ?? Date.now()).toUTCString()}</lastBuildDate>
    <image><url>${SITE_URL}/brand/logo.png</url><title>${xml(title)}</title><link>${xml(link)}</link></image>
${body}
  </channel>
</rss>`;
}

export const feedResponse = (body: string) =>
  new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=900, s-maxage=1800' } });
