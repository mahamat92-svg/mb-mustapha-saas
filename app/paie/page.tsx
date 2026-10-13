import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { NAV_CLIENT } from '@/lib/nav';
import { getOrganization, listBulletins, listEmployes, synthesePaie } from '@/lib/store';
import { BadgeStatut, Card, Cellule, StatCard, Vide } from '@/components/ui';
import { GenererPaie, PointageJournalier, SimulateurSalaire } from '@/components/paie-forms';
import { COUNTRY_BY_CODE, PAIE_PARAMS_PAYS } from '@/lib/config';
import {
  PERIODE_COURANTE,
  PERIODE_PRECEDENTE,
  REGLES_PAIE,
  listPointagesPrixUtilise,
} from '@/lib/paie';
import { fcfa } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function Paie() {
  const session = await requireSession();
  const orgId = session.orgId!;
  const [org, employes, bulletins, synthese, pointages] = await Promise.all([
    getOrganization(orgId),
    listEmployes(orgId),
    listBulletins(orgId, PERIODE_PRECEDENTE),
    synthesePaie(orgId, PERIODE_PRECEDENTE),
    listPointagesPrixUtilise(orgId),
  ]);

  const paysCode = org?.country || 'CM';
  const pays = COUNTRY_BY_CODE(paysCode);
  const params = PAIE_PARAMS_PAYS(paysCode);
  const journaliers = employes.filter((e) => e.type === 'JOURNALIER');
  const masseSalariale = employes.reduce((s, e) => s + (e.type === 'MENSUEL' ? e.salaireBrut + e.sursalaire + e.transport : 0), 0);

  return (
    <DashboardShell
      nav={NAV_CLIENT}
      utilisateur={{ name: session.name, email: session.email, role: session.role }}
      contexte={`${org?.name || 'Mon entreprise'} — ${pays.flag} ${pays.name}`}
    >
      <div className="grid gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="titre-page">Paie — {params.pays}</h1>
            <p className="sous-titre">
              {params.organisme} + impôt sur les salaires calculés automatiquement, bulletins imprimables, coût
              réel de chaque employé.
            </p>
          </div>
          <Link href="/employes" className="btn-ghost">
            🧑‍🏭 Gérer les employés
          </Link>
        </div>

        {/* Avertissement de vérification : transparence assumée */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Vérifiez les taux une fois par an.</strong> Les cotisations et barèmes ci-dessous sont des
          valeurs de travail : faites-les confirmer par votre comptable ou directement auprès de{' '}
          {params.aVerifier}. Tout est modifiable dans <code>lib/config.ts → PAIE_PARAMS</code>.
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Employés" valeur={String(employes.filter((e) => e.actif).length)} aide={`${journaliers.length} journalier(s)`} icone="🧑‍🏭" />
          <StatCard label={`Masse salariale ${PERIODE_PRECEDENTE}`} valeur={fcfa(synthese.brutTotal || masseSalariale)} icone="💵" />
          <StatCard label="Net versé aux salariés" valeur={fcfa(synthese.netAPayer)} icone="🤝" ton="vert" />
          <StatCard
            label={`À déclarer (${params.organisme})`}
            valeur={fcfa(synthese.totalCNPS)}
            aide={`dont ${fcfa(synthese.cotisationsPatronales)} employeur`}
            icone="🏛️"
            ton="ambre"
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          {/* Bulletins */}
          <Card
            titre={`Bulletins de ${PERIODE_PRECEDENTE}`}
            sousTitre="Cliquez sur un employé pour imprimer son bulletin (à remettre ou à envoyer par WhatsApp)"
            action={<GenererPaie periodeDefaut={PERIODE_COURANTE} organisme={params.organisme} />}
          >
            {bulletins.length === 0 ? (
              <Vide
                message="Aucun bulletin pour ce mois. Lancez le calcul de la paie — cela prend quelques secondes."
                icone="👷"
              />
            ) : (
              <div className="scroll-x">
                <table className="table min-w-[820px]">
                  <thead>
                    <tr>
                      <th>Employé</th>
                      <th>Brut</th>
                      <th>{params.organisme}</th>
                      <th>Impôt</th>
                      <th>Net à payer</th>
                      <th>Coût employeur</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {bulletins.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <Cellule principal={b.employeNom} secondaire={`${b.poste}${b.joursTravailles ? ` · ${b.joursTravailles} j` : ''}`} />
                        </td>
                        <td className="whitespace-nowrap text-sm">{fcfa(b.brutTotal)}</td>
                        <td className="whitespace-nowrap text-sm text-rose-700">− {fcfa(b.totalCotisationsSalarie)}</td>
                        <td className="whitespace-nowrap text-sm text-rose-700">− {fcfa(b.impotTotal)}</td>
                        <td className="whitespace-nowrap font-bold text-brand-700">{fcfa(b.netAPayer)}</td>
                        <td className="whitespace-nowrap text-sm">{fcfa(b.coutEmployeur)}</td>
                        <td>
                          <Link href={`/paie/${b.id}`} className="btn-ghost btn-sm">
                            Bulletin
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-ink-50 font-bold">
                      <td>Total ({bulletins.length} bulletins)</td>
                      <td className="whitespace-nowrap">{fcfa(synthese.brutTotal)}</td>
                      <td className="whitespace-nowrap text-rose-700">− {fcfa(synthese.cotisationsSalarie)}</td>
                      <td className="whitespace-nowrap text-rose-700">− {fcfa(synthese.impots)}</td>
                      <td className="whitespace-nowrap text-brand-700">{fcfa(synthese.netAPayer)}</td>
                      <td className="whitespace-nowrap">{fcfa(synthese.coutEmployeur)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>

          <div className="grid content-start gap-5">
            {/* Déclaration CNPS */}
            <Card titre={`Préparer la déclaration ${params.organisme}`} sousTitre={`Période ${PERIODE_PRECEDENTE}`}>
              <ul className="grid gap-2 text-sm">
                <li className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2">
                  <span>Part salariale ({params.tauxSalarie}%)</span>
                  <strong>{fcfa(synthese.cotisationsSalarie)}</strong>
                </li>
                <li className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2">
                  <span>Part patronale ({params.tauxPatronal}%)</span>
                  <strong>{fcfa(synthese.cotisationsPatronales)}</strong>
                </li>
                <li className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2 text-amber-900">
                  <span className="font-semibold">Total à verser</span>
                  <strong>{fcfa(synthese.totalCNPS)}</strong>
                </li>
                <li className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2">
                  <span>Impôt sur salaires à déclarer</span>
                  <strong>{fcfa(synthese.impots)}</strong>
                </li>
              </ul>
              <p className="mt-3 text-xs text-ink-500">
                Plafond de cotisation : {fcfa(params.plafondSalarie)} par mois. Au-delà, la fraction n’est plus
                cotisable. Le coût total employeur du mois s’élève à <strong>{fcfa(synthese.coutEmployeur)}</strong>.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/messages" className="btn-ghost btn-sm">
                  Prévenir les salariés par SMS
                </Link>
                <Link href="/paiements" className="btn-ghost btn-sm">
                  Envoyer les salaires par Mobile Money
                </Link>
              </div>
            </Card>

            {/* Pointage journaliers */}
            <Card titre="Pointage des journaliers" sousTitre="Manutentionnaires, vendeuses, coursiers payés à la journée">
              <PointageJournalier employes={pointages} />
            </Card>

            {/* Barème */}
            <Card titre={`Barème appliqué — ${params.pays}`} sousTitre={params.aVerifier}>
              <div className="scroll-x">
                <table className="table min-w-[420px]">
                  <thead>
                    <tr className="bg-ink-50">
                      <th>Tranche de revenu mensuel</th>
                      <th>Taux marginal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {params.tranches.map((t, i) => (
                      <tr key={i}>
                        <td className="text-sm">
                          {t.jusqua === Infinity
                            ? `Au-delà de ${fcfa(params.tranches[i - 1]?.jusqua ?? 0)}`
                            : `${fcfa(i === 0 ? 0 : params.tranches[i - 1].jusqua)} → ${fcfa(t.jusqua)}`}
                        </td>
                        <td className="font-semibold">{t.taux}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="mt-3 space-y-1 text-xs text-ink-600">
                <li>• Cotisation salariale : {params.tauxSalarie}% (plafond {fcfa(params.plafondSalarie)})</li>
                {params.autresSalarie.map((a) => (
                  <li key={a.nom}>
                    • {a.nom} : {a.taux}% (plafond {fcfa(a.plafond ?? 0)})
                  </li>
                ))}
                <li>• Part patronale : {params.tauxPatronal}%</li>
                <li>• Abattement frais professionnels : {params.abattementImpot}%</li>
                {params.taxeCommunale > 0 && <li>• Centimes additionnels communaux : {params.taxeCommunale}% de l’impôt</li>}
                <li>• Transport exonéré jusqu’à {fcfa(REGLES_PAIE.transportExonerePlafond)} / mois</li>
                <li>• SMIG de référence : {fcfa(params.smig)} / mois</li>
              </ul>
            </Card>
          </div>
        </div>

        {/* Simulateur */}
        <Card
          titre="Simulateur brut → net"
          sousTitre="Pour négocier un salaire ou répondre à un employé qui demande « ça fait combien net ? »"
        >
          <SimulateurSalaire paysCode={paysCode} />
        </Card>

        {/* Récap employés */}
        <Card titre="Votre équipe" action={<Link href="/employes" className="btn-ghost btn-sm">Modifier</Link>}>
          <div className="scroll-x">
            <table className="table min-w-[720px]">
              <thead>
                <tr className="bg-ink-50">
                  <th>Employé</th>
                  <th>Poste</th>
                  <th>Type</th>
                  <th>Brut de base</th>
                  <th>Transport</th>
                  <th>Primes</th>
                  <th>Avances</th>
                  <th>État</th>
                </tr>
              </thead>
              <tbody>
                {employes.map((e) => (
                  <tr key={e.id}>
                    <td className="font-semibold">{e.nom}</td>
                    <td className="text-sm text-ink-600">{e.poste}</td>
                    <td>
                      <span className={e.type === 'JOURNALIER' ? 'badge-amber' : 'badge-blue'}>
                        {e.type === 'JOURNALIER' ? 'Journalier' : 'Mensuel'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      {e.type === 'MENSUEL' ? fcfa(e.salaireBrut) : `${fcfa(e.tauxJour)} / jour`}
                    </td>
                    <td className="whitespace-nowrap text-sm">{fcfa(e.transport)}</td>
                    <td className="whitespace-nowrap text-sm">{fcfa(e.sursalaire)}</td>
                    <td className="whitespace-nowrap text-sm text-rose-700">{fcfa(e.avances)}</td>
                    <td>{e.actif ? <BadgeStatut statut="ACTIF" /> : <BadgeStatut statut="SUSPENDU" />}</td>
                  </tr>
                ))}
                {employes.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-5 text-center text-sm text-ink-500">
                      Aucun employé enregistré. Commencez par ajouter votre équipe.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
