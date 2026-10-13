// =============================================================================
// POST /api/webhooks/paiement    (AGREGATEUR -> AFRIFLOW, ou MAKE -> AFRIFLOW)
// -----------------------------------------------------------------------------
// Callback appele par Kkiapay / CinetPay / PayDunya quand un client a paye.
// Configurez cette URL comme "notify_url" / "callback" chez votre agregateur :
//   https://votre-domaine.vercel.app/api/webhooks/paiement
//
// Deux voies possibles :
//   A. L'agregateur appelle directement MB Mustapha  (recommande si dispo)
//   B. L'agregateur appelle Make, qui verifie puis appelle
//      /api/v1/paiements avec votre cle API (plus robuste, voir blueprint 03)
// =============================================================================
import { erreur, handler, ok } from '@/lib/api';
import { createPayment, getInvoice, registerPayment, logWebhook } from '@/lib/store';
import { envoyerAMake, payloadPaiement } from '@/lib/make';
import { verifierCinetpay, verifierKkiapay } from '@/lib/paiements';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const POST = handler(async (req: Request) => {
  const corpsBrut = await req.text();
  let corps: any = {};
  try {
    corps = JSON.parse(corpsBrut || '{}');
  } catch {
    return erreur('Corps JSON invalide.');
  }

  const provider = (corps.provider || corps.operator || req.headers.get('x-provider') || 'mobile_money')
    .toString()
    .toLowerCase();
  const reference = corps.reference || corps.transactionId || corps.transaction_id || corps.cpay_txn_id || '';
  const montant = Math.round(Number(corps.montant ?? corps.amount ?? corps.cpay_amount ?? 0));
  const orgId = corps.orgId || corps.metadata?.orgId;
  const factureId = corps.factureId || corps.metadata?.factureId;
  const telephone = corps.telephone || corps.phone || corps.customer_phone || corps.cpay_phone_number;

  // --- Verification de l'authenticite de l'appel --------------------------
  let authentique = true;
  if (provider.includes('kkiapay')) {
    authentique = verifierKkiapay(corpsBrut, req.headers.get('x-kkiapay-signature'));
    if (!process.env.KIIAPAY_SECRET) authentique = true; // pas de secret configure : mode demo
  } else if (provider.includes('cinetpay')) {
    authentique = await verifierCinetpay(String(reference));
    if (!process.env.CINETPAY_API_KEY) authentique = true;
  }

  if (!authentique) {
    await logWebhook({
      direction: 'ENTRANT',
      event: 'paiement.callback',
      scenario: 'Callback agrégateur',
      status: 'ERREUR',
      statusCode: 401,
      payloadPreview: corpsBrut.slice(0, 200),
      error: 'Signature/statut non confirmé par l’agrégateur',
    });
    return erreur('Paiement non confirmé par l’agrégateur.', 401);
  }

  if (!orgId) {
    // Sans orgId on ne sait pas a qui crediter : on journalise et on repond OK
    await logWebhook({
      direction: 'ENTRANT',
      event: 'paiement.callback',
      scenario: 'Callback agrégateur',
      status: 'OK',
      statusCode: 200,
      payloadPreview: corpsBrut.slice(0, 260),
      error: 'orgId absent : impossible de créditer automatiquement',
    });
    return ok({ message: 'Callback reçu (orgId manquant : à mapper dans Make avec la référence).' });
  }

  const paiement = await createPayment({
    orgId,
    invoiceId: factureId || null,
    provider,
    amount: montant,
    currency: corps.currency || 'XAF',
    phone: telephone,
    reference: String(reference),
    status: 'REUSSI',
  });

  let facture = null;
  if (factureId) {
    facture = await getInvoice(factureId);
    await registerPayment(factureId, montant, provider);
  }

  // Recu automatique au client (WhatsApp + SMS via Make)
  await envoyerAMake(
    'paiement',
    'paiement.reussi',
    payloadPaiement({
      reference: String(reference),
      montant,
      provider,
      telephone: String(telephone || ''),
      facture: facture?.number,
      statut: 'Reçu ✔',
    }),
    orgId,
  );

  await logWebhook({
    orgId,
    direction: 'ENTRANT',
    event: 'paiement.callback',
    scenario: 'Callback agrégateur',
    status: 'OK',
    statusCode: 200,
    payloadPreview: corpsBrut.slice(0, 260),
  });

  return ok({
    paiement,
    facture,
    message: `Paiement ${reference} confirmé (${montant.toLocaleString('fr-FR')} FCFA via ${provider}).`,
  });
});

export async function GET() {
  return ok({ message: 'Callback paiement prêt. Configurez cette URL comme notify_url chez votre agrégateur.' });
}
