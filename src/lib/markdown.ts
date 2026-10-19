import { Marked } from 'marked';

// Markdown → HTML. Raw HTML in posts is dropped, so a post can never inject scripts.
const md = new Marked({ gfm: true, breaks: false });
md.use({ renderer: { html: () => '' } });

export function renderMarkdown(src: string) {
  return md.parse(src ?? '', { async: false }) as string;
}
