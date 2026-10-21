import { SITE } from './email';

/**
 * IndexNow: tells Bing, Yandex, Seznam, Naver (and the engines that use Bing, such as Yahoo and DuckDuckGo)
 * the moment a page is published or changed. Google picks changes up from the sitemap instead.
 * The key is public by design; it's served at /df5ff3197d7a7dcc4dfd7bc16d76d2dc.txt to prove we own the site.
 */
const KEY = 'df5ff3197d7a7dcc4dfd7bc16d76d2dc';

export async function pingIndexNow(paths: string[]) {
  // Only from the real domain: pinging for the temporary address would be rejected.
  if (!SITE.includes('barodsglobal.com') || !paths.length) return;
  try {
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: 'barodsglobal.com', key: KEY, keyLocation: `https://barodsglobal.com/${KEY}.txt`, urlList: paths.map((p) => `https://barodsglobal.com${p}`) }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // Best effort: the sitemap still covers it.
  }
}
