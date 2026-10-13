// =============================================================================
// GET /api/v1/paie/verifier
// -----------------------------------------------------------------------------
// BATTERIE DE TESTS du moteur de paie : vérifie que les calculs correspondent
// à des valeurs attendues, calculées à la main pour les 4 pays.
// Aucune donnée n'est lue ni écrite : c'est un simple contrôle de cohérence
// (utile après avoir modifié un barème dans lib/config.ts).
//
// Utilisation :  npm run test:paie     (ou ouvrir l'URL dans le navigateur)
// =============================================================================
import { ok } from '@/lib/api';
import { calculerBulletin, tauxJournalierDepuisMensuel } from '@/lib/paie';

export const dynamic = 'force-dynamic';

type Attendu = Record<string, number>;

type Cas = {
  nom: string;
  entree: Parameters<typeof calculerBulletin>[0];
  attendu: Attendu;
};

// --- Cas de test (le brut, les retenues et le net sont vérifiables à la main) --
const CAS: Cas[] = [
  {
    nom: 'Cameroun — mensuel 200 000 FCFA + 20 000 de transport (CNPS 4,2% + crédit foncier 1%)',
    entree: { pays: 'CM', type: 'MENSUEL', salaireBrut: 200_000, transport: 20_000 },
    attendu: {
      brutTotal: 220_000,
      totalCotisationsSalarie: 10_400, // 4,2% × 200 000 + 1% × 200 000
      impotTotal: 16_059, // IRPP 14 599 (11% sur 132 720 après abattement 30%) + CAC 1 460
      netAPayer: 193_541,
      coutEmployeur: 252_400, // + 16,2% patronal = 32 400
    },
  },
  {
    nom: 'Tchad — journalier 24 jours × 3 000 FCFA (CNPS 3,5%, tranche à 0%)',
    entree: { pays: 'TD', type: 'JOURNALIER', tauxJour: 3_000, joursTravailles: 24 },
    attendu: {
      brutTotal: 72_000,
      totalCotisationsSalarie: 2_520, // 3,5% × 72 000
      impotTotal: 0, // sous la première tranche imposable
      netAPayer: 69_480,
      coutEmployeur: 83_880, // + 16,5% patronal
    },
  },
  {
    nom: 'Bénin — mensuel 220 000 + primes 25 000 + transport 20 000 (CNSS plafonnée à 208 333)',
    entree: { pays: 'BJ', type: 'MENSUEL', salaireBrut: 220_000, sursalaire: 25_000, transport: 20_000 },
    attendu: {
      brutTotal: 265_000,
      totalCotisationsSalarie: 7_500, // 3,6% × 208 333 (plafond)
      impotTotal: 13_000, // ITS 10% sur la part 60 000 → 200 000
      netAPayer: 244_500,
      coutEmployeur: 297_083, // + 15,4% patronal sur 208 333 (plafond patronal atteint)
    },
  },
  {
    nom: 'Togo — mensuel 85 000 + transport 10 000, avance de 5 000 déjà versée',
    entree: { pays: 'TG', type: 'MENSUEL', salaireBrut: 85_000, transport: 10_000, avances: 5_000 },
    attendu: {
      brutTotal: 95_000,
      totalCotisationsSalarie: 3_400, // 4% × 85 000
      impotTotal: 528, // 10% sur la fraction au-dessus de 60 000
      netAPayer: 86_072, // avance déduite
      coutEmployeur: 109_875,
    },
  },
];

export const GET = () => {
  const resultats = CAS.map((cas) => {
    const calcul = calculerBulletin(cas.entree);
    const ecarts: { champ: string; attendu: number; obtenu: number }[] = [];
    for (const [champ, attendu] of Object.entries(cas.attendu)) {
      const obtenu = (calcul as unknown as Record<string, number>)[champ];
      if (obtenu !== attendu) ecarts.push({ champ, attendu, obtenu });
    }
    return {
      cas: cas.nom,
      conforme: ecarts.length === 0,
      ecarts,
      calcul: {
        brutTotal: calcul.brutTotal,
        brutalImposable: calcul.brutImposable,
        cotisations: calcul.totalCotisationsSalarie,
        baseImpot: calcul.baseImpot,
        impot: calcul.impotBrut,
        cac: calcul.taxeCommunale,
        net: calcul.netAPayer,
        coutEmployeur: calcul.coutEmployeur,
      },
      alertes: calcul.alertes,
    };
  });

  const echecs = resultats.filter((r) => !r.conforme);

  return ok({
    resume: {
      total: resultats.length,
      conformes: resultats.length - echecs.length,
      echecs: echecs.length,
      verdict: echecs.length === 0 ? '✅ Tous les calculs sont conformes' : '❌ Écart détecté',
    },
    outils: {
      tauxJournalierPourMensuel150k: tauxJournalierDepuisMensuel(150_000),
    },
    resultats,
    note:
      'Ces tests vérifient la MÉTHODE de calcul (cotisations plafonnées, abattement, tranches, taxe communale, part patronale). Les taux eux-mêmes doivent être confirmés chaque année auprès de la CNPS/CNSS et de la direction des impôts.',
  });
};
