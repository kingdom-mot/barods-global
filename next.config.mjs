/** @type {import('next').NextConfig} */

// Old WordPress blog posts were the theme's demo articles; they go to the new blog.
const OLD_POSTS = [
  'real-estate-industry-and-competitors', 'understand-the-real-estate-market',
  'the-ultimate-cheat-sheet-on-real-estate', 'the-history-of-real-estate', '15-best-blogs-to-follow-about-real-estate',
  '10-quick-tips-about-real-estate', 'why-we-love-real-estate', '10-things-your-competitors-can-teach-you-about-real-estate',
  '14-common-misconceptions-about-business-development', '10-quick-tips-about-business-development',
  'learn-the-truth-about-real-estate-industry', 'skills-that-you-can-learn-in-the-real-estate-market',
  '7-simple-ways-to-keep-your-kids-toys-from-taking-over-your-home', 'get-ready-to-grow-6-tips-for-planning-your-spring-garden',
  'whale-watch-from-any-of-this-homes-3-rooftop-decks', 'read-unveils-the-best-canadian-cities-for-biking',
  'exploring-some-of-the-cities-and-home-services', '12-walkable-cities-where-you-can-live-affordably',
  'new-apartment-nice-in-the-best-canadian-cities', 'housing-markets-that-changed-the-most-this-year',
  'diamond-manor-apartment-in-the-new-york-and-service', 'unveils-the-best-canadian-cities-for-biking-and-walk', 'home-2',
];

// Houzez account pages → the new sign-in / portal.
const OLD_ACCOUNT_PAGES = [
  'my-properties', 'create-listing', 'login-register', 'saved-search', 'favourite-properties',
  'profile', 'membership-plan', 'messages', 'dashboard',
];

const r = (source, destination) => ({ source, destination, permanent: true });

const nextConfig = {
  // Hostinger (and any Node server) runs the self-contained build; Vercel builds its own way.
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  // The site shows images with plain <img> tags and never uses next/image, so the built-in image optimiser
  // (/_next/image) is switched off entirely. It is where most 2026 Next.js security flaws were (SVG/AVIF
  // remote code execution, SSRF, disk-filling DoS), so turning it off removes that whole area.
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Browsers remember to use https for this site.
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
          // No other website may show these pages inside a frame (stops clickjacking).
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'" },
          // Browsers must not guess file types (stops disguised uploads being run as scripts).
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Other sites see only "barodsglobal.com" when a visitor clicks away, never the full page address.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Camera, microphone and payments are never needed; location only by the site itself ("Use my location").
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), payment=(), usb=(), geolocation=(self)' },
        ],
      },
    ];
  },
  // Keep every old WordPress address working, so Google links and shared links still land somewhere useful.
  async redirects() {
    return [
      // Listings and agents keep the same addresses (/property/…, /agent/…); only these change.
      r('/property', '/properties'),
      r('/agent', '/agents'),
      r('/agent/oluwatoyosi-akinbobola', '/agent/toyosi-akinbobola'),
      r('/agency', '/about-us'),
      r('/agency/:slug*', '/about-us'),

      // Search categories
      r('/status/for-sale', '/properties?purpose=sale'),
      r('/status/for-rent', '/properties?purpose=rent'),
      r('/status/shortlet', '/properties?purpose=shortlet'),
      r('/status/sold', '/properties?status=sold'),
      r('/status/:slug', '/properties'),
      r('/property-type/:slug', '/properties?type=:slug'),
      r('/area/450', '/properties?location=Ibara%20GRA'),
      r('/area/:slug', '/properties?location=:slug'),
      r('/city/:slug', '/properties?location=:slug'),
      r('/state/:slug', '/properties?location=:slug'),
      r('/country/:slug', '/properties'),
      r('/feature/:slug', '/properties'),
      r('/label/:slug', '/properties'),

      // Old shop / account pages from the WordPress theme
      r('/shop', '/properties'),
      r('/shop/:path*', '/properties'),
      r('/product/:path*', '/properties'),
      r('/product-category/:path*', '/properties'),
      r('/cart', '/properties'),
      r('/checkout', '/properties'),
      r('/my-account/:path*', '/login'),
      r('/wishlist', '/properties'),
      r('/compare', '/properties'),
      r('/compare-properties', '/properties'),
      r('/search-results', '/properties'),
      r('/advanced-search', '/properties'),
      r('/listings', '/properties'),
      r('/listing/:path*', '/properties'),
      r('/page/:n', '/'),
      r('/services', '/our-services'),
      r('/services/:path*', '/our-services'),
      r('/contact', '/contact-us'),
      r('/about', '/about-us'),
      r('/agents/:slug', '/agent/:slug'),

      // Pages
      r('/privacy-policy', '/privacy'),
      r('/forget-password', '/login/forgot'),
      ...OLD_ACCOUNT_PAGES.map((p) => r(`/${p}`, '/login')),
      r('/wp-admin/:path*', '/login'),
      r('/wp-login.php', '/login'),
      // Old demo posts and the old blog index now land on the new blog.
      r('/insights', '/blog'),
      ...OLD_POSTS.map((p) => r(`/${p}`, p === 'home-2' ? '/' : '/blog')),
      r('/category/:path*', '/'),
      r('/tag/:path*', '/'),
      r('/author/:path*', '/'),
      r('/feed', '/'),
      r('/comments/feed', '/'),
      r('/sitemap_index.xml', '/sitemap.xml'),
      r('/wp-sitemap.xml', '/sitemap.xml'),
      r('/:type(post|page|property|houzez_agent|houzez_agency|category|post_tag|property_type|property_status|property_feature|property_label|property_country|property_state|property_city|property_area|author|fts_builder)-sitemap.xml', '/sitemap.xml'),
    ];
  },
};

export default nextConfig;
