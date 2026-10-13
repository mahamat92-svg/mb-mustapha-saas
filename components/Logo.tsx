// Logo de la marque — 100 % SVG inline, piloté par variables d'environnement.
// -----------------------------------------------------------------------------
// 1) Si NEXT_PUBLIC_BRAND_LOGO est défini (ex. "/logo.svg" ou une URL), ce fichier est utilisé.
// 2) Sinon, un logo est généré depuis NEXT_PUBLIC_BRAND_SIGLE + NEXT_PUBLIC_BRAND_COLOR.
// Aucune image binaire à gérer : idéal pour un téléphone en 3G.

const NOM = process.env.NEXT_PUBLIC_BRAND_NAME || 'MB Mustapha';
const SIGLE = (process.env.NEXT_PUBLIC_BRAND_SIGLE || 'MB').slice(0, 3);
const COULEUR = process.env.NEXT_PUBLIC_BRAND_COLOR || '#1d4ed8';
const ACCENT = process.env.NEXT_PUBLIC_BRAND_ACCENT || '#f59e0b';
const LOGO_PERSO = process.env.NEXT_PUBLIC_BRAND_LOGO || '';

export function Logo({ size = 36, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      {LOGO_PERSO ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={LOGO_PERSO} alt={NOM} width={size} height={size} className="rounded-xl" />
      ) : (
        <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={NOM}>
          <defs>
            <linearGradient id="afg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={COULEUR} />
              <stop offset="100%" stopColor={COULEUR} stopOpacity="0.78" />
            </linearGradient>
          </defs>
          <rect width="48" height="48" rx="12" fill="url(#afg)" />
          <text
            x="24"
            y="32.5"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
            fontSize={SIGLE.length > 1 ? 20 : 24}
            fontWeight="800"
            fill="#ffffff"
          >
            {SIGLE}
          </text>
          {/* Le flux d'argent qui rentre (point doré) + la croissance (barre) */}
          <circle cx="37" cy="12" r="4" fill={ACCENT} />
          <rect x="9" y="34" width="10" height="4" rx="2" fill={ACCENT} opacity="0.85" />
        </svg>
      )}
      {withText && (
        <span className="text-lg font-extrabold tracking-tight text-ink-900">{NOM}</span>
      )}
    </span>
  );
}

/** Version utilisée dans les pieds de page et les documents (nom seul). */
export function NomMarque({ sombre = false }: { sombre?: boolean }) {
  return <span className={sombre ? 'font-extrabold text-white' : 'font-extrabold text-ink-900'}>{NOM}</span>;
}
