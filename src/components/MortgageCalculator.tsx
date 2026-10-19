'use client';

import { useMemo, useState } from 'react';
import { CURRENCIES, perNgn, type CurrencyCode } from '@/lib/currency';
import {
  COUNTRY_RULES,
  defaultSchemeFor,
  withSettings,
  type MortgageOverrides,
  monthlyRepayment,
  zaTransferDuty,
  type CostField,
  type MoneyCode,
  type SchemeId,
} from '@/lib/mortgage';

function money(n: number, code: MoneyCode | CurrencyCode) {
  const { symbol } = CURRENCIES[code];
  return `${symbol}${Math.round(n).toLocaleString('en-NG')}`;
}

let RATES: Record<string, number> = {};
function convert(amount: number, from: MoneyCode | CurrencyCode, to: MoneyCode | CurrencyCode) {
  if (from === to) return amount;
  return (amount / perNgn(from, RATES)) * perNgn(to, RATES);
}

/** Text box that shows thousands separators but stores a plain number. */
function MoneyInput({ value, onChange, symbol, id }: { value: number; onChange: (n: number) => void; symbol: string; id: string }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">{symbol}</span>
      <input
        id={id}
        inputMode="numeric"
        className="field pl-8"
        value={value ? Math.round(value).toLocaleString('en-NG') : ''}
        placeholder="0"
        onChange={(e) => onChange(Number(e.target.value.replace(/[^0-9.]/g, '')) || 0)}
      />
    </div>
  );
}

function initialCosts(fields: CostField[]) {
  return Object.fromEntries(fields.map((f) => [f.key, f.default]));
}

export default function MortgageCalculator({
  price,
  currency,
  country,
  visitorCurrency,
  isLand,
  settings,
  rates = {},
}: {
  price: number;
  currency: MoneyCode;
  country: 'NG' | 'ZA';
  visitorCurrency: CurrencyCode;
  isLand: boolean;
  settings?: MortgageOverrides;
  rates?: Record<string, number>;
}) {
  RATES = rates;
  const SCHEMES = useMemo(() => withSettings(settings), [settings]);
  const [countryCode, setCountryCode] = useState<'NG' | 'ZA' | 'OTHER'>(country);
  const [schemeId, setSchemeId] = useState<SchemeId>(defaultSchemeFor(country));
  const scheme = SCHEMES[schemeId];
  const code: MoneyCode = scheme.id === 'custom' ? currency : scheme.currency;

  const [homePrice, setHomePrice] = useState(() => convert(price, currency, code));
  const [depositPct, setDepositPct] = useState(scheme.depositPct);
  const [rate, setRate] = useState(scheme.rate);
  const [term, setTerm] = useState(scheme.termYears);
  const [age, setAge] = useState<number | ''>('');
  const [monthlyCosts, setMonthlyCosts] = useState<Record<string, number>>(initialCosts(scheme.monthly));
  const [upfrontCosts, setUpfrontCosts] = useState<Record<string, number>>(initialCosts(scheme.upfront));

  function applyScheme(id: SchemeId) {
    const s = SCHEMES[id];
    const nextCode: MoneyCode = s.id === 'custom' ? currency : s.currency;
    setSchemeId(id);
    setHomePrice(convert(price, currency, nextCode));
    setDepositPct(s.depositPct);
    setRate(s.rate);
    setTerm(s.termYears);
    setMonthlyCosts(initialCosts(s.monthly));
    setUpfrontCosts(initialCosts(s.upfront));
  }

  function changeCountry(c: 'NG' | 'ZA' | 'OTHER') {
    setCountryCode(c);
    applyScheme(COUNTRY_RULES.find((r) => r.code === c)!.schemes[0]);
  }

  const r = useMemo(() => {
    const deposit = (homePrice * depositPct) / 100;
    const loan = Math.max(0, homePrice - deposit);
    const repayment = monthlyRepayment(loan, rate, term);
    const months = term * 12;
    const extrasMonthly = scheme.monthly.reduce((sum, f) => {
      const v = monthlyCosts[f.key] ?? 0;
      return sum + (f.unit === 'money-year' ? v / 12 : f.unit === 'money-month' ? v : 0);
    }, 0);
    const upfrontItems = scheme.upfront.map((f) => {
      const v = upfrontCosts[f.key] ?? 0;
      const amount = f.unit === 'pct-price' ? (homePrice * v) / 100 : f.unit === 'pct-loan' ? (loan * v) / 100 : v;
      return { label: f.label, amount };
    });
    if (scheme.autoUpfront === 'za-transfer-duty') upfrontItems.unshift({ label: 'Transfer duty (SARS)', amount: zaTransferDuty(homePrice) });
    const upfrontFees = upfrontItems.reduce((s, i) => s + i.amount, 0);
    const totalRepaid = repayment * months;

    const warnings: string[] = [];
    if (depositPct < scheme.minDepositPct)
      warnings.push(`Lenders usually ask for at least ${scheme.minDepositPct}% down (${money((homePrice * scheme.minDepositPct) / 100, code)}).`);
    if (scheme.maxLoan && loan > scheme.maxLoan) {
      const need = homePrice - scheme.maxLoan;
      warnings.push(
        `${scheme.name.replace(' loan', '').split(' (')[0]} loans are capped at ${money(scheme.maxLoan, code)}. You would need a deposit of at least ${money(need, code)} (${Math.ceil((need / homePrice) * 100)}%).`,
      );
    }
    if (scheme.maxAgeAtEnd && age !== '' && age + term > scheme.maxAgeAtEnd) {
      const maxTerm = Math.max(0, scheme.maxAgeAtEnd - age);
      warnings.push(`This loan must be repaid by age ${scheme.maxAgeAtEnd}, so the longest term for you is ${maxTerm} years.`);
    }

    return {
      deposit,
      loan,
      repayment,
      extrasMonthly,
      totalMonthly: repayment + extrasMonthly,
      totalInterest: Math.max(0, totalRepaid - loan),
      totalRepaid,
      upfrontItems,
      cashUpfront: deposit + upfrontFees,
      ltv: homePrice ? (loan / homePrice) * 100 : 0,
      warnings,
    };
  }, [homePrice, depositPct, rate, term, age, monthlyCosts, upfrontCosts, scheme, code]);

  const sym = CURRENCIES[code].symbol;
  const interestShare = r.totalRepaid ? (r.totalInterest / r.totalRepaid) * 100 : 0;
  const showVisitor = visitorCurrency !== code;

  return (
    <div className="space-y-6">
      {/* Inputs and results share their own grid, so the sticky results card can't slide past the calculator */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* Inputs */}
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <label className="label" htmlFor="mc-country">
            Country rules
            <select id="mc-country" className="field" value={countryCode} onChange={(e) => changeCountry(e.target.value as 'NG' | 'ZA' | 'OTHER')}>
              {COUNTRY_RULES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </label>
          <label className="label" htmlFor="mc-scheme">
            Loan type
            <select id="mc-scheme" className="field" value={schemeId} onChange={(e) => applyScheme(e.target.value as SchemeId)}>
              {COUNTRY_RULES.find((c) => c.code === countryCode)!.schemes.map((id) => (
                <option key={id} value={id}>{SCHEMES[id].name}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="-mt-2 text-sm text-muted">{scheme.summary}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label" htmlFor="mc-price">
            Property price
            <MoneyInput id="mc-price" value={homePrice} onChange={setHomePrice} symbol={sym} />
          </label>
          <label className="label" htmlFor="mc-rate">
            Interest rate (% a year){scheme.rateLocked && <span className="normal-case text-brand-greenDark"> · fixed by FMBN</span>}
            <input
              id="mc-rate"
              type="number"
              step="0.25"
              min={0}
              max={60}
              className="field disabled:bg-paper"
              value={rate}
              disabled={scheme.rateLocked}
              onChange={(e) => setRate(Number(e.target.value) || 0)}
            />
          </label>
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between text-xs font-semibold uppercase tracking-wide text-muted">
            <label htmlFor="mc-deposit">Down payment (equity)</label>
            <span className="text-sm normal-case tracking-normal text-brand-ink">
              {depositPct}% · {money(r.deposit, code)}
            </span>
          </div>
          <input id="mc-deposit" type="range" min={0} max={90} step={1} value={depositPct} onChange={(e) => setDepositPct(Number(e.target.value))} className="w-full accent-brand-green" />
          <p className="mt-1 text-xs text-muted">Minimum for this loan type: {scheme.minDepositPct}%</p>
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between text-xs font-semibold uppercase tracking-wide text-muted">
            <label htmlFor="mc-term">Loan term</label>
            <span className="text-sm normal-case tracking-normal text-brand-ink">{term} years</span>
          </div>
          <input id="mc-term" type="range" min={1} max={scheme.maxTermYears} step={1} value={Math.min(term, scheme.maxTermYears)} onChange={(e) => setTerm(Number(e.target.value))} className="w-full accent-brand-green" />
          <p className="mt-1 text-xs text-muted">Longest term for this loan type: {scheme.maxTermYears} years</p>
        </div>

        {scheme.maxAgeAtEnd && (
          <label className="label max-w-[200px]" htmlFor="mc-age">
            Your age (optional)
            <input id="mc-age" type="number" min={18} max={70} className="field" value={age} onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')} />
          </label>
        )}

        <details className="rounded-lg border border-line p-4" open>
          <summary className="cursor-pointer text-sm font-semibold">Monthly running costs</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {scheme.monthly.map((f) => (
              <label key={f.key} className="label" htmlFor={`mc-m-${f.key}`}>
                {f.label} {f.unit === 'money-year' ? '(per year)' : '(per month)'}
                <MoneyInput id={`mc-m-${f.key}`} symbol={sym} value={monthlyCosts[f.key] ?? 0} onChange={(v) => setMonthlyCosts({ ...monthlyCosts, [f.key]: v })} />
                <span className="text-[11px] font-normal normal-case tracking-normal">{f.hint}</span>
              </label>
            ))}
          </div>
        </details>

        <details className="rounded-lg border border-line p-4">
          <summary className="cursor-pointer text-sm font-semibold">One-off buying costs</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {scheme.upfront.map((f) => (
              <label key={f.key} className="label" htmlFor={`mc-u-${f.key}`}>
                {f.label} {f.unit === 'pct-price' ? '(% of price)' : f.unit === 'pct-loan' ? '(% of loan)' : ''}
                {f.unit === 'pct-price' || f.unit === 'pct-loan' ? (
                  <input id={`mc-u-${f.key}`} type="number" step="0.5" min={0} max={30} className="field" value={upfrontCosts[f.key] ?? 0} onChange={(e) => setUpfrontCosts({ ...upfrontCosts, [f.key]: Number(e.target.value) || 0 })} />
                ) : (
                  <MoneyInput id={`mc-u-${f.key}`} symbol={sym} value={upfrontCosts[f.key] ?? 0} onChange={(v) => setUpfrontCosts({ ...upfrontCosts, [f.key]: v })} />
                )}
                <span className="text-[11px] font-normal normal-case tracking-normal">{f.hint}</span>
              </label>
            ))}
          </div>
        </details>
      </div>

      {/* Results */}
      <div className="rounded-xl bg-brand-ink p-5 text-white lg:sticky lg:top-[150px]" aria-live="polite">
        <div className="text-xs font-semibold uppercase tracking-wide text-white/60">Estimated monthly payment</div>
        <div className="mt-1 text-3xl font-extrabold text-brand-green">{money(r.totalMonthly, code)}</div>
        {showVisitor && <div className="text-sm text-white/70">≈ {money(convert(r.totalMonthly, code, visitorCurrency), visitorCurrency)} in your currency</div>}

        <dl className="mt-5 space-y-2 border-t border-white/15 pt-4 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-white/70">Loan repayment</dt><dd>{money(r.repayment, code)}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-white/70">Running costs</dt><dd>{money(r.extrasMonthly, code)}</dd></div>
          <div className="flex justify-between gap-3 border-t border-white/15 pt-2"><dt className="text-white/70">Loan amount</dt><dd>{money(r.loan, code)}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-white/70">Loan-to-value</dt><dd>{r.ltv.toFixed(0)}%</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-white/70">Total interest</dt><dd>{money(r.totalInterest, code)}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-white/70">Total repaid over {term} yrs</dt><dd>{money(r.totalRepaid, code)}</dd></div>
        </dl>

        <div className="mt-4">
          <div className="flex h-2.5 overflow-hidden rounded-full bg-white/15" role="img" aria-label={`Principal ${(100 - interestShare).toFixed(0)}%, interest ${interestShare.toFixed(0)}%`}>
            <div className="bg-brand-green" style={{ width: `${100 - interestShare}%` }} />
            <div className="bg-brand-orange" style={{ width: `${interestShare}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-white/70">
            <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-brand-green" />Principal {(100 - interestShare).toFixed(0)}%</span>
            <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-brand-orange" />Interest {interestShare.toFixed(0)}%</span>
          </div>
        </div>

        <div className="mt-5 rounded-lg bg-white/10 p-3.5 text-sm">
          <div className="flex justify-between gap-3 font-semibold"><span>Cash needed upfront</span><span>{money(r.cashUpfront, code)}</span></div>
          <ul className="mt-2 space-y-1 text-xs text-white/70">
            <li className="flex justify-between gap-3"><span>Down payment</span><span>{money(r.deposit, code)}</span></li>
            {r.upfrontItems.map((i) => (
              <li key={i.label} className="flex justify-between gap-3"><span>{i.label}</span><span>{money(i.amount, code)}</span></li>
            ))}
          </ul>
        </div>
      </div>

      </div>

      {/* Rules and warnings sit below, full width */}
      <div className="space-y-3">
        {r.warnings.map((w) => (
          <p key={w} className="rounded-lg border border-brand-orange/40 bg-brand-orange/10 p-3 text-sm text-brand-ink" role="alert">{w}</p>
        ))}
        {isLand && countryCode === 'NG' && (
          <p className="rounded-lg bg-paper p-3 text-sm">
            Most Nigerian mortgage lenders don’t finance bare land. Ask us about instalment payment plans for this plot.
          </p>
        )}
        {code !== currency && (
          <p className="text-xs text-muted">The listing price has been converted to {code} at an indicative rate for this estimate.</p>
        )}
        <ul className="list-disc space-y-1 pl-5 text-xs text-muted">
          {scheme.notes.map((n) => <li key={n}>{n}</li>)}
          <li>This is an estimate, not a loan offer. Your lender will confirm the final rate, fees and eligibility.</li>
        </ul>
      </div>
    </div>
  );
}
