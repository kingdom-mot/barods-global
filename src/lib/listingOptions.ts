/**
 * Answer lists for the create-listing form. Everything is a dropdown, so agents who aren't
 * comfortable typing can still list quickly. Nigerian questions follow PropertyPro; South African
 * ones follow RE/MAX South Africa.
 */
type Opt = [value: string, label: string];

export const COUNT_OPTIONS: Opt[] = Array.from({ length: 11 }, (_, i) => [String(i), i === 10 ? '10+' : String(i)]);

export const CONDITION: Opt[] = [
  ['Newly built', 'Newly built'],
  ['Fairly used', 'Fairly used'],
  ['Renovated', 'Renovated'],
  ['Off-plan', 'Off-plan'],
  ['Under construction', 'Under construction'],
];

export const FURNISHING: Opt[] = [
  ['Furnished', 'Furnished'],
  ['Semi-furnished', 'Semi-furnished'],
  ['Unfurnished', 'Unfurnished'],
];

export const TITLE_DOCS: Record<'NG' | 'ZA', Opt[]> = {
  NG: [
    ['Certificate of Occupancy (C of O)', 'Certificate of Occupancy (C of O)'],
    ["Governor's Consent", "Governor's Consent"],
    ['Deed of Assignment', 'Deed of Assignment'],
    ['Registered Survey Plan', 'Registered Survey Plan'],
    ['Excision', 'Excision'],
    ['Gazette', 'Gazette'],
    ['Land Certificate', 'Land Certificate'],
    ['Right of Occupancy (R of O)', 'Right of Occupancy (R of O)'],
    ['Deed of Sublease', 'Deed of Sublease'],
    ['Allocation Letter', 'Allocation Letter'],
    ['Purchase Receipt only', 'Purchase Receipt only'],
  ],
  ZA: [
    ['Title Deed (Freehold)', 'Title Deed (Freehold)'],
    ['Sectional Title', 'Sectional Title'],
    ['Leasehold', 'Leasehold'],
    ['Share Block', 'Share Block'],
  ],
};

export const LAND_SIZES: Opt[] = [
  ['300 sqm', '300 sqm'],
  ['450 sqm', '450 sqm'],
  ['500 sqm', '500 sqm'],
  ['600 sqm', '600 sqm'],
  ['648 sqm', '648 sqm (full plot, Lagos)'],
  ['900 sqm', '900 sqm'],
  ['1,000 sqm', '1,000 sqm'],
  ['1,200 sqm', '1,200 sqm'],
  ['2,000 sqm', '2,000 sqm'],
  ['Half an acre', 'Half an acre'],
  ['1 acre', '1 acre'],
  ['2 acres', '2 acres'],
  ['5 acres', '5 acres'],
  ['1 hectare', '1 hectare'],
  ['Over 1 hectare', 'Over 1 hectare'],
];

export const FLOOR_SIZES: Opt[] = [
  ['40', 'Under 50 sqm'],
  ['75', '50–100 sqm'],
  ['125', '100–150 sqm'],
  ['175', '150–200 sqm'],
  ['250', '200–300 sqm'],
  ['350', '300–400 sqm'],
  ['450', '400–500 sqm'],
  ['600', '500–700 sqm'],
  ['850', '700–1,000 sqm'],
  ['1200', 'Over 1,000 sqm'],
];

export const YES_NO: Opt[] = [
  ['yes', 'Yes'],
  ['no', 'No'],
];

export const PAYMENT_PLAN: Opt[] = [
  ['outright', 'Outright payment'],
  ['instalment', 'Instalment plan available'],
];

export const INSTALMENT_DEPOSIT: Opt[] = ['10', '20', '30', '40', '50'].map((v) => [v, `${v}% initial deposit`]);
export const INSTALMENT_MONTHS: Opt[] = ['3', '6', '12', '18', '24', '36'].map((v) => [v, `${v} months`]);

export const RENT_FREQUENCY: Opt[] = [
  ['yearly', 'Yearly'],
  ['bi-annually', 'Every 6 months'],
  ['quarterly', 'Quarterly'],
  ['monthly', 'Monthly'],
];

export const MIN_TENURE: Opt[] = ['1', '2', '3', '5'].map((v) => [v, v === '1' ? '1 year' : `${v} years`]);

export const SERVICE_CHARGE: Opt[] = [
  ['None', 'No service charge'],
  ['Under ₦250,000 a year', 'Under ₦250,000 a year'],
  ['₦250,000 – ₦500,000 a year', '₦250,000 – ₦500,000 a year'],
  ['₦500,000 – ₦1,000,000 a year', '₦500,000 – ₦1,000,000 a year'],
  ['₦1,000,000 – ₦2,000,000 a year', '₦1,000,000 – ₦2,000,000 a year'],
  ['Over ₦2,000,000 a year', 'Over ₦2,000,000 a year'],
];

export const FEE_PCT: Opt[] = ['0', '5', '10'].map((v) => [v, v === '0' ? 'None' : `${v}% of rent`]);

export const CAUTION_FEE: Opt[] = [
  ['None', 'None'],
  ['1 month’s rent', '1 month’s rent'],
  ['3 months’ rent', '3 months’ rent'],
  ['6 months’ rent', '6 months’ rent'],
  ['10% of rent', '10% of rent'],
  ['20% of rent', '20% of rent'],
];

export const ZA_DEPOSIT: Opt[] = [
  ['1 month', '1 month’s rent'],
  ['1.5 months', '1.5 months’ rent'],
  ['2 months', '2 months’ rent'],
];

export const ZA_LEASE: Opt[] = ['6', '12', '24'].map((v) => [v, `${v} months`]);

export const ZA_BANDS: Opt[] = [
  ['Under R1,000 a month', 'Under R1,000 a month'],
  ['R1,000 – R2,500 a month', 'R1,000 – R2,500 a month'],
  ['R2,500 – R5,000 a month', 'R2,500 – R5,000 a month'],
  ['Over R5,000 a month', 'Over R5,000 a month'],
];

export const MIN_NIGHTS: Opt[] = ['1', '2', '3', '7', '14', '30'].map((v) => [v, v === '1' ? '1 night' : `${v} nights`]);
export const MAX_GUESTS: Opt[] = Array.from({ length: 12 }, (_, i) => [String(i + 1), i + 1 === 12 ? '12+ guests' : `${i + 1} guest${i ? 's' : ''}`]);
export const TIMES: Opt[] = ['08:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'].map((t) => {
  const h = Number(t.slice(0, 2));
  return [t, `${((h + 11) % 12) + 1}:00 ${h < 12 ? 'am' : 'pm'}`];
});

export const PURPOSES = [
  ['sale', 'Buy'],
  ['rent', 'Rent'],
  ['shortlet', 'Shortlet'],
] as const;

export const PRICE_LABEL = { sale: 'Asking price', rent: 'Rent per year', shortlet: 'Price per night' } as const;

export const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  draft: { text: 'Draft', cls: 'bg-line text-brand-ink' },
  pending_review: { text: 'Awaiting approval', cls: 'bg-amber-100 text-amber-900' },
  sent_back: { text: 'Sent back', cls: 'bg-red-100 text-red-800' },
  published: { text: 'Live', cls: 'bg-brand-greenLight text-brand-greenDark' },
  archived: { text: 'Archived', cls: 'bg-line text-muted' },
};
