import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { NAV_CLIENT } from '@/lib/nav';
import { getBulletin, getOrganization } from '@/lib/store';
import { Card } from '@/components/ui';
import { BoutonImprimer } from '@/components/print-button';
import { PAIE_PARAMS_PAYS } from '@/lib/config';
import { fcfa, frDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

function libellePeriode(periode: string) {
  const [annee, mois] = periode.split('-');
  return `${MOIS[Number(mois) - 1] || mois} ${annee}`;
}

export default async function BulletinPaie({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const bulletin = await getBulletin(id);
  if (!bulletin) notFound();
  if (session.role !== 'OWNER' && bulletin.orgId !== session.orgId) notFound();

  const org = await getOrganization(bulletin.orgId);
  const params_paie = PAIE_PARAMS_PAYS(org?.country || 'CM');

  const gains = bulletin.lignes.filter((l) => l.nature === 'GAIN');
  const cotisations = bulletin.lignes.filter((l) => l.nature === 'COTISATION_SALARIE');
  const impots = bulletin.lignes.filter((l) => l.nature === 'IMPOT');
  const dedu= bulletin.lignes.filter((l) => l.nature === 'DEDUCTION');
  const patronales = bulletin.lignes.filter((l) => l.nature === 'COTISATION_PATRONALE');

  return (
    <DashboardShell
      nav={NAV_CLIENT}
      utilisateur={{ name: session.name, email: session.email, role: session.role }}
      contexte={org?.name || 'Mon entreprise'}
    >
      <div className="grid gap-5">
        <div className="no-print flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/paie" className="text-sm text-ink-500 hover:text-ink-800">
              ← Retour à la paie
            </Link>
            <h1 className="titre-page mt-1">
              Bulletin de paie — {bulletin.employeNom}
            </h1>
            <p className="sous-titre">
              {libellePeriode(bulletin.periode)} · {params_paie.organisme} · {params_paie.pays}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BoutonImprimer libelle="🖨️ Imprimer / PDF" />
            <Link href="/paie" className="btn-ghost btn-sm">
              Tous les bulletins
            </Link>
          </div>
        </div>

        {/* ------------------------- BULLETIN IMPRIMABLE ------------------------- */}
        <div className="card mx-auto w-full max-w-3xl">
          {/* En-tête */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-200 pb-4">
            <div>
              <p className="text-lg font-extrabold text-ink-900">{org?.name}</p>
              <p className="text-xs text-ink-500">
                {org?.city} · {org?.countryName} · {org?.phone}
              </p>
              <p className="text-xs text-ink-500">Employeur — NIF/RCCM : à compléter dans les paramètres</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-500">Bulletin de paie</p>
              <p className="text-lg font-extrabold text-brand-700">{libellePeriode(bulletin.periode)}</p>
              <p className="text-xs text-ink-500">Édité le {frDate(bulletin.createdAt)}</p>
              <p className="text-xs text-ink-500">Réf. {bulletin.id}</p>
            </div>
          </div>

          {/* Identité salarié */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-ink-500">Salarié</p>
              <p className="mt-1 font-bold text-ink-900">{bulletin.employeNom}</p>
              <p className="text-xs text-ink-500">{bulletin.poste}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-500">Période / base</p>
              <p className="mt-1 text-sm text-ink-700">
                {bulletin.joursTravailles !== null
                  ? `Travail à la journée — ${bulletin.joursTravailles} jour(s)`
                  : 'Salaire mensuel'}
              </p>
              <p className="text-xs text-ink-500">
                {params_paie.organisme} — plafond {fcfa(params_paie.plafondSalarie)}
              </p>
            </div>
          </div>

          {/* Tableau des lignes */}
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-700">Gains</p>
              <table className="table">
                <thead>
                  <tr className="bg-ink-50">
                    <th>Libellé</th>
                    <th className="text-right">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {gains.map((l) => (
                    <tr key={l.code}>
                      <td className="text-sm">{l.libelle}</td>
                      <td className="text-right font-semibold">{fcfa(l.montant)}</td>
                    </tr>
                  ))}
                  <tr className="bg-ink-50">
                    <td className="font-bold">Brut total</td>
                    <td className="text-right font-extrabold">{fcfa(bulletin.brutTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-rose-700">Retenues</p>
              <table className="table">
                <thead>
                  <tr className="bg-ink-50">
                    <th>Libellé</th>
                    <th className="text-right">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {cotisations.map((l) => (
                    <tr key={l.code}>
                      <td className="text-sm">
                        {l.libelle}
                        <span className="block text-[10px] text-ink-500">
                          {fcfa(l.base)} × {l.taux}%
                        </span>
                      </td>
                      <td className="text-right font-semibold">− {fcfa(l.montant)}</td>
                    </tr>
                  ))}
                  {impots
                    .filter((l) => l.code !== 'BASE_IMPOT')
                    .map((l) => (
                      <tr key={l.code}>
                        <td className="text-sm">{l.libelle}</td>
                        <td className="text-right font-semibold">− {fcfa(l.montant)}</td>
                      </tr>
                    ))}
                  {dedu.map((l) => (
                    <tr key={l.code}>
                      <td className="text-sm">{l.libelle}</td>
                      <td className="text-right font-semibold">− {fcfa(l.montant)}</td>
                    </tr>
                  ))}
                  <tr className="bg-ink-50">
                    <td className="font-bold">Total des retenues</td>
                    <td className="text-right font-extrabold text-rose-700">{fcfa(bulletin.totalCotisationsSalarie + bulletin.impotTotal + bulletin.avances)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Net à payer */}
          <div className="mt-5 rounded-xl2 border border-brand-300 bg-brand-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Net à payer</p>
                <p className="text-3xl font-extrabold text-brand-800">{fcfa(bulletin.netAPayer)}</p>
                <p className="text-xs text-ink-600">
                  Verse par Mobile Money ou espèces — reçu envoyé par SMS au salarié
                </p>
              </div>
              <div className="text-right text-xs text-ink-600">
                <p>
                  Brut imposable : <strong>{fcfa(bulletin.brutImposable)}</strong>
                </p>
                <p>
                  Base après abattement ({params_paie.abattementImpot}%) :{' '}
                  <strong>{fcfa(bulletin.lignes.find((l) => l.code === 'BASE_IMPOT')?.montant || 0)}</strong>
                </p>
                <p>
                  Total retenues : <strong>{fcfa(bulletin.totalCotisationsSalarie + bulletin.impotTotal)}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Coût employeur */}
          <div className="mt-4 rounded-xl bg-ink-50 p-3 text-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-500">Coût réel pour l’employeur</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
              <span>
                Brut versé : <strong>{fcfa(bulletin.brutTotal)}</strong>
              </span>
              <span>
                + {params_paie.organisme} patronal : <strong>{fcfa(bulletin.partPatronale)}</strong>
              </span>
              <span className="font-bold text-ink-900">= {fcfa(bulletin.coutEmployeur)}</span>
            </div>
            {patronales.map((l) => (
              <p key={l.code} className="mt-1 text-[10px] text-ink-500">
                {l.libelle} : {fcfa(l.base)} × {l.taux}%
              </p>
            ))}
          </div>

          {/* Pied de bulletin */}
          <div className="mt-5 border-t border-ink-200 pt-3 text-[10px] leading-relaxed text-ink-500">
            <p>
              Bulletin établi selon le barème {params_paie.pays} — {params_paie.aVerifier}. À faire vérifier par
              votre comptable (loi de finances en vigueur). Conservez ce document sans limitation de durée :
              il peut être demandé lors d’un contrôle de l’inspection du travail ou de {params_paie.organisme}.
            </p>
            <p className="mt-2">
              Signature employeur : ______________________ · Signature salarié : ______________________
            </p>
          </div>
        </div>

        {/* Alertes du calcul */}
        {bulletin.alertes.length > 0 && (
          <Card className="no-print mx-auto w-full max-w-3xl" titre="Points à vérifier sur ce bulletin">
            <ul className="space-y-2 text-sm text-amber-800">
              {bulletin.alertes.map((a) => (
                <li key={a} className="rounded-xl bg-amber-50 px-3 py-2">
                  ⚠️ {a}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Détail pédagogique */}
        <Card
          className="no-print mx-auto w-full max-w-3xl"
          titre="Comprendre le calcul (utile pour expliquer au salarié)"
          sousTitre={`Barème ${params_paie.pays} — ${params_paie.organisme}`}
        >
          <ol className="space-y-2 text-sm text-ink-600">
            <li>
              <strong>1.</strong> On part du brut total ({fcfa(bulletin.brutTotal)}), transport exonéré inclus
              jusqu’à 30 000 FCFA.
            </li>
            <li>
              <strong>2.</strong> On retire la cotisation salariale {params_paie.organisme} ({params_paie.tauxSalarie}
              %, plafonnée à {fcfa(params_paie.plafondSalarie)}) : {fcfa(bulletin.totalCotisationsSalarie)}.
            </li>
            <li>
              <strong>3.</strong> On applique l’abattement pour frais professionnels de {params_paie.abattementImpot}% :
              la base imposable devient {fcfa(bulletin.lignes.find((l) => l.code === 'BASE_IMPOT')?.montant || 0)}.
            </li>
            <li>
              <strong>4.</strong> On calcule l’impôt par tranches progressives
              {params_paie.taxeCommunale > 0 ? ` + ${params_paie.taxeCommunale}% de centimes communaux` : ''} :{' '}
              {fcfa(bulletin.impotTotal)}.
            </li>
            <li>
              <strong>5.</strong> Net à payer = brut − cotisations − impôt − avances ={' '}
              <strong>{fcfa(bulletin.netAPayer)}</strong>.
            </li>
            <li>
              <strong>6.</strong> À cela s’ajoute la part patronale ({params_paie.tauxPatronal}%) que l’entreprise
              verse en plus : coût total {fcfa(bulletin.coutEmployeur)}.
            </li>
          </ol>
        </Card>
      </div>
    </DashboardShell>
  );
}
