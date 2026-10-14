/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'barodsglobal.com' },
      { protocol: 'https', hostname: 'www.barodsglobal.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  // Keep old WordPress URLs working (more redirects are managed in /admin/seo).
  async redirects() {
    return [
      { source: '/create-listing', destination: '/login', permanent: true },
      { source: '/status/for-sale', destination: '/properties?purpose=sale', permanent: true },
      { source: '/status/for-rent', destination: '/properties?purpose=rent', permanent: true },
      { source: '/city/:city', destination: '/properties?city=:city', permanent: true },
      { source: '/state/ogun-state', destination: '/properties?state=ogun', permanent: true },
    ];
  },
};

export default nextConfig;
