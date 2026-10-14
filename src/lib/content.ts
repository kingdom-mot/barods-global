// Built-in copy of the live barodsglobal.com content (Oct 2026).
// Used when Supabase is not configured, and mirrors supabase/migrations/0002_seed.sql.
import type { Agent, Property, TeamMember } from './types';

const WP = 'https://barodsglobal.com/wp-content/uploads';

export const contact = {
  address: 'Suite B104, Providence Mall, Opposite Globus Bank, Leme Abiola Way, Abeokuta',
  phone: '+234 802 228 8806',
  phoneHref: 'tel:+2348022288806',
  email: 'support@barodsglobal.com',
  tagline: 'Your Trusted Partner in Real Estate & Construction Excellence.',
};

export const agents: Agent[] = [
  {
    slug: 'lawrita-agbor',
    fullName: 'Lawrita C. Agbor',
    position: 'HR / Senior Property Consultant',
    email: 'lawrita@barodsglobal.com',
    photoUrl: `${WP}/2025/08/5-1.jpg`,
    verified: true,
    bio: 'Guides buyers from first viewing to title transfer across Abeokuta and Lagos.',
  },
  {
    slug: 'toyosi-akinbobola',
    fullName: 'Toyosi Akinbobola',
    position: 'Property Consultant',
    email: 'toyosi@barodsglobal.com',
    photoUrl: `${WP}/2025/08/2-1.jpg`,
    verified: true,
  },
  {
    slug: 'ajibola-akinwande',
    fullName: 'ESV Ajibola Akinwande ANIVS, RSV',
    position: 'General Manager',
    email: 'ajibola@barodsglobal.com',
    photoUrl: `${WP}/2025/08/3-1.jpg`,
    verified: true,
  },
];

export const team: TeamMember[] = [
  { name: 'Babatunde Denton', role: 'CEO', email: 'tunde@barodsglobal.com', photoUrl: `${WP}/2025/08/1-1.jpg` },
  { name: 'ESV Ajibola Akinwande ANIVS, RSV', role: 'General Manager', email: 'ajibola@barodsglobal.com', photoUrl: `${WP}/2025/08/3-1.jpg` },
  { name: 'Lawrita C. Agbor', role: 'HR / Senior Property Consultant', email: 'lawrita@barodsglobal.com', photoUrl: `${WP}/2025/08/5-1.jpg` },
  { name: 'Lolade Ogundimu', role: 'Executive Secretary', email: 'lolade@barodsglobal.com', photoUrl: `${WP}/2025/08/4-1.jpg` },
  { name: 'Kehinde Oregbesan', role: 'Lead Architect', email: 'kehinde@barodsglobal.com', photoUrl: `${WP}/2025/08/6-1.jpg` },
  { name: 'Toyosi Akinbobola', role: 'Property Consultant', email: 'toyosi@barodsglobal.com', photoUrl: `${WP}/2025/08/2-1.jpg` },
];

export const partners: string[] = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `${WP}/2025/08/${n}.jpg`);

export const properties: Property[] = [
  {
    ref: 'BG-10231',
    slug: 'brand-new-luxury-5-bed-duplex-with-a-swimming-pool-bq',
    title: 'Brand New Luxury 5 Bed Duplex with a Swimming Pool & BQ',
    description:
      'A brand new five-bedroom detached duplex with a private swimming pool and boys’ quarters, finished to a high standard in a secure neighbourhood of Abeokuta.',
    purpose: 'sale',
    typeName: 'Detached Duplex',
    typeSlug: 'detached-duplex',
    countryCode: 'NG',
    state: 'Ogun',
    stateSlug: 'ogun',
    city: 'Abeokuta',
    citySlug: 'abeokuta',
    price: 220000000,
    currency: 'NGN',
    pricePeriod: 'once',
    bedrooms: 5,
    bathrooms: 5,
    toilets: 6,
    parking: 2,
    floorSizeSqm: 520,
    condition: 'Newly built',
    titleDocument: 'C of O',
    amenities: ['Swimming pool', "Boys' quarters (BQ)", 'Fitted kitchen', 'En-suite bedrooms', 'Security gate'],
    photos: [`${WP}/2025/08/1-584x438.png`],
    agentSlug: 'lawrita-agbor',
    featured: true,
    label: 'Hot Offer',
    availability: 'available',
    publishedAt: '2026-10-12',
  },
  {
    ref: 'BG-10232',
    slug: 'a-prime-plot-of-land-for-sale-at-ibara-gra-abeokuta-ogun-state',
    title: 'A Prime Plot of Land for Sale at Ibara GRA, Abeokuta, Ogun State',
    description:
      'A 450 sqm residential plot in Ibara GRA, one of Abeokuta’s most established neighbourhoods, close to the main road with good access.',
    purpose: 'sale',
    typeName: 'Residential Land',
    typeSlug: 'residential-land',
    countryCode: 'NG',
    state: 'Ogun',
    stateSlug: 'ogun',
    city: 'Abeokuta',
    citySlug: 'abeokuta',
    area: 'Ibara GRA',
    price: 120000000,
    currency: 'NGN',
    pricePeriod: 'once',
    landSize: '450 sqm',
    amenities: ['Tarred road'],
    photos: [`${WP}/2026/10/WhatsApp-Image-2026-10-07-at-4.28.25-PM-584x438.jpeg`],
    agentSlug: 'toyosi-akinbobola',
    featured: true,
    availability: 'available',
    publishedAt: '2026-10-07',
  },
];

export const cities = [
  { name: 'Abeokuta', slug: 'abeokuta', state: 'Ogun' },
  { name: 'Lagos', slug: 'lagos', state: 'Lagos' },
  { name: 'Ibadan', slug: 'ibadan', state: 'Oyo' },
  { name: 'Epe', slug: 'epe', state: 'Lagos' },
  { name: 'Ado-Ekiti', slug: 'ado-ekiti', state: 'Ekiti' },
  { name: 'Sagamu', slug: 'sagamu', state: 'Ogun' },
  { name: 'Abuja', slug: 'abuja', state: 'FCT Abuja' },
  { name: 'Johannesburg', slug: 'johannesburg', state: 'Gauteng' },
];

export const nigeriaStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta',
  'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT Abuja', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
  'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
];

export const southAfricaProvinces = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'North West',
  'Northern Cape', 'Western Cape',
];

export const propertyTypes = [
  { group: 'Flat / Apartment', items: [['mini-flat', 'Mini Flat'], ['self-contain', 'Self Contain'], ['apartment', 'Apartment']] },
  {
    group: 'House',
    items: [
      ['detached-duplex', 'Detached Duplex'], ['semi-detached-duplex', 'Semi-detached Duplex'],
      ['terraced-duplex', 'Terraced Duplex'], ['detached-bungalow', 'Detached Bungalow'],
      ['semi-detached-bungalow', 'Semi-detached Bungalow'], ['block-of-flats', 'Block of Flats'],
    ],
  },
  {
    group: 'Land',
    items: [['residential-land', 'Residential Land'], ['commercial-land', 'Commercial Land'], ['mixed-use-land', 'Mixed-use Land'], ['farm-land', 'Farm Land']],
  },
  {
    group: 'Commercial',
    items: [['office-space', 'Office Space'], ['shop', 'Shop'], ['plaza-mall', 'Plaza / Mall'], ['warehouse', 'Warehouse'], ['hotel-guest-house', 'Hotel / Guest House']],
  },
] as const;

export const services = [
  {
    slug: 'architectural-designs',
    name: 'Architectural Designs',
    summary:
      'Innovative architectural designs that combine creativity, functionality and sustainability — modern, practical and aesthetically pleasing spaces tailored to your needs.',
    image: `${WP}/2025/08/plan4-b.png`,
  },
  {
    slug: 'building-construction',
    name: 'Building Construction',
    summary:
      'From residential homes to large-scale developments, building projects executed with precision and quality — durable, delivered on time and cost-effective.',
    image: `${WP}/wp-realestate-uploads/_property_featured_image/2024/12/WhatsApp-Image-2024-12-19-at-11.35.12.jpeg`,
  },
  {
    slug: 'property-management',
    name: 'Property Management',
    summary:
      'Professional management that keeps your investments well-maintained, profitable and stress-free — tenant relations, maintenance and rent collection handled for you.',
    image: `${WP}/2025/07/Barods-image.jpeg`,
  },
];
