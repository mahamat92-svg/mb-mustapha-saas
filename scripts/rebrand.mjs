#!/usr/bin/env node
// =============================================================================
//  REBAPTISER LE SAAS EN UNE COMMANDE (marque blanche)
// -----------------------------------------------------------------------------
//  Exemples :
//    node scripts/rebrand.mjs --nom "Sahel Gestion" --sigle SG
//    node scripts/rebrand.mjs --nom "Njangi Manager" --couleur "#0f766e"
//    node scripts/rebrand.mjs --nom "MB Mustapha" --sigle MB --couleur "#1d4ed8" \
//         --whatsapp "+235 66 12 34 56" --email "contact@mbmustapha.com" \
//         --fondateur "Mahamat Bouba Mustapha"
//
//  Effets :
//    1. Écrit (ou met à jour) .env.local avec les variables de marque
//    2. Regénère app/icon.svg ET public/icon.svg (couleur + sigle)
//    3. Affiche la liste des 5 copies de Vercel à refaire (Production + Preview)
//
//  Aucun autre fichier à modifier : le nom, le logo, la palette, le manifest PWA,
//  les e-mails et le pied de page lisent tous ces variables.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const lire = (drapeau, defaut) => {
  const i = args.indexOf(drapeau);
  return i >= 0 && args[i + 1] ? args[i + 1] : defaut;
};

const nom = lire('--nom', 'MB Mustapha');
const sigle = lire('--sigle', nom.trim().charAt(0).toUpperCase());
const couleur = lire('--couleur', '#1d4ed8');
const accent = lire('--accent', '#f59e0b');
const whatsapp = lire('--whatsapp', '');
const email = lire('--email', '');
const fondateur = lire('--fondateur', 'Mahamat Bouba Mustapha');
const baseline = lire('--baseline', '');
let domaine = lire('--domaine', '');
// Une URL complete est attendue : on ajoute https:// si l'utilisateur a saisi "mon-domaine.com"
if (domaine && !/^https?:\/\//.test(domaine)) domaine = `https://${domaine}`;

if (!/^#[0-9a-fA-F]{6}$/.test(couleur)) {
  console.error(`❌ Couleur invalide : ${couleur}. Format attendu : #1d4ed8`);
  process.exit(1);
}
if (sigle.length > 3) {
  console.error('❌ Le sigle doit faire 1 à 3 lettres (ex. N, SG, NM).');
  process.exit(1);
}

// --- 1. Variables d'environnement -------------------------------------------
const variables = {
  NEXT_PUBLIC_BRAND_NAME: nom,
  NEXT_PUBLIC_BRAND_SIGLE: sigle,
  NEXT_PUBLIC_BRAND_COLOR: couleur,
  NEXT_PUBLIC_BRAND_ACCENT: accent,
  NEXT_PUBLIC_FOUNDER_NAME: fondateur,
};
if (whatsapp) variables.NEXT_PUBLIC_SUPPORT_WHATSAPP = whatsapp;
if (email) variables.NEXT_PUBLIC_SUPPORT_EMAIL = email;
if (domaine) variables.NEXT_PUBLIC_APP_URL = domaine;
if (baseline) variables.NEXT_PUBLIC_BRAND_BASELINE = baseline;

// Rappel clair de ce qui reste a renseigner (aucune valeur inventee)
const reste = [];
if (!whatsapp) reste.push('NEXT_PUBLIC_SUPPORT_WHATSAPP  (votre numero WhatsApp professionnel)');
if (!email) reste.push('NEXT_PUBLIC_SUPPORT_EMAIL      (votre e-mail de vente)');
if (!domaine) reste.push('NEXT_PUBLIC_APP_URL            (votre domaine, ex. https://mon-domaine.com)');

const cheminEnv = path.join(process.cwd(), '.env.local');
let contenu = fs.existsSync(cheminEnv) ? fs.readFileSync(cheminEnv, 'utf8') : '';
for (const [cle, valeur] of Object.entries(variables)) {
  const ligne = `${cle}="${valeur}"`;
  const motif = new RegExp(`^${cle}=.*$`, 'm');
  contenu = motif.test(contenu) ? contenu.replace(motif, ligne) : `${contenu.trimEnd()}\n${ligne}`;
}
fs.writeFileSync(cheminEnv, contenu.trimStart(), 'utf8');

// --- 2. Logo / favicon SVG ---------------------------------------------------
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 48 48">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${couleur}"/>
      <stop offset="100%" stop-color="${couleur}" stop-opacity="0.78"/>
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="12" fill="url(#g)"/>
  <text x="24" y="32.5" text-anchor="middle" font-family="system-ui, Segoe UI, Roboto, sans-serif"
        font-size="${sigle.length > 1 ? 20 : 24}" font-weight="800" fill="#ffffff">${sigle}</text>
  <circle cx="37" cy="12" r="4" fill="${accent}"/>
  <rect x="9" y="34" width="10" height="4" rx="2" fill="${accent}" opacity="0.85"/>
</svg>
`;

for (const cible of ['app/icon.svg', 'public/icon.svg']) {
  const p = path.join(process.cwd(), cible);
  fs.writeFileSync(p, svg, 'utf8');
}

console.log(`
✅ Marque mise à jour
   Nom          : ${nom}
   Sigle / logo : ${sigle}
   Couleur      : ${couleur}   (accent ${accent})
   Fondateur    : ${fondateur}
${whatsapp ? `   WhatsApp     : ${whatsapp}\n` : ''}${email ? `   E-mail       : ${email}\n` : ''}${domaine ? `   Domaine      : ${domaine}\n` : ''}
   Fichiers     : .env.local · app/icon.svg · public/icon.svg
${reste.length ? `\n⚠️  A RENSEIGNER ENCORE :\n${reste.map((r) => `    ${r}`).join('\n')}\n` : ''}
⚠️  Pour la PRODUCTION, reportez ces variables dans Vercel :
    Project → Settings → Environment Variables (cochez Production + Preview),
    puis « Redeploy ». Sans cela, le site en ligne gardera l'ancienne marque.

💡 Vous voulez un logo dessiné par un graphiste ?
    Déposez votre fichier dans public/logo.svg puis ajoutez :
    NEXT_PUBLIC_BRAND_LOGO="/logo.svg"
`);
