import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { NAV_CLIENT } from '@/lib/nav';
import { getEleve, getOrganization, listEncaissements, listTranches } from '@/lib/store';
import { BadgeStatut, Card, Cellule, StatCard } from '@/components/ui';
import { BoutonImprimer } from '@/components/print-button';
import { RelanceParents } from '@/components/scolarite-forms';
import {
  joursDeRetard,
  messageRappelEcheance,
  messageRelanceRetard,
  situationEleve,
  statutTranche,
} from '@/lib/scolarite';
import { BRAND } from '@/lib/config';
import { fcfa, frDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const LIBELLE_STATUT: Record<string, string> = {
  PAYEE: 'Payée',
  PARTIELLE: 'Partielle',
  EN_RETARD: 'En retard',
  A_VENIR: 'À venir',
};

export default async function FicheEleve({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const eleve = await getEleve(id);
  if (!eleve) notFound();
  if (session.role !== 'OWNER' && eleve.orgId !== session.orgId) notFound();

  const [org, tranches, encaissements] = await Promise.all([
    getOrganization(eleve.orgId),
    listTranches(eleve.orgId, eleve.id),
    listEncaissements(eleve.orgId, eleve.id),
  ]);

  const situation = situationEleve(eleve, tranches);
  const numeroPaiement = org?.phone || BRAND.whatsapp;
  const nomEcole = org?.name || 'Votre établissement';

  const texteRelance = situation.montantEnRetard > 0
    ? messageRelanceRetard(situation, numeroPaiement, nomEcole)
    : messageRappelEcheance(situation, numeroPaiement, nomEcole);

  return (
    <DashboardShell
      nav={NAV_CLIENT}
      utilisateur={{ name: session.name, email: session.email, role: session.role }}
      contexte={`${nomEcole} — ${org?.city || ''}`}
    >
      <div className="grid gap-5">
        <div className="no-print flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/scolarite" className="text-sm text-ink-500 hover:text-ink-800">
              ← Retour aux frais scolaires
            </Link>
            <h1 className="titre-page mt-1">Fiche élève — {eleve.nom}</h1>
            <p className="sous-titre">
              {eleve.classe} · matricule {eleve.matricule} · parent : {eleve.parentNom} ({eleve.parentTelephone || 'téléphone manquant'})
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BoutonImprimer libelle="🖨️ Imprimer la situation" />
            <Link href="/scolarite" className="btn-ghost btn-sm">
              Encaisser un paiement
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Scolarité annuelle" valeur={fcfa(eleve.fraisAnnuels)} aide={eleve.inscriptionPayee ? 'Inscription réglée' : `Inscription due : ${fcfa(eleve.fraisInscription)}`} icone="🎓" />
          <StatCard label="Déjà payé" valeur={fcfa(situation.totalPaye)} icone="✅" ton="vert" />
          <StatCard label="Reste à payer" valeur={fcfa(situation.reste)} icone="🎯" />
          <StatCard
            label="Retard"
            valeur={fcfa(situation.montantEnRetard)}
            aide={situation.joursRetardMax ? `${situation.joursRetardMax} jour(s)` : 'aucun retard'}
            icone="⏰"
            ton={situation.montantEnRetard > 0 ? 'rouge' : 'neutre'}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
          {/* Document imprimable : la situation remise au parent */}
          <div className="card">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-200 pb-3">
              <div>
                <p className="text-lg font-extrabold text-ink-900">{nomEcole}</p>
                <p className="text-xs text-ink-500">
                  {org?.city} · {org?.countryName} · {org?.phone}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wide text-ink-500">Situation de scolarité</p>
                <p className="text-sm font-bold text-brand-700">{frDate(new Date())}</p>
                <p className="text-xs text-ink-500">Année scolaire {new Date().getFullYear() - 1}-{new Date().getFullYear()}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-1 text-sm">
              <p>
                <span className="text-ink-500">Élève : </span>
                <strong>{eleve.nom}</strong> ({eleve.sexe === 'F' ? 'fille' : 'garçon'}) — classe <strong>{eleve.classe}</strong>
              </p>
              <p>
                <span className="text-ink-500">Matricule : </span>
                {eleve.matricule}
              </p>
              <p>
                <span className="text-ink-500">Parent / tuteur : </span>
                {eleve.parentNom} — {eleve.parentTelephone}
              </p>
            </div>

            <div className="mt-4 scroll-x">
              <table className="table min-w-[520px]">
                <thead>
                  <tr className="bg-ink-50">
                    <th>Tranche</th>
                    <th>Échéance</th>
                    <th>Montant</th>
                    <th>Payé</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {tranches.map((t) => (
                    <tr key={t.id}>
                      <td className="text-sm">{t.libelle}</td>
                      <td className="whitespace-nowrap text-sm">
                        {frDate(t.echeance)}
                        {statutTranche(t) === 'EN_RETARD' && (
                          <span className="ml-1 text-xs font-bold text-rose-700">(+{joursDeRetard(t.echeance)} j)</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap text-sm">{fcfa(t.montant)}</td>
                      <td className="whitespace-nowrap text-sm text-brand-700">{fcfa(t.montantPaye)}</td>
                      <td className="text-sm">{LIBELLE_STATUT[statutTranche(t)]}</td>
                    </tr>
                  ))}
                  {!eleve.inscriptionPayee && (
                    <tr>
                      <td className="text-sm">Frais d’inscription</td>
                      <td className="text-sm">à l’inscription</td>
                      <td className="whitespace-nowrap text-sm">{fcfa(eleve.fraisInscription)}</td>
                      <td className="text-sm text-rose-700">0</td>
                      <td className="text-sm">Impayée</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-ink-50 font-bold">
                    <td colSpan={2}>Total</td>
                    <td className="whitespace-nowrap">{fcfa(situation.totalDu)}</td>
                    <td className="whitespace-nowrap text-brand-700">{fcfa(situation.totalPaye)}</td>
                    <td className="whitespace-nowrap">
                      Reste {fcfa(situation.reste)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-4 rounded-xl bg-ink-50 p-3 text-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-500">Moyens de paiement</p>
              <p className="mt-1 text-ink-700">
                Mobile Money au <strong>{numeroPaiement}</strong> (T-Money / Flooz) ou à la caisse de
                l’établissement. Un reçu numéroté est remis à chaque paiement.
              </p>
            </div>

            <div className="mt-4 border-t border-ink-200 pt-3 text-[10px] text-ink-500">
              Signature du parent : ______________________ · Cachet de l’établissement : ______________________
            </div>
          </div>

          <div className="no-print grid content-start gap-5">
            <Card titre="Prévenir le parent" sousTitre="Message prêt à envoyer — un clic, et c'est journalisé">
              <RelanceParents
                lignes={[
                  {
                    eleveId: eleve.id,
                    nom: eleve.nom,
                    classe: eleve.classe,
                    parentNom: eleve.parentNom,
                    telephone: eleve.parentTelephone,
                    montant: situation.montantEnRetard || situation.prochainMontant,
                    jours: situation.joursRetardMax,
                    texte: texteRelance,
                  },
                ]}
                numeroPaiement={numeroPaiement}
                type={situation.montantEnRetard > 0 ? 'retard' : 'rappel'}
              />
              <div className="mt-4 rounded-xl border border-ink-200 bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-ink-500">Texte du message</p>
                <p className="mt-2 whitespace-pre-line text-sm text-ink-700">{texteRelance}</p>
              </div>
            </Card>

            <Card titre={`Historique des paiements (${encaissements.length})`} sousTitre="Chaque reçu est numéroté et conservé">
              <div className="scroll-x">
                <table className="table min-w-[460px]">
                  <thead>
                    <tr className="bg-ink-50">
                      <th>Reçu</th>
                      <th>Date</th>
                      <th>Montant</th>
                      <th>Canal</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {encaissements.map((e) => (
                      <tr key={e.id}>
                        <td className="font-mono text-xs">{e.recu}</td>
                        <td className="whitespace-nowrap text-sm">{frDate(e.date)}</td>
                        <td className="whitespace-nowrap font-semibold">{fcfa(e.montant)}</td>
                        <td>
                          <BadgeStatut statut={e.canal === 'MOBILE_MONEY' ? 'REUSSI' : 'RECU'} />
                        </td>
                        <td className="text-xs text-ink-500">{e.note || '—'}</td>
                      </tr>
                    ))}
                    {!encaissements.length && (
                      <tr>
                        <td colSpan={5} className="py-5 text-center text-sm text-ink-500">
                          Aucun paiement enregistré pour cet élève.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card titre="À dire au parent (3 phrases qui marchent)">
              <ol className="grid gap-2 text-sm text-ink-600">
                <li>
                  <strong>1.</strong> « Votre enfant est en règle pour la {tranches.find((t) => statutTranche(t) === 'PAYEE')?.libelle || 'première tranche'} :
                  merci, c’est ce qui nous permet de payer les enseignants à temps. »
                </li>
                <li>
                  <strong>2.</strong> « Il reste {fcfa(situation.reste)} sur l’année. Vous pouvez régler{' '}
                  {fcfa(situation.prochainMontant)} par Mobile Money au {numeroPaiement}, sans vous déplacer. »
                </li>
                <li>
                  <strong>3.</strong> « Si le mois est difficile, dites-le nous : on étale. Ce qui compte, c’est que
                  l’enfant reste en classe. »
                </li>
              </ol>
            </Card>

            <Card titre="Rappel" sousTitre="Ce que ScolaPay a envoyé à la place de votre censeur">
              <Cellule
                principal={`${situation.tranches.filter((t) => t.statut === 'PAYEE').length} tranche(s) soldée(s)`}
                secondaire={`Prochaine échéance : ${
                  situation.prochaineEcheance ? frDate(situation.prochaineEcheance) + ' — ' + fcfa(situation.prochainMontant) : 'aucune'
                }`}
              />
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
