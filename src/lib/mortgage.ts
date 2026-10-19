/**
 * Mortgage rules by country. Nigeria is the default.
 *
 * Figures are starting points a visitor can edit, never a loan offer. They move with central-bank
 * decisions, so review them regularly (the admin portal will edit these later).
 * Last reviewed: October 2026.
 *   - Nigeria NHF (FMBN): 6% fixed, up to ₦15M, up to 30 years, repaid before age 60.
 *   - Nigeria commercial (PMBs and banks): roughly 18–28% a year in 2026, usually up to 20 years.
 *   - South Africa: prime 10.50% (July 2026); bonds up to 30 years, 100% bonds possible;
 *     transfer duty per the SARS table; NCA caps on the initiation fee (R6,037.50) and service fee (R69/month).
 */

export type SchemeId = 'ng-commercial' | 'ng-nhf' | 'za-bond' | 'custom';
export type MoneyCode = 'NGN' | 'ZAR';

export interface CostField {
  key: string;
  label: string;
  hint: string;
  unit: 'pct-price' | 'pct-loan' | 'money-year' | 'money-month' | 'money-once';
  default: number;
}

export interface Scheme {
  id: SchemeId;
  country: 'NG' | 'ZA' | 'OTHER';
  name: string;
  summary: string;
  currency: MoneyCode;
  rate: number;
  rateLocked?: boolean;
  minDepositPct: number;
  depositPct: number;
  maxTermYears: number;
  termYears: number;
  maxLoan?: number;
  maxAgeAtEnd?: number;
  monthly: CostField[];
  upfront: CostField[];
  autoUpfront?: 'za-transfer-duty';
  notes: string[];
}

export const COUNTRY_RULES: { code: 'NG' | 'ZA' | 'OTHER'; label: string; schemes: SchemeId[] }[] = [
  { code: 'NG', label: 'Nigeria', schemes: ['ng-commercial', 'ng-nhf'] },
  { code: 'ZA', label: 'South Africa', schemes: ['za-bond'] },
  { code: 'OTHER', label: 'Other country', schemes: ['custom'] },
];

export const SCHEMES: Record<SchemeId, Scheme> = {
  'ng-commercial': {
    id: 'ng-commercial',
    country: 'NG',
    name: 'Commercial mortgage',
    summary: 'Loans from Primary Mortgage Banks and commercial banks at market rates.',
    currency: 'NGN',
    rate: 22,
    minDepositPct: 20,
    depositPct: 30,
    maxTermYears: 20,
    termYears: 15,
    monthly: [
      { key: 'insurance', label: 'Property insurance', hint: 'Lenders require the building to be insured', unit: 'money-year', default: 0 },
      { key: 'luc', label: 'Land Use Charge / ground rent', hint: 'Set by the state government each year', unit: 'money-year', default: 0 },
      { key: 'estate', label: 'Estate service charge', hint: 'Security, waste, roads and power in the estate', unit: 'money-month', default: 0 },
    ],
    upfront: [
      { key: 'legal', label: 'Legal fee', hint: 'Usually 5–10% of the price in Nigeria', unit: 'pct-price', default: 5 },
      { key: 'consent', label: "Governor's consent, stamp duty and registration", hint: 'Varies by state; about 3% in Lagos', unit: 'pct-price', default: 3 },
      { key: 'lender', label: 'Lender processing and valuation fees', hint: 'Typically about 1% of the loan', unit: 'pct-loan', default: 1 },
    ],
    notes: [
      'Most lenders ask for at least 20% equity contribution and proof of steady income.',
      'Rates are variable and follow the CBN Monetary Policy Rate, so repayments can change.',
    ],
  },
  'ng-nhf': {
    id: 'ng-nhf',
    country: 'NG',
    name: 'NHF loan (FMBN)',
    summary: 'Federal Mortgage Bank of Nigeria loan at a fixed 6%, through an accredited PMB.',
    currency: 'NGN',
    rate: 6,
    rateLocked: true,
    minDepositPct: 10,
    depositPct: 10,
    maxTermYears: 30,
    termYears: 25,
    maxLoan: 15_000_000,
    maxAgeAtEnd: 60,
    monthly: [
      { key: 'insurance', label: 'Property insurance', hint: 'Required on the mortgaged property', unit: 'money-year', default: 0 },
      { key: 'luc', label: 'Land Use Charge / ground rent', hint: 'Set by the state government each year', unit: 'money-year', default: 0 },
      { key: 'estate', label: 'Estate service charge', hint: 'If the home is in a managed estate', unit: 'money-month', default: 0 },
    ],
    upfront: [
      { key: 'legal', label: 'Legal fee', hint: 'Usually 5–10% of the price in Nigeria', unit: 'pct-price', default: 5 },
      { key: 'consent', label: "Governor's consent, stamp duty and registration", hint: 'Varies by state; about 3% in Lagos', unit: 'pct-price', default: 3 },
    ],
    notes: [
      'You must have contributed 2.5% of your monthly salary to the NHF for at least 6 months.',
      'The loan is capped at ₦15 million and must be repaid before age 60. Confirm current limits with FMBN.',
    ],
  },
  'za-bond': {
    id: 'za-bond',
    country: 'ZA',
    name: 'Home loan (bond)',
    summary: 'South African bank bond, usually priced around the prime lending rate.',
    currency: 'ZAR',
    rate: 10.5,
    minDepositPct: 0,
    depositPct: 10,
    maxTermYears: 30,
    termYears: 20,
    monthly: [
      { key: 'service', label: 'Bank service fee', hint: 'Capped at R69 a month by the National Credit Act', unit: 'money-month', default: 69 },
      { key: 'rates', label: 'Municipal rates and taxes', hint: 'Set by the municipality', unit: 'money-month', default: 0 },
      { key: 'levies', label: 'Levies (sectional title / estate)', hint: 'Paid to the body corporate or HOA', unit: 'money-month', default: 0 },
      { key: 'insurance', label: 'Homeowner’s insurance', hint: 'Banks require building cover on the bond', unit: 'money-month', default: 0 },
    ],
    upfront: [
      { key: 'initiation', label: 'Bond initiation fee', hint: 'Capped at R6,037.50 by the National Credit Act', unit: 'money-once', default: 6037.5 },
      { key: 'attorneys', label: 'Transfer and bond attorney fees', hint: 'Ask a conveyancer for a quote', unit: 'money-once', default: 0 },
    ],
    autoUpfront: 'za-transfer-duty',
    notes: [
      'Prime is 10.50% (South African Reserve Bank, July 2026). Your rate depends on your credit profile.',
      'Transfer duty follows the SARS table; homes up to R1.21 million pay none.',
    ],
  },
  custom: {
    id: 'custom',
    country: 'OTHER',
    name: 'Your lender’s terms',
    summary: 'Enter the rate, deposit and term your lender has quoted.',
    currency: 'NGN',
    rate: 10,
    minDepositPct: 0,
    depositPct: 20,
    maxTermYears: 40,
    termYears: 25,
    monthly: [
      { key: 'tax', label: 'Property tax', hint: 'Per year', unit: 'money-year', default: 0 },
      { key: 'insurance', label: 'Home insurance', hint: 'Per year', unit: 'money-year', default: 0 },
      { key: 'hoa', label: 'HOA / service charge', hint: 'Per month', unit: 'money-month', default: 0 },
    ],
    upfront: [{ key: 'closing', label: 'Closing costs', hint: 'Legal, registration and lender fees', unit: 'pct-price', default: 0 }],
    notes: ['Use the figures your lender gives you; local taxes and fees vary by country.'],
  },
};

/** SARS transfer duty, natural persons, from 1 April 2025. */
export function zaTransferDuty(value: number): number {
  const bands: [number, number, number][] = [
    // [from, base, rate]
    [13_310_000, 1_241_456, 0.13],
    [2_994_800, 106_784, 0.11],
    [2_329_300, 53_544, 0.08],
    [1_663_800, 13_614, 0.06],
    [1_210_000, 0, 0.03],
  ];
  for (const [from, base, rate] of bands) if (value > from) return Math.round(base + (value - from) * rate);
  return 0;
}

/** Standard amortising repayment per month. */
export function monthlyRepayment(principal: number, annualRatePct: number, years: number): number {
  const n = Math.round(years * 12);
  if (principal <= 0 || n <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

export function defaultSchemeFor(country: 'NG' | 'ZA'): SchemeId {
  return country === 'ZA' ? 'za-bond' : 'ng-commercial';
}

/** Apply the rates edited in the admin portal (Website → Settings) to the schemes above. */
export type MortgageOverrides = {
  ng_commercial_rate?: number;
  ng_commercial_min_deposit?: number;
  ng_commercial_max_term?: number;
  nhf_rate?: number;
  nhf_max_loan?: number;
  nhf_max_term?: number;
  za_prime_rate?: number;
};
export function withSettings(o: MortgageOverrides = {}): Record<SchemeId, Scheme> {
  const n = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : d);
  const c = SCHEMES['ng-commercial'], nhf = SCHEMES['ng-nhf'], za = SCHEMES['za-bond'];
  const cMin = n(o.ng_commercial_min_deposit, c.minDepositPct);
  const cMax = n(o.ng_commercial_max_term, c.maxTermYears);
  const nhfMax = n(o.nhf_max_term, nhf.maxTermYears);
  const nhfLoan = n(o.nhf_max_loan, nhf.maxLoan ?? 0);
  return {
    ...SCHEMES,
    'ng-commercial': { ...c, rate: n(o.ng_commercial_rate, c.rate), minDepositPct: cMin, depositPct: Math.max(c.depositPct, cMin), maxTermYears: cMax, termYears: Math.min(c.termYears, cMax) },
    'ng-nhf': {
      ...nhf,
      rate: n(o.nhf_rate, nhf.rate),
      maxLoan: nhfLoan,
      maxTermYears: nhfMax,
      termYears: Math.min(nhf.termYears, nhfMax),
      notes: [nhf.notes[0], `The loan is capped at ₦${nhfLoan.toLocaleString('en-NG')} and must be repaid before age 60. Confirm current limits with FMBN.`],
    },
    'za-bond': {
      ...za,
      rate: n(o.za_prime_rate, za.rate),
      notes: [`Prime is ${n(o.za_prime_rate, za.rate)}% (South African Reserve Bank). Your rate depends on your credit profile.`, za.notes[1]],
    },
  };
}
