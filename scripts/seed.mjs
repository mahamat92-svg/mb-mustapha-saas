#!/usr/bin/env node
// =============================================================================
// MB Mustapha - REMPLISSAGE DE LA BASE DE DONNEES (seed)
// -----------------------------------------------------------------------------
// Usage :  DATABASE_URL="postgresql://..." node scripts/seed.mjs
//
// Cree :
//   - Vous (proprietaire du SaaS)  : patron@mbmustapha.com / patron2026
//   - 4 entreprises clientes de demonstration (Tchad, Cameroun, Benin, Togo)
//   - clients, factures, stock, tontines, abonnements, journal Make
//
// ⚠️ Changez les mots de passe apres la premiere connexion.
// =============================================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const J = (jours) => new Date(Date.now() + jours * 86_400_000);

async function main() {
  console.log('→ Nettoyage des anciennes donnees de demonstration...');
  await prisma.webhookLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.contribution.deleteMany();
  await prisma.tontine.deleteMany();
  await prisma.stockItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.client.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const motDePasse = await bcrypt.hash('patron2026', 10);
  const motDePasseClient = await bcrypt.hash('demo2026', 10);

  console.log('→ Creation du compte proprietaire...');
  await prisma.user.create({
    data: {
      name: 'Le Patron (vous)',
      email: 'patron@mbmustapha.com',
      password: motDePasse,
      phone: '+235 66 00 00 00',
      role: 'OWNER',
    },
  });

  const entreprises = [
    { id: 'org_ndjamena', name: 'N’Djaména Distribution SARL', country: 'TD', city: 'N’Djaména', currency: 'XAF', plan: 'PRO', planStatus: 'ACTIF', phone: '+235 66 12 34 56', contactEmail: 'demo@mbmustapha.com' },
    { id: 'org_douala', name: 'Douala Boutique Électronique', country: 'CM', city: 'Douala', currency: 'XAF', plan: 'BUSINESS', planStatus: 'ACTIF', phone: '+237 6 99 88 77 66', contactEmail: 'douala@mbmustapha.com' },
    { id: 'org_cotonou', name: 'Cotonou Njangi & Tontines', country: 'BJ', city: 'Cotonou', currency: 'XOF', plan: 'COOPERATIVE', planStatus: 'ACTIF', phone: '+229 97 45 12 30', contactEmail: 'cotonou@mbmustapha.com' },
    { id: 'org_lome', name: 'Lomé École Les Palmiers', country: 'TG', city: 'Lomé', currency: 'XOF', plan: 'STARTER', planStatus: 'ESSAI', phone: '+228 90 11 22 33', contactEmail: 'ecole@mbmustapha.com' },
  ];

  const prix = { DECOUVERTE: 0, STARTER: 9900, PRO: 24900, BUSINESS: 59900, COOPERATIVE: 149000 };

  console.log('→ Creation des entreprises clientes...');
  for (const e of entreprises) {
    await prisma.organization.create({ data: { ...e, vatRate: e.country === 'CM' ? 19.25 : 18 } });
    await prisma.subscription.create({
      data: {
        orgId: e.id,
        plan: e.plan,
        amount: prix[e.plan],
        currency: e.currency,
        provider: e.country === 'TD' ? 'manuel' : 'cinetpay',
        status: e.planStatus,
        renewAt: J(15),
      },
    });
    await prisma.user.create({
      data: {
        orgId: e.id,
        name: e.name,
        email: e.contactEmail,
        password: motDePasseClient,
        phone: e.phone,
        role: 'CLIENT_ADMIN',
      },
    });
  }

  console.log('→ Clients, factures, stock, tontines...');
  const clients = [
    { orgId: 'org_ndjamena', name: 'Boutique Al-Nour', phone: '+235 63 44 12 00', city: 'N’Djaména', type: 'ENTREPRISE' },
    { orgId: 'org_ndjamena', name: 'Restaurant Le Tchadien', phone: '+235 99 21 55 40', city: 'N’Djaména', type: 'ENTREPRISE' },
    { orgId: 'org_ndjamena', name: 'Hôtel Sahel', phone: '+235 66 78 90 12', city: 'Moundou', type: 'ENTREPRISE' },
    { orgId: 'org_douala', name: 'Supermarché Bonamoussadi', phone: '+237 6 77 12 34 56', city: 'Douala', type: 'ENTREPRISE' },
    { orgId: 'org_cotonou', name: 'Coopérative Dantokpa', phone: '+229 96 33 22 11', city: 'Cotonou', type: 'COOPERATIVE' },
    { orgId: 'org_lome', name: 'Parent d’élève — Kodjo', phone: '+228 91 22 33 44', city: 'Lomé', type: 'PARTICULIER' },
  ];
  for (const c of clients) await prisma.client.create({ data: c });

  const cree = await prisma.client.findMany();
  const parNom = (n) => cree.find((c) => c.name === n)?.id;

  const factures = [
    { orgId: 'org_ndjamena', number: 'FAC-2026-0001', clientId: parNom('Boutique Al-Nour'), label: 'Riz 50 sacs + huile 20 cartons', amount: 2500000, total: 2950000, paid: 2950000, status: 'PAYEE', dueDate: J(-90) },
    { orgId: 'org_ndjamena', number: 'FAC-2026-0002', clientId: parNom('Restaurant Le Tchadien'), label: 'Livraison sucre & lait', amount: 660000, total: 780000, paid: 200000, status: 'PARTIELLE', dueDate: J(-15) },
    { orgId: 'org_ndjamena', number: 'FAC-2026-0003', clientId: parNom('Hôtel Sahel'), label: 'Équipement climatisation', amount: 3491500, total: 4120000, paid: 0, status: 'IMPAYEE', dueDate: J(-8) },
    { orgId: 'org_douala', number: 'FAC-2026-0101', clientId: parNom('Supermarché Bonamoussadi'), label: 'Téléviseurs 12 unités', amount: 5408800, total: 6450000, paid: 6450000, status: 'PAYEE', dueDate: J(-30) },
    { orgId: 'org_cotonou', number: 'FAC-2026-0201', clientId: parNom('Coopérative Dantokpa'), label: 'Cotisations membres — lot 3', amount: 4800000, total: 4800000, paid: 4800000, status: 'PAYEE', dueDate: J(-40) },
    { orgId: 'org_lome', number: 'FAC-2026-0301', clientId: parNom('Parent d’élève — Kodjo'), label: 'Frais de scolarité 1er trimestre', amount: 185000, total: 185000, paid: 185000, status: 'PAYEE', dueDate: J(-2) },
  ];
  for (const f of factures) await prisma.invoice.create({ data: f });

  await prisma.stockItem.createMany({
    data: [
      { orgId: 'org_ndjamena', sku: 'RIZ-50K', name: 'Riz parfumé 50 kg', qty: 42, unit: 'sac', price: 27500, threshold: 15, supplier: 'Import N’Djaména' },
      { orgId: 'org_ndjamena', sku: 'HUI-20L', name: 'Huile végétale 20 L', qty: 8, unit: 'bidon', price: 19000, threshold: 12, supplier: 'SODECOTON' },
      { orgId: 'org_ndjamena', sku: 'SUC-25K', name: 'Sucre 25 kg', qty: 3, unit: 'sac', price: 16500, threshold: 10, supplier: 'CST Industries' },
      { orgId: 'org_douala', sku: 'TV-43', name: 'Téléviseur LED 43"', qty: 11, unit: 'pièce', price: 145000, threshold: 4, supplier: 'Import Douala Port' },
      { orgId: 'org_douala', sku: 'BAT-12V', name: 'Batterie solaire 12V', qty: 2, unit: 'pièce', price: 380000, threshold: 5, supplier: 'Solar Cameroon' },
    ],
  });

  const tontine = await prisma.tontine.create({
    data: { orgId: 'org_cotonou', name: 'Njangi Femmes Dantokpa', contribution: 25000, membersCount: 24, pot: 600000, beneficiary: 'Mme Adjoa Kossi', nextDate: J(6) },
  });
  await prisma.contribution.createMany({
    data: [
      { tontineId: tontine.id, member: 'Mme Adjoa Kossi', amount: 25000, channel: 'MTN_MOMO', status: 'RECU' },
      { tontineId: tontine.id, member: 'Mme Bintou Soglo', amount: 25000, channel: 'ESPECES', status: 'RECU' },
      { tontineId: tontine.id, member: 'M. Dossou Pierre', amount: 25000, channel: 'MOOV', status: 'RETARD' },
    ],
  });

  await prisma.webhookLog.createMany({
    data: [
      { orgId: 'org_ndjamena', direction: 'SORTANT', event: 'facture.en_retard', scenario: 'Relance des factures impayées', status: 'OK', statusCode: 200, payloadPreview: '{"invoice":"FAC-2026-0003"}' },
      { orgId: 'org_douala', direction: 'ENTRANT', event: 'paiement.reussi', scenario: 'Paiement Mobile Money → reçu', status: 'OK', statusCode: 200, payloadPreview: '{"reference":"CTPY-9912043"}' },
    ],
  });

  console.log('→ Employes (module Paie CNPS/CNSS + IRPP)...');
  await prisma.employe.createMany({
    data: [
      { orgId: 'org_ndjamena', nom: 'Abakar Mahamat', poste: 'Chef magasinier', type: 'MENSUEL', salaireBrut: 180000, transport: 25000, sursalaire: 20000, telephone: '+235 66 12 34 56' },
      { orgId: 'org_ndjamena', nom: 'Fatimé Hassan', poste: 'Caissière', type: 'MENSUEL', salaireBrut: 120000, transport: 15000, avances: 20000, telephone: '+235 63 77 88 99' },
      { orgId: 'org_ndjamena', nom: 'Ali Brahim', poste: 'Manutentionnaire (journalier)', type: 'JOURNALIER', tauxJour: 3000, telephone: '+235 99 45 67 21' },
      { orgId: 'org_douala', nom: 'Ngo Bassa Marie', poste: 'Comptable', type: 'MENSUEL', salaireBrut: 350000, transport: 30000, telephone: '+237 6 99 11 22 33' },
      { orgId: 'org_douala', nom: 'Tchoumi Paul', poste: 'Commercial', type: 'MENSUEL', salaireBrut: 180000, transport: 20000, sursalaire: 60000, telephone: '+237 6 77 44 55 66' },
      { orgId: 'org_douala', nom: 'Sandjo Alice', poste: 'Vendeuse (journalière)', type: 'JOURNALIER', tauxJour: 3500, telephone: '+237 6 90 12 34 56' },
      { orgId: 'org_cotonou', nom: 'Assogba Pierre', poste: 'Gérant', type: 'MENSUEL', salaireBrut: 220000, transport: 20000, sursalaire: 25000, telephone: '+229 97 11 22 33' },
      { orgId: 'org_lome', nom: 'Kodjo Ama', poste: 'Enseignante', type: 'MENSUEL', salaireBrut: 130000, transport: 15000, telephone: '+228 91 22 33 44' },
    ],
  });


  console.log('→ ScolaPay : eleves, echeanciers, encaissements (ecole de demonstration)...');
  const CLASSES = [
    { classe: 'CM2 A', frais: 120000, inscription: 15000 },
    { classe: '6e B', frais: 150000, inscription: 20000 },
    { classe: '3e A', frais: 180000, inscription: 25000 },
  ];
  const ENFANTS = [
    ['Kodjo Ama', 'F', 'M. Kodjo Yao', '+228 91 22 33 44'],
    ['Mensah Kwame', 'M', 'Mme Mensah Abla', '+228 90 55 66 77'],
    ['Adjovi Sena', 'F', 'M. Adjovi Kossi', '+228 91 77 88 99'],
    ['Tchalla Yao', 'M', 'Mme Tchalla Ama', '+228 92 11 22 33'],
    ['Bakari Fatou', 'F', 'M. Bakari Ibrahim', '+228 93 44 55 66'],
    ['Dossou Koffi', 'M', 'Mme Dossou Afi', '+228 90 88 77 66'],
    ['N’Guessan Aya', 'F', 'M. N’Guessan Paul', '+228 91 33 44 55'],
    ['Kponvi Selom', 'M', 'Mme Kponvi Akou', '+228 92 55 66 77'],
    ['Lawson Emefa', 'F', 'M. Lawson Dodji', '+228 93 12 34 56'],
    ['Amegan Kofi', 'M', 'Mme Amegan Yawa', '+228 90 22 33 44'],
    ['Sossou Abra', 'F', 'M. Sossou Komla', '+228 91 66 77 88'],
    ['Zoumarou Idriss', 'M', 'M. Zoumarou Ali', '+228 92 88 99 00'],
  ];
  let seqRecu = 1;
  for (let i = 0; i < ENFANTS.length; i++) {
    const [nom, sexe, parentNom, parentTelephone] = ENFANTS[i];
    const cfg = CLASSES[i % CLASSES.length];
    const eleve = await prisma.eleve.create({
      data: {
        orgId: 'org_lome',
        matricule: `2026-${101 + i}`,
        nom,
        sexe,
        classe: cfg.classe,
        parentNom,
        parentTelephone,
        fraisAnnuels: cfg.frais,
        fraisInscription: cfg.inscription,
        inscriptionPayee: i % 5 !== 4,
      },
    });

    // Echeancier : 3 tranches, la 1re est deja echue (il y a 2 mois)
    const arrondi = 500;
    const base = Math.floor(cfg.frais / 3 / arrondi) * arrondi;
    const montants = [base, base, cfg.frais - 2 * base];
    const tranches = [];
    for (let n = 1; n <= 3; n++) {
      tranches.push(
        await prisma.trancheEcolage.create({
          data: {
            orgId: 'org_lome',
            eleveId: eleve.id,
            numero: n,
            libelle: `${n === 1 ? '1re' : n === 2 ? '2e' : '3e'} tranche`,
            montant: montants[n - 1],
            echeance: J(-62 + (n - 1) * 91),
          },
        }),
      );
    }

    // Profils de paiement varies (comme dans le mode demonstration)
    const profil = i % 4;
    const versements = [];
    if (profil === 0) {
      versements.push([tranches[0], montants[0], 'ESPECES', -60], [tranches[1], montants[1], 'MOBILE_MONEY', -20]);
    } else if (profil === 1) {
      versements.push([tranches[0], Math.round(montants[0] * 0.6), 'MOBILE_MONEY', -55]);
    }
    for (const [tranche, montant, canal, jours] of versements) {
      await prisma.trancheEcolage.update({ where: { id: tranche.id }, data: { montantPaye: montant } });
      await prisma.encaissementEcolage.create({
        data: {
          orgId: 'org_lome',
          eleveId: eleve.id,
          trancheId: tranche.id,
          montant,
          canal,
          recu: `REC-2026-${String(seqRecu++).padStart(4, '0')}`,
          date: J(jours),
        },
      });
    }
    if (i % 5 !== 4) {
      await prisma.encaissementEcolage.create({
        data: {
          orgId: 'org_lome',
          eleveId: eleve.id,
          montant: cfg.inscription,
          canal: 'ESPECES',
          recu: `REC-2026-${String(seqRecu++).padStart(4, '0')}`,
          note: 'Frais d’inscription',
          date: J(-130),
        },
      });
    }
  }

  console.log('\n✅ Base remplie avec succès.\n');
  console.log('  Espace privé (vous)     : patron@mbmustapha.com / patron2026  (+ code ADMIN_PASSCODE)');
  console.log('  Client Tchad            : demo@mbmustapha.com / demo2026');
  console.log('  Client Cameroun         : douala@mbmustapha.com / demo2026');
  console.log('  Client Bénin            : cotonou@mbmustapha.com / demo2026');
  console.log('  École (ScolaPay)        : ecole@mbmustapha.com / demo2026  (12 élèves, échéanciers, encaissements)');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Erreur de remplissage :', e.message);
    console.error('   Verifiez DATABASE_URL et que « npx prisma db push » a bien ete execute.');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
