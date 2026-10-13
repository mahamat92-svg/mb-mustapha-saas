import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { NAV_CLIENT } from '@/lib/nav';
import { getOrganization, listEmployes } from '@/lib/store';
import { BadgeStatut, Card, StatCard } from '@/components/ui';
import { NouvelEmployeForm } from '@/components/paie-forms';
import { COUNTRY_BY_CODE, PAIE_PARAMS_PAYS } from '@/lib/config';
import { REGLES_PAIE, calculerBulletin, tauxJournalierDepuisMensuel } from '@/lib/paie';
import { fcfa, frDate, initials } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function Employes() {
  const session = await requireSession();
  const orgId = session.orgId!;
  const [org, employes] = await Promise.all([getOrganization(orgId), listEmployes(orgId)]);
  const paysCode = org?.country || 'CM';
  const pays = COUNTRY_BY_CODE(paysCode);
  const params = PAIE_PARAMS_PAYS(paysCode);

  const coutTotal = employes
    .filter((e) => e.actif)
    .reduce((s, e) => {
      const r = calculerBulletin({
        pays: paysCode,
        type: e.type,
        salaireBrut: e.salaireBrut,
        tauxJour: e.tauxJour,
        joursTravailles: e.type === 'JOURNALIER' ? REGLES_PAIE.joursOuvresMois : 0,
        transport: e.transport,
        sursalaire: e.sursalaire,
      });
      return s + r.coutEmployeur;
    }, 0);

  return (
    <DashboardShell
      nav={NAV_CLIENT}
      utilisateur={{ name: session.name, email: session.email, role: session.role }}
      contexte={`${org?.name || 'Mon entreprise'} — ${pays.flag} ${pays.name}`}
    >
      <div className="grid gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="titre-page">Employés & pointage</h1>
            <p className="sous-titre">
              Fiche de chaque salarié (mensuel ou journalier), avances, primes et transport. Le calcul{' '}
              {params.organisme} + impôt se fait automatiquement dans le module Paie.
            </p>
          </div>
          <Link href="/paie" className="btn-primary">
            👷 Aller à la paie
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Effectif actif" valeur={String(employes.filter((e) => e.actif).length)} icone="🧑‍🏭" />
          <StatCard label="Jouraliers" valeur={String(employes.filter((e) => e.type === 'JOURNALIER').length)} aide="payés à la journée" icone="📅" ton="ambre" />
          <StatCard label="Coût employeur / mois" valeur={fcfa(coutTotal)} aide="charges patronales incluses" icone="💵" ton="rouge" />
          <StatCard label="Avances en cours" valeur={fcfa(employes.reduce((s, e) => s + e.avances, 0))} icone="⏳" />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <Card titre="Votre équipe" sousTitre="Ces fiches alimentent le calcul de paie et les bulletins">
            <div className="scroll-x">
              <table className="table min-w-[760px]">
                <thead>
                  <tr className="bg-ink-50">
                    <th>Employé</th>
                    <th>Poste</th>
                    <th>Rémunération</th>
                    <th>Transport</th>
                    <th>Primes</th>
                    <th>Avances</th>
                    <th>Embauche</th>
                    <th>État</th>
                  </tr>
                </thead>
                <tbody>
                  {employes.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                            {initials(e.nom)}
                          </span>
                          <div>
                            <div className="font-semibold text-ink-800">{e.nom}</div>
                            <div className="text-xs text-ink-500">{e.telephone || 'téléphone non renseigné'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm text-ink-600">{e.poste}</td>
                      <td className="whitespace-nowrap">
                        {e.type === 'MENSUEL' ? (
                          <>
                            {fcfa(e.salaireBrut)}
                            <span className="block text-[10px] text-ink-500">
                              soit {fcfa(tauxJournalierDepuisMensuel(e.salaireBrut))} / jour
                            </span>
                          </>
                        ) : (
                          <>
                            {fcfa(e.tauxJour)} / jour
                            <span className="block text-[10px] text-ink-500">
                              ≈ {fcfa(e.tauxJour * REGLES_PAIE.joursOuvresMois)} / mois
                            </span>
                          </>
                        )}
                      </td>
                      <td className="whitespace-nowrap text-sm">{fcfa(e.transport)}</td>
                      <td className="whitespace-nowrap text-sm">{fcfa(e.sursalaire)}</td>
                      <td className="whitespace-nowrap text-sm text-rose-700">{fcfa(e.avances)}</td>
                      <td className="whitespace-nowrap text-xs text-ink-500">{frDate(e.dateEmbauche)}</td>
                      <td>{e.actif ? <BadgeStatut statut="ACTIF" /> : <BadgeStatut statut="SUSPENDU" />}</td>
                    </tr>
                  ))}
                  {employes.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-sm text-ink-500">
                        Aucun employé. Ajoutez les membres de votre équipe pour préparer la paie.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid content-start gap-5">
            <Card titre="Ajouter un employé" sousTitre="Le net à payer et le coût réel s’affichent avant l’enregistrement">
              <NouvelEmployeForm paysCode={paysCode} />
            </Card>

            <Card titre={`Rappels ${params.pays}`}>
              <ul className="space-y-2 text-sm text-ink-600">
                <li>
                  • SMIG de référence : <strong>{fcfa(params.smig)}</strong> / mois (à vérifier).
                </li>
                <li>
                  • Cotisation salariale {params.organisme} : {params.tauxSalarie}%, plafond{' '}
                  {fcfa(params.plafondSalarie)}.
                </li>
                <li>
                  • Indemnité de transport exonérée jusqu’à {fcfa(REGLES_PAIE.transportExonerePlafond)}.
                </li>
                <li>• Un bulletin doit rester archivé : conservez les PDF, l’inspection peut les demander.</li>
                <li>
                  • Un journalier qui travaille 26 jours par mois coûte le même brut qu’un mensuel au SMIG : le
                  pointage évite les contestations.
                </li>
              </ul>
              <p className="mt-3 text-xs text-ink-500">
                Barèmes à faire confirmer auprès de {params.aVerifier}.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
