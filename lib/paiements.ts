// =============================================================================
// MB Mustapha - PAIEMENTS & ABONNEMENTS EN FCFA
// -----------------------------------------------------------------------------
// Deux usages :
//   1. Le CLIENT FINAL paie une facture (Montant en FCFA) -> lien de paiement
//   2. Le CLIENT AFRIFLOW paie SON ABONNEMENT mensuel -> /abonnement
//
// Si aucun agregateur n'est configure (cas frequent au Tchad), on retombe sur
// le paiement MANUEL : le client envoie sur le numero marchand, saisit la
// reference, et vous validez en un clic depuis /admin.
// =============================================================================

import crypto from 'node:crypto';
import { COUNTRY_BY_CODE } from './config';
import { uid } from './utils';

export type InitierPaiementInput = {
  montant: number;
  devise: string; // XAF | XOF
  telephone?: string;
  description: string;
  reference?: string;
  pays?: string; // TD, CM, BJ, TG...
  factureId?: string;
  orgId?: string;
  returnUrl?: string;
};

export type ResultatPaiement = {
  provider: string;
  mode: 'EN_LIGNE' | 'MANUEL' | 'SIMULATION';
  url?: string;
  reference: string;
  instructions?: string;
  ussd?: string;
  message: string;
};

/** Codes USSD usuels par operateur (a confirmer aupres de l'operateur). */
export const USSD_CODES = [
  { pays: 'TD', operateur: 'Airtel Money Tchad', code: '*130#' },
  { pays: 'TD', operateur: 'Moov Africa Tchad', code: '*555#' },
  { pays: 'CM', operateur: 'MTN MoMo Cameroun', code: '*126#' },
  { pays: 'CM', operateur: 'Orange Money Cameroun', code: '#150*1#' },
  { pays: 'BJ', operateur: 'MTN MoMo Bénin', code: '*880#' },
  { pays: 'BJ', operateur: 'Moov Money Bénin', code: '*855#' },
  { pays: 'TG', operateur: 'T-Money (Togocom)', code: '*145#' },
  { pays: 'TG', operateur: 'Moov Money Togo', code: '*155#' },
  { pays: 'SN', operateur: 'Wave Sénégal', code: 'Application Wave' },
  { pays: 'CI', operateur: 'Orange Money CI', code: '#144#' },
];

export function ussdPour(pays?: string) {
  return USSD_CODES.filter((u) => u.pays === (pays || 'TD'));
}

/** Numero marchand manuel (affiche au client si pas d'agregateur). */
export function numeroMarchand() {
  return {
    numero: process.env.MANUAL_PAYMENT_NUMBER || '+235 66 00 00 00',
    nom: process.env.MANUAL_PAYMENT_NAME || 'MB Mustapha SAS',
  };
}

// ---------------------------------------------------------------------------
// Initiation d'un paiement
// ---------------------------------------------------------------------------
export async function initierPaiement(input: InitierPaiementInput): Promise<ResultatPaiement> {
  const reference = input.reference || `AF${Date.now().toString().slice(-8)}`;
  const country = COUNTRY_BY_CODE(input.pays || 'TD');

  try {
    const kkiapay = process.env.KIIAPAY_PRIVATE_KEY;
    const cinetpay = process.env.CINETPAY_API_KEY;
    const paydunya = process.env.PAYDUNYA_MASTER_KEY;
    const flutterwave = process.env.FLUTTERWAVE_SECRET_KEY;

    if (kkiapay) return await viaKkiapay(input, reference);
    if (cinetpay) return await viaCinetpay(input, reference);
    if (paydunya) return viaPaydunya(input, reference);
    if (flutterwave) return viaFlutterwave(input, reference);
  } catch (e) {
    console.error('[MB Mustapha] Paiement en ligne indisponible :', (e as Error).message);
  }

  // --- Repli : paiement manuel Mobile Money (essentiel au Tchad) -----------
  const marchand = numeroMarchand();
  const ussd = ussdPour(country.code)[0];
  return {
    provider: 'manuel',
    mode: 'MANUEL',
    reference,
    ussd: ussd?.code,
    instructions:
      `1) Envoyez ${input.montant.toLocaleString('fr-FR')} FCFA au ${marchand.numero} (${marchand.nom}).\n` +
      `2) Dans le menu « Paiement », saisissez la référence : ${reference}\n` +
      `3) Votre reçu arrive par WhatsApp/SMS dès validation (moins de 30 minutes en journée).\n` +
      (ussd ? `Astuce : composez ${ussd.code} sur votre téléphone (${ussd.operateur}).` : ''),
    message: 'Paiement Mobile Money manuel — instructions affichées au client.',
  };
}

// ---------------------------------------------------------------------------
// Kkiapay (Benin, Togo, CI, Niger, Senegal...) — https://docs.kkiapay.me
// ---------------------------------------------------------------------------
async function viaKkiapay(input: InitierPaiementInput, reference: string): Promise<ResultatPaiement> {
  const sandbox = process.env.KIIAPAY_SANDBOX !== 'false';
  const base = sandbox ? 'https://sandbox-api.kkiapay.me' : 'https://api.kkiapay.me';
  const res = await fetch(`${base}/api/v1/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-private-key': process.env.KIIAPAY_PRIVATE_KEY as string,
      'x-secret-key': process.env.KIIAPAY_SECRET as string,
    },
    body: JSON.stringify({
      amount: input.montant,
      reason: input.description,
      phone: input.telephone || '',
      data: reference,
      callback: input.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || ''}/paiement/succes`,
    }),
    signal: AbortSignal.timeout(12_000),
  });
  const json: any = await res.json().catch(() => ({}));
  const url = json?.paymentUrl || json?.url;
  return {
    provider: 'kkiapay',
    mode: url ? 'EN_LIGNE' : 'MANUEL',
    url,
    reference: json?.transactionId || reference,
    message: url
      ? 'Page de paiement Kkiapay ouverte — le client valide sur son téléphone.'
      : 'Kkiapay indisponible : repli sur le paiement manuel.',
  };
}

// ---------------------------------------------------------------------------
// CinetPay (Cameroun, CI, Senegal, Mali, Burkina...) — https://docs.cinetpay.com
// ---------------------------------------------------------------------------
async function viaCinetpay(input: InitierPaiementInput, reference: string): Promise<ResultatPaiement> {
  const base =
    process.env.CINETPAY_API_KEY?.startsWith('test') || process.env.CINETPAY_SANDBOX === 'true'
      ? 'https://api-checkout.cinetpay.com/v2'
      : 'https://api-checkout.cinetpay.com/v2';
  const res = await fetch(`${base}/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: reference,
      amount: input.montant,
      currency: input.devise,
      description: input.description,
      notify_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/webhooks/paiement`,
      return_url: input.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || ''}/paiement/succes`,
      channels: 'MOBILE_MONEY',
      lang: 'fr',
    }),
    signal: AbortSignal.timeout(12_000),
  });
  const json: any = await res.json().catch(() => ({}));
  const token = json?.data?.payment_token;
  const url = json?.data?.payment_url || (token ? `https://checkout.cinetpay.com/${token}?lang=fr` : undefined);
  return {
    provider: 'cinetpay',
    mode: url ? 'EN_LIGNE' : 'MANUEL',
    url,
    reference,
    message: url
      ? 'Page de paiement CinetPay ouverte (MTN MoMo / Orange Money).'
      : `CinetPay : ${json?.message || 'indisponible'} — repli sur le paiement manuel.`,
  };
}

// ---------------------------------------------------------------------------
// PayDunya & Flutterwave : modeles a completer avec vos cles
// ---------------------------------------------------------------------------
function viaPaydunya(input: InitierPaiementInput, reference: string): ResultatPaiement {
  const base = process.env.PAYDUNYA_SANDBOX === 'true' ? 'https://app.paydunya.com/sandbox-api/v1' : 'https://app.paydunya.com/api/v1';
  return {
    provider: 'paydunya',
    mode: 'MANUEL',
    reference,
    url: `${base}/checkout-invoice/create`,
    message:
      'PayDunya configuré : complétez l’appel API (lib/paiements.ts, fonction viaPaydunya) puis retirez ce repli. Les instructions de paiement manuel s’affichent en attendant.',
  };
}

function viaFlutterwave(input: InitierPaiementInput, reference: string): ResultatPaiement {
  return {
    provider: 'flutterwave',
    mode: 'MANUEL',
    reference,
    url: 'https://checkout.flutterwave.com/v3/hosted/pay',
    message:
      'Flutterwave configuré : ajoutez l’appel /v3/payments dans lib/paiements.ts. Repli manuel affiché en attendant.',
  };
}

// ---------------------------------------------------------------------------
// Verification des webhooks des agregateurs
// ---------------------------------------------------------------------------
/** Verifie la signature kkiapay (HMAC SHA-256 du corps avec votre secret). */
export function verifierKkiapay(corpsBrut: string, signature?: string | null): boolean {
  const secret = process.env.KIIAPAY_SECRET;
  if (!secret || !signature) return false;
  const attendu = crypto.createHmac('sha256', secret).update(corpsBrut).digest('hex');
  return attendu === signature;
}

/**
 * Verifie un paiement CinetPay (methode officielle : appel /v2/payment/check).
 * Renvoie true uniquement si CinetPay confirme le statut ACCEPTED.
 */
export async function verifierCinetpay(transactionId: string): Promise<boolean> {
  const apikey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;
  if (!apikey || !siteId) return false;
  try {
    const res = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apikey, site_id: siteId, transaction_id: transactionId }),
      signal: AbortSignal.timeout(10_000),
    });
    const json: any = await res.json().catch(() => ({}));
    return json?.data?.status === 'ACCEPTED';
  } catch {
    return false;
  }
}

/** Genere une reference de paiement lisible et unique. */
export function nouvelleReference(prefix = 'AF') {
  return `${prefix}-${uid().toUpperCase().slice(-8)}`;
}

// ---------------------------------------------------------------------------
// Liens de paiement partageables (WhatsApp) generes par MB Mustapha
// ---------------------------------------------------------------------------
export function lienPaiement(reference: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base}/paiement/${reference}`;
}

export function lienWhatsApp(telephone: string, message: string) {
  const tel = (telephone || '').replace(/[^0-9]/g, '');
  return `https://wa.me/${tel}?text=${encodeURIComponent(message)}`;
}

export function lienSMS(telephone: string, message: string) {
  const tel = (telephone || '').replace(/[^0-9]/g, '');
  return `sms:+${tel}?body=${encodeURIComponent(message)}`;
}
