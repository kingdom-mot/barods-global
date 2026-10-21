/**
 * On a browser refresh, start over: the website goes back to the homepage and the portal back to the dashboard,
 * always at the top of the page. Runs as a tiny inline script before the page draws, so there's no flash.
 *
 * Only a refresh does this. Opening a shared link, a Google result or a bookmark still lands on that page,
 * and search engines never refresh, so every page stays indexable.
 */
const script = `(function(){try{
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  var reload = nav ? nav.type === 'reload' : (performance.navigation && performance.navigation.type === 1);
  if (!reload) return;
  var p = location.pathname;
  if (location.hash.indexOf('access_token') > -1) return;
  if (/^\\/(login|auth|api)(\\/|$)/.test(p) || p === '/portal/set-password') return;
  var home = p.indexOf('/portal') === 0 ? '/portal' : '/';
  if (p !== home || location.search) { location.replace(home); return; }
  window.scrollTo(0, 0);
}catch(e){}})();`;

export default function ReloadReset() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
