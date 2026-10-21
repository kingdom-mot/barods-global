/** Digits for wa.me links: a Nigerian 0803… number becomes 234803…; other numbers keep their country code. */
export function waNumber(phone?: string | null): string {
  const d = (phone ?? '').replace(/[^0-9]/g, '');
  if (d.length === 11 && d.startsWith('0')) return `234${d.slice(1)}`;
  return d;
}

/** For tel: links. */
export function telHref(phone?: string | null): string {
  return `tel:${(phone ?? '').replace(/[^0-9+]/g, '')}`;
}
