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

**Quickest:** open `supabase/setup.sql`, copy its entire contents, paste into Supabase → SQL Editor → New query, and click Run. It contains everything below plus row-level security on every table, and is safe to run more than once.

The same SQL is also split into `supabase/migrations/` (for `supabase db push`):

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

## Agent portal (sign-in) setup

1. Run `supabase/migrations/0004_agent_portal.sql` in the Supabase SQL Editor (also included in `setup.sql`).
2. **Authentication → Sign In / Providers → Email**: turn off **Allow new users to sign up**. Accounts are invite-only.
3. **Authentication → URL Configuration**: set **Site URL** to the live site (e.g. `https://barods-global-sable.vercel.app`, later `https://barodsglobal.com`)
   and add `https://barods-global-sable.vercel.app/**` and `http://localhost:3000/**` to **Redirect URLs**.
4. Email templates can stay as Supabase's defaults: the site picks up the invite/reset link wherever it lands
   and sends the person to choose a password. (Optional, once custom SMTP is set up: point the Invite template at
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/portal/set-password`.)
5. **Authentication → Users → Invite user**: invite each person by their `@barodsglobal.com` address.
   - `tunde@barodsglobal.com` becomes the owner (super admin, can't be removed).
   - Anyone whose email matches an existing agent card is linked to it; everyone else gets a new card, hidden until they add a photo and phone number.
   - Other domains are rejected by the database.
6. Supabase's built-in email sends only a few messages an hour; add custom SMTP (Authentication → Emails) before inviting the whole team.

Portal: `/portal` · dashboard, add/edit listings (6-step form), my listings (mark Sold/Let without review), leads, profile.
Admins also get **Approvals** (approve or send back with a note) and see every listing and lead.

## Moving off WordPress

1. Run `supabase/migrations/0005_wordpress_import.sql` in the Supabase SQL Editor.
2. In Vercel → Settings → Environment Variables add `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API Keys → service_role / secret).
   Server-only: never prefix it with NEXT_PUBLIC. Redeploy.
3. Sign in as an admin → **Import from WordPress** → **Import everything from WordPress**. Keep the page open until the bar is full.
   It reads barodsglobal.com's public WordPress API: listings (all photos, price, type, location, agent, features, labels),
   agents, and the images used on the site, then copies every image into the `wp-media` storage bucket.
   Re-running updates instead of duplicating; run it once more just before the domain moves.
4. Old addresses keep working: `/property/…` and `/agent/…` are unchanged, everything else is mapped in `next.config.mjs`.
   Old image links (`/wp-content/uploads/…`) are served from Supabase once copied (falling back to WordPress until then).
5. Then point barodsglobal.com at Vercel and submit `https://barodsglobal.com/sitemap.xml` in Google Search Console.
