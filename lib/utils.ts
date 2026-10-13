// =============================================================================
// MB Mustapha - Utilitaires partages
// =============================================================================

/** Formate un montant en FCFA : 24900 -> "24 900 FCFA" */
export function fcfa(amount: number | null | undefined, currency = 'FCFA'): string {
  const n = Number(amount || 0);
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n)} ${currency}`;
}

/** Raccourci pour les gros montants : 1 250 000 -> "1,25 M FCFA" */
export function fcfaCourt(amount: number): string {
  const n = Number(amount || 0);
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace('.', ',')} M FCFA`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)} K FCFA`;
  return `${n} FCFA`;
}

export function frDate(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    date,
  );
}

export function frDateTime(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function daysBetween(a: string | Date, b: string | Date = new Date()): number {
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  return Math.round((d2 - d1) / 86_400_000);
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

/** Numero de facture sequentiel et sans trou : FAC-2026-0007 */
export function invoiceNumber(seq: number, year = new Date().getFullYear()): string {
  return `FAC-${year}-${String(seq).padStart(4, '0')}`;
}

export function maskPhone(p?: string | null): string {
  if (!p) return '—';
  const clean = p.replace(/\s/g, '');
  return clean.length > 6 ? `${clean.slice(0, 6)}••••${clean.slice(-2)}` : clean;
}

export function initials(name: string): string {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

export function pct(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Verifie qu'une chaine est bien un numero mobile africain plausible */
export function isAfricanPhone(phone: string): boolean {
  const clean = (phone || '').replace(/[^0-9+]/g, '');
  return /^(\+?(235|237|229|228|221|225|227|241|242|243|221)\d{7,9})$/.test(clean);
}
