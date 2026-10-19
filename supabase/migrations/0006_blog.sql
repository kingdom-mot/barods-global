-- 0006: Blog. Safe to run more than once.

alter table posts add column if not exists featured boolean not null default false;
alter table posts add column if not exists updated_at timestamptz not null default now();
alter table posts add column if not exists created_at timestamptz not null default now();
alter table posts add column if not exists seo_description text;

-- Scheduled posts go live on their own once their date passes.
drop policy if exists "public read published posts" on posts;
create policy "public read published posts" on posts for select
  using (status = 'published' or (status = 'scheduled' and published_at <= now()));

-- Starter articles (Barods can edit or remove them in the portal under Blog).
insert into posts (slug, title, excerpt, category, author, status, published_at, featured, cover_url, body) values
(
  'c-of-o-vs-governors-consent-what-every-buyer-should-know',
  'C of O vs Governor’s Consent: What Every Property Buyer Should Know',
  'Two documents, two different jobs. Here’s how to tell them apart and why it matters before you pay for land or a home in Nigeria.',
  'Buying',
  'Barods Global',
  'published',
  now() - interval '6 days',
  true,
  '/wp-content/uploads/2025/07/Barods-image.jpeg',
  $md$When you buy property in Nigeria, the title document decides how secure your investment is. Two names come up again and again: the **Certificate of Occupancy (C of O)** and **Governor’s Consent**. They are related, but they are not the same thing.

## What a C of O is

A Certificate of Occupancy is issued by the state government under the Land Use Act. It confirms that the holder has the right to occupy and use a piece of land for a set period, usually 99 years. When land is first allocated or regularised, the C of O is issued in the name of that first owner.

## What Governor’s Consent is

Under the same law, any later transfer of land that already has a C of O needs the Governor’s approval. When you buy from someone who holds a C of O, your purchase is perfected by obtaining **Governor’s Consent**, which records you as the new owner. Without it, the transfer is incomplete on paper, even if you have paid in full.

## Which one should you look for?

- **Buying directly from the government or a first allottee:** the C of O in the seller’s name, which you then transfer to yourself with Governor’s Consent.
- **Buying a resale property:** the seller’s C of O (or their own Governor’s Consent), a Deed of Assignment from them to you, and then Governor’s Consent in your name.

## Checks to do before you pay

1. Ask for the original title document, not just a photocopy.
2. Run a search at the state land registry to confirm who the registered owner is and that the land is free of disputes or government acquisition.
3. Make sure the survey plan matches the land you were shown.
4. Use a lawyer to prepare the Deed of Assignment and handle the consent application.

Our team handles title checks on every property we list. If you have questions about a document, [talk to one of our agents](/contact-us).$md$
),
(
  'buying-property-in-nigeria-from-the-diaspora',
  'Buying Property in Nigeria from Abroad: A Practical Guide',
  'Living in the UK, US or South Africa and planning to buy at home? These steps keep your money and your property safe.',
  'Investment',
  'Barods Global',
  'published',
  now() - interval '3 days',
  false,
  '/wp-content/uploads/2025/08/1-584x438.png',
  $md$Buying property in Nigeria while you live abroad is very common, and it can be done safely if you follow a clear process. Most problems come from paying before checks are done, or from relying on one relative or contact to handle everything.

## 1. Decide what you want the property to do

Is it a family home, a holiday base, or an investment for rental income? The answer shapes the location. Areas close to good roads, schools and business districts rent faster and hold their value better.

## 2. Work with a registered company

Deal with an estate firm that has a physical office and a company registration number, and whose agents you can speak to directly. Ask for video walk-throughs and, where possible, have a trusted person visit the site in person.

## 3. Verify the title before any payment

Ask for the title document and have a lawyer run a search at the land registry. For land, confirm it is free from government acquisition and that the survey plan is genuine.

## 4. Pay into a company account, with documentation

Never pay into a personal account. Each payment should come with a receipt and, at the end, a signed Deed of Assignment or contract of sale.

## 5. Plan for the full cost

On top of the price, budget for legal fees, registration and Governor’s Consent, and survey costs if needed. Your agent should give you a clear breakdown before you commit. The mortgage calculator on each listing gives a starting estimate.

## 6. Think about management

If you will rent the property out, arrange property management from the start, covering tenant screening, rent collection and maintenance.

Barods Global works with buyers in the diaspora every week. [Browse properties](/properties) or [speak to our team](/contact-us).$md$
),
(
  'renting-in-nigeria-understanding-agency-legal-and-caution-fees',
  'Renting in Nigeria: Agency, Legal and Caution Fees Explained',
  'The rent is only part of the cost. Here’s what each fee is for, what’s typical, and the questions to ask before you sign.',
  'Renting',
  'Barods Global',
  'published',
  now() - interval '1 day',
  false,
  '/wp-content/uploads/2025/08/plan4-b.png',
  $md$When you find a place to rent in Nigeria, the amount you pay at the start is usually more than the yearly rent. Knowing what each charge covers helps you budget and spot anything unusual.

## Rent

Most landlords ask for rent yearly, and some ask for two years up front. Every listing on our site shows how often rent is paid and any minimum tenure.

## Agency fee

This pays the agent who found the property and handled the letting. It is often quoted as a percentage of one year’s rent.

## Legal fee

This covers preparing the tenancy agreement. Like the agency fee, it is usually a percentage of the yearly rent.

## Caution fee (deposit)

A refundable deposit held against damage beyond normal wear and tear. Ask how and when it will be returned at the end of your tenancy.

## Service charge

Common in estates and serviced apartments, a service charge pays for shared costs such as security, waste collection, cleaning of common areas and sometimes power. Ask what it includes and whether it can change.

## Questions to ask before you pay

- Is the total upfront amount written down, with each fee listed?
- Who is the landlord, and is the person collecting money authorised to do so?
- What does the tenancy agreement say about renewals and rent increases?

Every rental on Barods Global lists these fees clearly. [See properties for rent](/properties?purpose=rent).$md$
)
on conflict (slug) do nothing;
