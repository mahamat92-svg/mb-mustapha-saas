#!/usr/bin/env node
// =============================================================================
// MB Mustapha - TEST DE LA CONNEXION MAKE.COM
// -----------------------------------------------------------------------------
// Simule ce que Make.com enverrait a votre application.
//
//   node scripts/make-test.mjs ping
//   node scripts/make-test.mjs paiement.reussi
//   node scripts/make-test.mjs client.cree
//   node scripts/make-test.mjs commande.whatsapp
//   node scripts/make-test.mjs tontine.cotisation
//   node scripts/make-test.mjs message.recu
//
// Options :
//   APP_URL=https://votre-app.vercel.app node scripts/make-test.mjs ping
// =============================================================================

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// --- Petit chargeur de .env.local (aucune dependance) -----------------------
function chargerEnv() {
  for (const fichier of ['.env.local', '.env']) {
    const chemin = path.join(process.cwd(), fichier);
    if (!fs.existsSync(chemin)) continue;
    for (const ligne of fs.readFileSync(chemin, 'utf8').split('\n')) {
      const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  }
}
chargerEnv();

const event = process.argv[2] || 'ping';
const orgId = process.argv[3] || process.env.TEST_ORG_ID || 'org_ndjamena';
const base = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const secret = process.env.MAKE_WEBHOOK_SECRET || 'afriflow-make-secret-a-changer';
const apiKey = process.env.AFRIFLOW_API_KEY || 'afk_live_changez_cette_cle';

// --- Corps de test selon l'evenement ---------------------------------------
const corpsParDefaut = {
  ping: { event: 'ping', data: { message: 'Test de connexion MB Mustapha ↔ Make' } },
  'paiement.reussi': {
    event: 'paiement.reussi',
    orgId,
    data: {
      factureId: process.env.TEST_FACTURE_ID || '',
      montant: 200000,
      provider: 'airtel',
      telephone: '+235 63 44 12 00',
      reference: `AM-${Date.now().toString().slice(-7)}`,
    },
  },
  'client.cree': {
    event: 'client.cree',
    orgId,
    data: { name: 'Nouveau client depuis WhatsApp', phone: '+235 99 00 11 22', city: 'N’Djaména', type: 'ENTREPRISE' },
  },
  'commande.whatsapp': {
    event: 'commande.whatsapp',
    orgId,
    data: { clientName: 'Client WhatsApp', montant: 125000, libelle: 'Commande : 5 cartons de lait', telephone: '+237 6 55 44 33 22' },
  },
  'tontine.cotisation': {
    event: 'tontine.cotisation',
    orgId,
    data: { tontineId: process.env.TEST_TONTINE_ID || '', membre: 'Mme Adjoa Kossi', montant: 25000, canal: 'MTN_MOMO' },
  },
  'message.recu': {
    event: 'message.recu',
    orgId,
    data: { canal: 'WHATSAPP', telephone: '+228 91 22 33 44', texte: 'Bonjour, je veux payer la scolarité de mon fils.' },
  },
};

const corps = corpsParDefaut[event] || { event, orgId, data: { message: 'Test générique' } };
const body = JSON.stringify(corps);
const signature = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');

console.log('─'.repeat(70));
console.log(`Evenement : ${event}`);
console.log(`Destination : ${base}/api/webhooks/make`);
console.log(`Organisation : ${orgId}`);
console.log('─'.repeat(70));

try {
  const res = await fetch(`${base}/api/webhooks/make`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'x-afriflow-event': event,
      'x-afriflow-signature': signature,
    },
    body,
  });
  const texte = await res.text();
  console.log(`HTTP ${res.status}`);
  try {
    console.log(JSON.stringify(JSON.parse(texte), null, 2));
  } catch {
    console.log(texte.slice(0, 800));
  }
  if (res.ok) {
    console.log('\n✅ La connexion fonctionne. Cote Make, utilisez la meme URL avec les MEMES en-tetes.');
  } else {
    console.log('\n⚠️ Echec. Verifiez AFRIFLOW_API_KEY et MAKE_WEBHOOK_SECRET (identiques des deux cotes).');
  }
} catch (e) {
  console.error('\n❌ Impossible de joindre l’application :', e.message);
  console.error('   Lancez d’abord « npm run dev » dans un autre terminal.');
}
