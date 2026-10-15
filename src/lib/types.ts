export type Purpose = 'sale' | 'rent' | 'shortlet';
export type Availability = 'available' | 'under_offer' | 'sold' | 'let' | 'unavailable';

export interface Agent {
  slug: string;
  fullName: string;
  position: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  photoUrl?: string;
  bio?: string;
  verified: boolean;
}

export interface Property {
  ref: string;
  slug: string;
  wpSlug?: string;
  title: string;
  description?: string;
  purpose: Purpose;
  typeName: string;
  typeSlug: string;
  countryCode: 'NG' | 'ZA';
  state: string;
  stateSlug: string;
  city: string;
  citySlug: string;
  area?: string;
  address?: string;
  price: number | null;
  currency: 'NGN' | 'ZAR';
  pricePeriod: 'once' | 'year' | 'month' | 'night';
  bedrooms?: number;
  bathrooms?: number;
  toilets?: number;
  parking?: number;
  floorSizeSqm?: number;
  landSize?: string;
  condition?: string;
  furnishing?: string;
  titleDocument?: string;
  amenities: string[];
  photos: string[];
  agentSlug: string;
  featured: boolean;
  label?: string;
  availability: Availability;
  publishedAt: string;
  updatedAt?: string;
  videoUrl?: string;
  virtualTourUrl?: string;
  // rent terms (NG)
  serviceCharge?: string;
  agencyFee?: string;
  legalFee?: string;
  cautionFee?: string;
  minimumTenure?: string;
}

export interface TeamMember {
  name: string;
  role: string;
  email: string;
  photoUrl: string;
}

export interface SearchParams {
  purpose?: string;
  q?: string;
  location?: string;
  state?: string;
  city?: string;
  type?: string;
  beds?: string;
  baths?: string;
  minPrice?: string;
  maxPrice?: string;
  furnishing?: string;
  status?: string;
  sort?: string;
}
