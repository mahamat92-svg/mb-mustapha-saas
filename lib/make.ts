// =============================================================================
// MB Mustapha x MAKE.COM
// -----------------------------------------------------------------------------
// MB Mustapha envoie des evenements a Make (sortant) et Make peut appeler MB Mustapha
// (entrant). Chaque appel est signe en HMAC SHA-256 pour eviter les faux appels.
//
// Cote Make   : ajoutez le module "Webhook / Custom webhook" puis copiez l'URL.
// Cote MB Mustapha : collez cette URL dans les variables MAKE_WEBHOOK_*.
// =============================================================================

import crypto from 'node:crypto';
import { MAKE_SCENARIOS } from './config';
import { logWebhook } from './store';
import type { InvoiceRec, Organization, Stats, StockRec } from './types';

const SECRET = process.env.MAKE_WEBHOOK_SECRET || 'afriflow-make-secret-a-changer';

/** Signature HMAC SHA-256 (hex) du corps de la requete. */
export function signPayload(body: string, secret: string = SECRET): string {
  return crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');
}

/** Verifie une signature entrante (Make -> MB Mustapha). */
export function verifySignature(body: string, signature?: string | null): boolean {
  if (!signature) return false;
  const attendu = signPayload(body);
  const a = Buffer.from(attendu);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export type MakeScenarioId = 'relance' | 'stock' | 'paiement' | 'message' | 'rapport' | 'whatsapp-entrant';

/** URL du webhook Make correspondant au scenario. */
export function webhookUrl(scenario: MakeScenarioId): string | null {
  const map: Record<MakeScenarioId, string | undefined> = {
    relance: process.env.MAKE_WEBHOOK_RELANCE,
    stock: process.env.MAKE_WEBHOOK_STOCK,
    paiement: process.env.MAKE_WEBHOOK_PAIEMENT,
    message: process.env.MAKE_WEBHOOK_MESSAGE,
    rapport: process.env.MAKE_WEBHOOK_RAPPORT,
    'whatsapp-entrant': process.env.MAKE_WEBHOOK_GENERIC,
  };
  const url = map[scenario] || process.env.MAKE_WEBHOOK_GENERIC;
  return url && url.startsWith('http') ? url : null;
}

export function scenarioLabel(scenario: MakeScenarioId): string {
  return MAKE_SCENARIOS.find((s) => s.id === scenario)?.name || scenario;
}

export type MakeResult = {
  ok: boolean;
  envoyé?: boolean;
  simulated?: boolean;
  message: string;
  statusCode?: number;
  response?: string;
};

/**
 * Envoie un evenement a Make.
 * Si aucune URL n'est configuree, l'evenement est seulement JOURNALISE
 * (mode simulation) : l'application continue de fonctionner normalement.
 */
export async function envoyerAMake(
  scenario: MakeScenarioId,
  event: string,
  data: Record<string, unknown>,
  orgId?: string | null,
): Promise<MakeResult> {
  const payload = {
    source: 'afriflow',
    event,
    scenario: scenarioLabel(scenario),
    orgId: orgId || null,
    sentAt: new Date().toISOString(),
    data,
  };
  const body = JSON.stringify(payload);
  const url = webhookUrl(scenario);
  const preview = body.slice(0, 300);

  if (!url) {
    await logWebhook({
      orgId,
      direction: 'SORTANT',
      event,
      scenario: scenarioLabel(scenario),
      status: 'OK',
      statusCode: 0,
      payloadPreview: preview,
      error: 'Mode simulation : aucune URL Make.com configuree (MAKE_WEBHOOK_*)',
    });
    return {
      ok: true,
      simulated: true,
      message:
        'Mode simulation : événement enregistré dans le journal. Ajoutez MAKE_WEBHOOK_* pour un envoi réel vers Make.',
      statusCode: 0,
    };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-afriflow-event': event,
        'x-afriflow-signature': signPayload(body),
        'User-Agent': 'MB Mustapha/1.0 (+https://mbmustapha.com)',
      },
      body,
      // Make repond tres vite ; on ne bloque pas l'utilisateur trop longtemps.
      signal: AbortSignal.timeout(9000),
    });
    const texte = (await res.text()).slice(0, 500);
    await logWebhook({
      orgId,
      direction: 'SORTANT',
      event,
      scenario: scenarioLabel(scenario),
      status: res.ok ? 'OK' : 'ERREUR',
      statusCode: res.status,
      payloadPreview: preview,
      error: res.ok ? null : `Make a répondu ${res.status} : ${texte.slice(0, 200)}`,
    });
    return {
      ok: res.ok,
      envoyé: true,
      statusCode: res.status,
      response: texte,
      message: res.ok
        ? `Événement transmis à Make (${scenarioLabel(scenario)}) — HTTP ${res.status}.`
        : `Make a répondu ${res.status}. Vérifiez que le scénario est bien « ON ».`,
    };
  } catch (e) {
    const msg = (e as Error).message;
    await logWebhook({
      orgId,
      direction: 'SORTANT',
      event,
      scenario: scenarioLabel(scenario),
      status: 'ERREUR',
      statusCode: 0,
      payloadPreview: preview,
      error: msg,
    });
    return { ok: false, message: `Envoi vers Make impossible : ${msg}` };
  }
}

// ---------------------------------------------------------------------------
// Payloads prets a l'emploi pour les scenarios Make
// ---------------------------------------------------------------------------
export function payloadRelance(inv: InvoiceRec, org: Organization) {
  const reste = inv.total - inv.paid;
  return {
    facture: inv.number,
    client: inv.clientName,
    telephone: '', // a completer depuis la fiche client
    montantTotal: inv.total,
    montantPaye: inv.paid,
    resteAPayer: reste,
    devise: org.currency,
    echeance: inv.dueDate,
    joursDeRetard: Math.max(0, Math.round((Date.now() - new Date(inv.dueDate).getTime()) / 86_400_000)),
    entreprise: org.name,
    pays: org.countryName,
    // Message pret a envoyer par WhatsApp / SMS (Make n'a qu'a le copier)
    message: `Bonjour ${inv.clientName}, votre facture ${inv.number} chez ${org.name} présente un reste à payer de ${reste.toLocaleString('fr-FR')} ${org.currency === 'XOF' ? 'FCFA' : 'FCFA'}. Merci de régler via Mobile Money. Référence : ${inv.number}. MB Mustapha`,
  };
}

export function payloadStock(item: StockRec, org: Organization) {
  return {
    code: item.sku,
    article: item.name,
    quantite: item.qty,
    seuil: item.threshold,
    unite: item.unit,
    fournisseur: item.supplier,
    valeur: item.qty * item.price,
    devise: org.currency,
    entreprise: org.name,
    message: `ALERTE STOCK ${org.name} : ${item.name} (${item.sku}) n'est plus qu'à ${item.qty} ${item.unit} (seuil ${item.threshold}). Fournisseur : ${item.supplier}.`,
  };
}

export function payloadPaiement(input: {
  reference: string;
  montant: number;
  provider: string;
  telephone: string;
  facture?: string;
  statut: string;
}) {
  return {
    reference: input.reference,
    montant: input.montant,
    provider: input.provider,
    telephone: input.telephone,
    facture: input.facture || null,
    statut: input.statut,
    message: `Paiement ${input.statut} : ${input.montant.toLocaleString('fr-FR')} FCFA via ${input.provider} (réf. ${input.reference}). Merci !`,
  };
}

export function payloadRapport(stats: Stats, org: Organization) {
  return {
    entreprise: org.name,
    pays: org.countryName,
    chiffreAffaires: stats.chiffreAffaires,
    encaisse: stats.encaisse,
    impaye: stats.impaye,
    tauxRecouvrement: stats.tauxRecouvrement,
    facturesEnRetard: stats.facturesEnRetard,
    alertesStock: stats.alertesStock,
    message: `Rapport du jour — ${org.name}\n• Chiffre d'affaires : ${stats.chiffreAffaires.toLocaleString('fr-FR')} FCFA\n• Encaissé : ${stats.encaisse.toLocaleString('fr-FR')} FCFA\n• Impayé : ${stats.impaye.toLocaleString('fr-FR')} FCFA\n• Taux de recouvrement : ${stats.tauxRecouvrement}%\n• Factures en retard : ${stats.facturesEnRetard}\n• Alertes stock : ${stats.alertesStock}`,
  };
}

export function payloadMessage(channel: string, destinataires: string[], body: string) {
  return { canal: channel, destinataires, nombre: destinataires.length, message: body };
}

/** Extrait le resume lisible d'un evenement entrant (pour le journal). */
export function resumeEntrant(body: unknown): string {
  try {
    return JSON.stringify(body).slice(0, 280);
  } catch {
    return 'payload illisible';
  }
}
