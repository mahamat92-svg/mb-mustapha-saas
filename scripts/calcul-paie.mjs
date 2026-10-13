#!/usr/bin/env node
// =============================================================================
//  VÉRIFICATION DU MOTEUR DE PAIE (CNPS / CNSS / IRPP / ITS)
// -----------------------------------------------------------------------------
//  Lance l'application puis :   node scripts/calcul-paie.mjs
//  Ou directement :             node scripts/calcul-paie.mjs https://mon-domaine.vercel.app
//
//  Le script interroge /api/v1/paie/verifier qui rejoue 4 cas réels (Cameroun,
//  Tchad, Bénin, Togo) et compare avec des résultats calculés à la main.
// =============================================================================

const base = (process.argv[2] || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');

console.log('─'.repeat(74));
console.log(`Vérification du moteur de paie — ${base}/api/v1/paie/verifier`);
console.log('─'.repeat(74));

try {
  const res = await fetch(`${base}/api/v1/paie/verifier`);
  const json = await res.json();

  if (!json.ok) {
    console.error('❌ Réponse inattendue :', JSON.stringify(json).slice(0, 400));
    process.exit(1);
  }

  for (const r of json.resultats) {
    console.log(`\n${r.conforme ? '✅' : '❌'} ${r.cas}`);
    console.log(
      `   brut ${r.calcul.brutTotal.toLocaleString('fr-FR')} · cotisations ${r.calcul.cotisations.toLocaleString('fr-FR')} · ` +
        `impôt ${r.calcul.impot.toLocaleString('fr-FR')}${r.calcul.cac ? ` + CAC ${r.calcul.cac.toLocaleString('fr-FR')}` : ''} · ` +
        `net ${r.calcul.net.toLocaleString('fr-FR')} · coût employeur ${r.calcul.coutEmployeur.toLocaleString('fr-FR')}`,
    );
    if (!r.conforme) {
      for (const e of r.ecarts) {
        console.log(`   ⚠️ ${e.champ} : attendu ${e.attendu.toLocaleString('fr-FR')}, obtenu ${e.obtenu.toLocaleString('fr-FR')}`);
      }
    }
    if (r.alertes?.length) console.log(`   ℹ️ ${r.alertes.join(' | ')}`);
  }

  console.log('\n' + '─'.repeat(74));
  console.log(`${json.resume.verdict} — ${json.resume.conformes}/${json.resume.total} cas conformes`);
  console.log(`Taux journalier pour un salaire de 150 000 FCFA/mois : ${json.outils.tauxJournalierPourMensuel150k.toLocaleString('fr-FR')} FCFA/jour`);
  console.log('\n' + json.note);
  process.exit(json.resume.echecs === 0 ? 0 : 2);
} catch (e) {
  console.error('❌ Impossible de joindre l’application :', e.message);
  console.error('   Lancez d’abord « npm run dev » dans un autre terminal.');
  process.exit(1);
}
