import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { NAV_CLIENT } from '@/lib/nav';
import { getOrganization, listEleves, listEncaissements, listTranches } from '@/lib/store';
import { BadgeStatut, Barre, Card, Cellule, StatCard, Vide } from '@/components/ui';
import { EncaissementRapide, InscriptionEleveForm, RelanceParents } from '@/components/scolarite-forms';
import {
  REGLES_SCOLAIRE,
  messageRappelEcheance,
  messageRelanceRetard,
  situationEleve,
  syntheseEcole,
} from '@/lib/scolarite';
import { BRAND } from '@/lib/config';
import { fcfa, frDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function Scolarite() {
  const session = await requireSession();
  const orgId = session.orgId!;
  const [org, eleves, tranches, encaissements] = await Promise.all([
    getOrganization(orgId),
    listEleves(orgId),
    listTranches(orgId),
    listEncaissements(orgId),
  ]);

  const synthese = syntheseEcole(eleves, tranches, encaissements);
  const numeroPaiement = org?.phone || BRAND.whatsapp;
  const nomEcole = org?.name || 'Votre établissement';
  const classes = Array.from(new Set(eleves.map((e) => e.classe))).sort();

  const lignesRetard = synthese.aRelancer.map((s) => ({
    eleveId: s.eleveId,
    nom: s.nom,
    classe: s.classe,
    parentNom: s.parentNom,
    telephone: s.parentTelephone,
    montant: s.montantEnRetard,
    jours: s.joursRetardMax,
    texte: messageRelanceRetard(s, numeroPaiement, nomEcole),
  }));

  const lignesRappel = synthese.echeancesProches.map((s) => ({
    eleveId: s.eleveId,
    nom: s.nom,
    classe: s.classe,
    parentNom: s.parentNom,
    telephone: s.parentTelephone,
    montant: s.prochainMontant,
    jours: 0,
    texte: messageRappelEcheance(s, numeroPaiement, nomEcole),
  }));

  const pourEncaissement = eleves
    .map((e) => {
      const s = situationEleve(e, tranches);
      return { id: e.id, nom: e.nom, classe: e.classe, reste: s.reste, prochain: s.prochainMontant };
    })
    .sort((a, b) => b.reste - a.reste);

  const recents = [...encaissements].slice(0, 8);
  const nomDe = (id: string) => eleves.find((e) => e.id === id)?.nom || 'Élève';

  return (
    <DashboardShell
      nav={NAV_CLIENT}
      utilisateur={{ name: session.name, email: session.email, role: session.role }}
      contexte={`${nomEcole} — ${org?.city || ''}`}
    >
      <div className="grid gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="titre-page">ScolaPay — frais scolaires</h1>
            <p className="sous-titre">
              Qui a payé, qui doit encore, et un message prêt à envoyer à chaque parent. Les tranches se créent
              automatiquement à l’inscription.
            </p>
          </div>
          <Link href="/messages" className="btn-ghost">
            💬 Journal des messages
          </Link>
        </div>

        {eleves.length === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>Aucun élève enregistré sur ce compte.</strong> ScolaPay est prévu pour les écoles, collèges et
            centres de formation : créez un compte école, ou testez tout de suite avec le compte de démonstration{' '}
            <code>ecole@mbmustapha.com / demo2026</code> (« Lomé École Les Palmiers »).
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Élèves inscrits" valeur={String(synthese.nbEleves)} aide={`${classes.length} classe(s)`} icone="🎓" />
          <StatCard label="Encaissé (année)" valeur={fcfa(synthese.totalEncaisse)} aide={`taux ${synthese.tauxRecouvrement} %`} icone="💰" ton="vert" />
          <StatCard label="Reste à recouvrer" valeur={fcfa(synthese.resteARecouvrer)} aide={`sur ${fcfa(synthese.totalDu)} attendus`} icone="🎯" />
          <StatCard
            label="En retard"
            valeur={fcfa(synthese.montantEnRetard)}
            aide={`${synthese.nbElevesEnRetard} élève(s) à relancer`}
            icone="⏰"
            ton="rouge"
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <Card
            titre="À relancer en priorité"
            sousTitre="Trié du plus gros retard au plus petit — le message est déjà écrit"
          >
            <RelanceParents
              lignes={lignesRetard}
              numeroPaiement={numeroPaiement}
              type="retard"
              messageVide={`Aucun impayé en retard : tous les parents sont à jour. Envoyez-leur un message de remerciement, ça fait rentrer encore plus vite.`}
            />
          </Card>

          <div className="grid content-start gap-5">
            <Card titre="Encaisser un paiement" sousTitre="Reçu numéroté + message au parent immédiatement">
              <EncaissementRapide eleves={pourEncaissement} />
            </Card>

            <Card
              titre={`Échéances dans ${REGLES_SCOLAIRE.joursAvantRappel} jours`}
              sousTitre="Prévenez avant l'échéance : c'est ce qui évite le retard"
            >
              <RelanceParents
                lignes={lignesRappel}
                numeroPaiement={numeroPaiement}
                type="rappel"
                messageVide="Aucune échéance proche pour le moment."
              />
            </Card>
          </div>
        </div>

        <Card titre="Par classe" sousTitre="Le directeur voit en un coup d'œil la classe qui rapporte le mieux">
          <div className="scroll-x">
            <table className="table min-w-[720px]">
              <thead>
                <tr className="bg-ink-50">
                  <th>Classe</th>
                  <th>Élèves</th>
                  <th>Attendu</th>
                  <th>Encaissé</th>
                  <th>Reste</th>
                  <th>Recouvrement</th>
                  <th>En retard</th>
                </tr>
              </thead>
              <tbody>
                {synthese.parClasse.map((c) => (
                  <tr key={c.classe}>
                    <td className="font-semibold text-ink-800">{c.classe}</td>
                    <td>{c.nbEleves}</td>
                    <td className="whitespace-nowrap text-sm">{fcfa(c.du)}</td>
                    <td className="whitespace-nowrap text-sm text-brand-700">{fcfa(c.encaisse)}</td>
                    <td className="whitespace-nowrap text-sm">{fcfa(c.reste)}</td>
                    <td className="w-40">
                      <Barre valeur={c.du ? Math.round((c.encaisse / c.du) * 100) : 0} />
                      <span className="text-[11px] text-ink-500">
                        {c.du ? Math.round((c.encaisse / c.du) * 100) : 0} %
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-sm text-rose-700">{fcfa(c.retard)}</td>
                  </tr>
                ))}
                {!synthese.parClasse.length && (
                  <tr>
                    <td colSpan={7} className="py-5 text-center text-sm text-ink-500">
                      Aucune classe : inscrivez vos premiers élèves.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <Card titre="Inscrire un élève" sousTitre="L'échéancier du parent est généré automatiquement">
            <InscriptionEleveForm classesSuggerees={classes} />
          </Card>

          <Card titre="Derniers encaissements" sousTitre={`Reçus numérotés — ${fcfa(synthese.encaisseMoisCourant)} encaissés ce mois-ci`}>
            {recents.length === 0 ? (
              <Vide message="Aucun encaissement pour le moment." icone="💰" />
            ) : (
              <div className="scroll-x">
                <table className="table min-w-[620px]">
                  <thead>
                    <tr className="bg-ink-50">
                      <th>Reçu</th>
                      <th>Élève</th>
                      <th>Montant</th>
                      <th>Canal</th>
                      <th>Date</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {recents.map((e) => (
                      <tr key={e.id}>
                        <td className="font-mono text-xs">{e.recu}</td>
                        <td>
                          <Cellule principal={nomDe(e.eleveId)} secondaire={e.note || ''} />
                        </td>
                        <td className="whitespace-nowrap font-bold">{fcfa(e.montant)}</td>
                        <td>
                          <BadgeStatut statut={e.canal === 'MOBILE_MONEY' ? 'REUSSI' : e.canal === 'VIREMENT' ? 'EN_ATTENTE' : 'RECU'} />
                          <span className="ml-2 text-xs text-ink-500">{e.canal === 'ESPECES' ? 'Espèces' : e.canal === 'MOBILE_MONEY' ? 'Mobile Money' : 'Virement'}</span>
                        </td>
                        <td className="whitespace-nowrap text-xs text-ink-500">{frDate(e.date)}</td>
                        <td>
                          <Link href={`/scolarite/${e.eleveId}`} className="btn-ghost btn-sm">
                            Fiche
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <Card
          titre="Tous les élèves"
          sousTitre="Cliquez sur un élève pour voir son échéancier, ses reçus et imprimer sa situation"
        >
          <div className="scroll-x">
            <table className="table min-w-[880px]">
              <thead>
                <tr className="bg-ink-50">
                  <th>Matricule</th>
                  <th>Élève</th>
                  <th>Classe</th>
                  <th>Parent</th>
                  <th>Scolarité annuelle</th>
                  <th>Payé</th>
                  <th>Reste</th>
                  <th>Statut</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {eleves.map((e) => {
                  const s = situationEleve(e, tranches);
                  return (
                    <tr key={e.id}>
                      <td className="font-mono text-xs">{e.matricule}</td>
                      <td className="font-semibold text-ink-800">{e.nom}</td>
                      <td className="text-sm">{e.classe}</td>
                      <td>
                        <div className="text-sm">{e.parentNom}</div>
                        <div className="text-xs text-ink-500">{e.parentTelephone}</div>
                      </td>
                      <td className="whitespace-nowrap text-sm">{fcfa(e.fraisAnnuels)}</td>
                      <td className="whitespace-nowrap text-sm text-brand-700">{fcfa(s.totalPaye)}</td>
                      <td className="whitespace-nowrap text-sm font-bold">{fcfa(s.reste)}</td>
                      <td>
                        <BadgeStatut
                          statut={s.statut === 'EN_RETARD' ? 'IMPAYEE' : s.statut === 'SOLDÉ' ? 'PAYEE' : s.statut === 'PARTIEL' ? 'PARTIELLE' : 'ENVOYEE'}
                        />
                      </td>
                      <td>
                        <Link href={`/scolarite/${e.id}`} className="btn-ghost btn-sm">
                          Ouvrir
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
