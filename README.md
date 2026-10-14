# Barods Global — barodsglobal.com

Next.js 14 (App Router) + Tailwind + Supabase rebuild of barodsglobal.com, replacing WordPress / Houzez / Elementor.
Hosted on Vercel. Built by Dream Savvy Solutions.

## Run locally

```bash
npm install
cp .env.example .env.local   # add NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev                  # http://localhost:3000
```

Without the Supabase key the site runs on the built-in copy of current Barods content (`src/lib/content.ts`),
and enquiry forms are accepted but not stored.

## Database

Run the SQL in `supabase/migrations/` in order (Supabase → SQL editor, or `supabase db push`):

1. `0001_schema.sql` — locations (country › state › city › area), agents, properties, leads, content, row-level security,
   owner-account protection.
2. `0002_seed.sql` — 36 states + FCT, 9 South African provinces, property types, amenities, team, agents and the
   live listings.

Both files are tested on PostgreSQL 16.

## What's built (main site)

| Page | Route |
| --- | --- |
| Home (hero search, featured with agent photos, cities, team, partners, reviews, CTA) | `/` |
| Properties + search filters (shareable URLs, Sold / Let filter, sorting) | `/properties` |
| Property detail (gallery, facts, rent fees, amenities, agent card, WhatsApp, enquiry → lead) | `/property/[slug]` |
| Agents and agent profile | `/agents`, `/agent/[slug]` |
| About, Services, service pages, Contact | `/about-us`, `/our-services`, `/our-services/[slug]`, `/contact-us` |
| Agent / staff sign-in (UI only) | `/login` |

Visitor currency comes from Vercel's country header (`src/middleware.ts`), ₦ by default, with a header switcher.

## Next phase

Supabase Auth sign-in, agent portal (create listing form), admin portal (approvals, agents, leads, content, settings),
email + WhatsApp lead alerts, Google reviews feed, Mapbox maps, content migration from WordPress, 301 redirects.

## Brand

Colours from the official logo: green `#56B91E` (text-safe `#3D7F16`), charcoal `#231F20`, orange `#DD6236`.
Logos in `public/brand/`.
