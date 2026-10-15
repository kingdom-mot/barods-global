/** @type {import('next').NextConfig} */

// Old WordPress blog posts were the theme's demo articles; they go to the homepage.
const OLD_POSTS = [
  'blog', 'insights', 'real-estate-industry-and-competitors', 'understand-the-real-estate-market',
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
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'barodsglobal.com' },
      { protocol: 'https', hostname: 'www.barodsglobal.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
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

      // Pages
      r('/privacy-policy', '/privacy'),
      r('/forget-password', '/login/forgot'),
      ...OLD_ACCOUNT_PAGES.map((p) => r(`/${p}`, '/login')),
      r('/wp-admin/:path*', '/login'),
      r('/wp-login.php', '/login'),
      ...OLD_POSTS.map((p) => r(`/${p}`, '/')),
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
