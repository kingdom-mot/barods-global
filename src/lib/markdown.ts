import { Marked } from 'marked';

// Markdown → HTML. Raw HTML in posts is dropped, so a post can never inject scripts.
const md = new Marked({ gfm: true, breaks: false });
md.use({ renderer: { html: () => '' } });

/** Leftover WordPress/SEO fields such as "title: …" or "meta-description: …" are never shown as text. */
function stripFields(src: string) {
  return (src ?? '')
    .replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '')
    .replace(/^\s*(title|meta[-_ ]?[a-z]*|description|seo[-_ ]?[a-z]*|slug|keywords|excerpt)\s*:.*$/gim, '')
    .trim();
}

export function renderMarkdown(src: string) {
  return md.parse(stripFields(src), { async: false }) as string;
}
