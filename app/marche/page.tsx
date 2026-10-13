import Link from 'next/link';
import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { COUNTRIES, PLANS, PROVIDERS } from '@/lib/config';
import { fcfa } from '@/lib/utils';
import { Card } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Marché & opportunité — Tchad, Cameroun, Bénin, Togo',
  description:
    'Pourquoi un SaaS de gestion en FCFA pour les PME d’Afrique centrale et de l’Ouest est une opportunité rentable : mobile money, informel, tickets d’abonnement adaptés, scénarios de revenus.',
};

const SCENARIOS = [
  { clients: 10, mix: '6 Starter + 3 Pro + 1 Business', panier: 147_600 },
  { clients: 30, mix: '15 Starter + 10 Pro + 4 Business + 1 Coop', panier: 582_400 },
  { clients: 100, mix: '40 Starter + 40 Pro + 15 Business + 5 Coop', panier: 1_832_000 },
  { clients: 300, mix: '100 Starter + 130 Pro + 50 Business + 20 Coop', panier: 5_652_000 },
];

export default function Marche() {
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <header className="max-w-3xl">
          <h1 className="titre-page sm:text-3xl">L’opportunité : digitaliser l’argent des PME africaines</h1>
          <p className="sous-titre mt-3">
            L’Afrique centrale et de l’Ouest est le plus grand marché de PME informelles du monde… et le moins
            équipé en logiciels adaptés. Personne n’a envie d’un ERP à 400 €/mois ; tout le monde a besoin de
            faire rentrer ses créances.
          </p>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Card titre="1. Le mobile money est partout">
            <p className="text-sm text-ink-600">
              Au Cameroun, au Bénin et au Togo, payer par téléphone est devenu le réflexe quotidien. La barrière
              du paiement — qui bloquait tous les logiciels occidentaux — n’existe plus. Votre abonnement se
              prélève naturellement en FCFA.
            </p>
          </Card>
          <Card titre="2. Le cahier est la concurrence">
            <p className="text-sm text-ink-600">
              Vos concurrents réels ne sont pas Sage ou Odoo : c’est le cahier à 500 FCFA, le reçu manuscrit et
              le carnet de la tontine. Un outil simple, en français, qui marche sur un téléphone à 25 000 FCFA
              gagne immédiatement.
            </p>
          </Card>
          <Card titre="3. Les tickets d’entrée sont bas">
            <p className="text-sm text-ink-600">
              À 9 900 FCFA/mois (15 €), une boutique qui récupère une seule facture impayée de 100 000 FCFA a
              déjà payé 10 mois d’abonnement. Le retour sur investissement est visible dès le premier mois.
            </p>
          </Card>
        </div>

        {/* Pays */}
        <section className="mt-12">
          <h2 className="titre-page">Les 4 marchés prioritaires</h2>
          <p className="sous-titre mt-2 max-w-3xl">
            Ordres de grandeur démographiques et contexte paiement/fiscal (à revérifier avant un business plan :
            sources publiques Banque mondiale, GSMA, BEAC, BCEAO, DGI/OTR).
          </p>
          <div className="scroll-x mt-6">
            <table className="table min-w-[720px] bg-white">
              <thead>
                <tr className="bg-ink-50">
                  <th>Pays</th>
                  <th>Ce qui facilite la vente</th>
                  <th>Ce qui complique</th>
                  <th>Ce qu’il faut automatiser en priorité</th>
                </tr>
              </thead>
              <tbody>
                {COUNTRIES.slice(0, 4).map((c) => (
                  <tr key={c.code}>
                    <td className="font-semibold">
                      {c.flag} {c.name}
                      <div className="text-xs font-normal text-ink-500">
                        {c.fiscal} · TVA {c.vat}% · {c.social}
                      </div>
                    </td>
                    <td className="text-sm text-ink-600">{c.mobileMoney.join(', ')}</td>
                    <td className="text-sm text-ink-600">{c.note}</td>
                    <td className="text-sm text-ink-600">{c.villes.slice(0, 3).join(' · ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Scenarios de revenus */}
        <section className="mt-12">
          <h2 className="titre-page">Combien cela peut-il rapporter ?</h2>
          <p className="sous-titre mt-2 max-w-3xl">
            Calculs basés uniquement sur les prix publics de vos offres (voir{' '}
            <Link href="/tarifs" className="lien">
              la grille tarifaire
            </Link>
            ). Le panier moyen indiqué est le revenu mensuel récurrent (MRR) obtenu avec un mix réaliste.
          </p>
          <div className="scroll-x mt-6">
            <table className="table min-w-[640px] bg-white">
              <thead>
                <tr className="bg-ink-50">
                  <th>Clients payants</th>
                  <th>Mix d’offres</th>
                  <th>MRR (par mois)</th>
                  <th>ARR (par an)</th>
                </tr>
              </thead>
              <tbody>
                {SCENARIOS.map((s) => (
                  <tr key={s.clients}>
                    <td className="font-bold">{s.clients}</td>
                    <td className="text-sm text-ink-600">{s.mix}</td>
                    <td className="font-bold text-brand-700">{fcfa(s.panier)}</td>
                    <td className="text-sm font-semibold">{fcfa(s.panier * 12)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Exemple : 100 clients payants ⇒ ~1,83 M FCFA/mois (≈ 2 800 €) de revenus récurrents. Ajoutez les
            prestations (installation, formation, personnalisation) et la revente de SMS pour augmenter le panier.
          </p>
        </section>

        {/* Comment gagner de l'argent */}
        <section className="mt-12 grid gap-4 lg:grid-cols-2">
          <Card titre="Les 5 sources de revenus">
            <ul className="space-y-3 text-sm text-ink-600">
              <li>
                <strong className="text-ink-900">1. Abonnements FCFA</strong> — cœur du modèle, encaissé par
                Mobile Money chaque mois (5 offres de 0 à 149 000 FCFA).
              </li>
              <li>
                <strong className="text-ink-900">2. Pack SMS / WhatsApp</strong> — revendez les crédits de
                relances avec une marge (ex. 100 SMS = 2 500 FCFA).
              </li>
              <li>
                <strong className="text-ink-900">3. Installation & paramétrage</strong> — 50 000 à 250 000 FCFA
                selon la taille (étiquettes, reprise du cahier, formation).
              </li>
              <li>
                <strong className="text-ink-900">4. Revendeurs agréés</strong> — réseau de cabinets comptables,
                cybercafés et techniciens : 30% la 1ʳᵉ année, payés en Mobile Money.
              </li>
              <li>
                <strong className="text-ink-900">5. Sur-mesure & données</strong> — rapports pour ONG/bailleurs,
                intégrations, hébergement dédié pour coopératives.
              </li>
            </ul>
          </Card>

          <Card titre="Comment vendre sur le terrain (playbook)">
            <ol className="space-y-3 text-sm text-ink-600">
              <li>
                <strong className="text-ink-900">Le test des impayés.</strong> Asseyez-vous avec le patron,
                listez ses créances impayées, puis montrez le bouton « Relancer » et le message WhatsApp qui
                part. La démonstration dure 6 minutes et se vend toute seule.
              </li>
              <li>
                <strong className="text-ink-900">Le pack métier.</strong> Ne vendez pas « un logiciel » mais « le
                pack tontine » aux associations de femmes, « le pack école » aux directions, « le pack
                boutique » aux marchés.
              </li>
              <li>
                <strong className="text-ink-900">Le pilote à 0 FCFA.</strong> Offre Découverte pour 30 jours,
                avec vos 5 vraies factures. La conversion se fait quand le premier impayé est réglé.
              </li>
              <li>
                <strong className="text-ink-900">Les relais.</strong> Groupements de commerçants, syndicats de
                taxis, associations de parents d’élèves, coopératives agricoles : un seul ambassadeur convaincu
                amène 20 clients.
              </li>
              <li>
                <strong className="text-ink-900">La preuve sociale.</strong> Publiez chaque mois les résultats
                de vos clients (taux de recouvrement, factures réglées) — la confiance est votre meilleure
                publicité.
              </li>
            </ol>
          </Card>
        </section>

        {/* Paiement */}
        <section className="mt-12">
          <h2 className="titre-page">Comment encaisser : les passerelles à brancher</h2>
          <p className="sous-titre mt-2">
            Le code est déjà prévu pour ces prestataires (voir <code>lib/paiements.ts</code>). Branchez-en un par
            zone, gardez le paiement manuel en secours.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROVIDERS.map((p) => (
              <div key={p.id} className="card-tight">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-ink-900">{p.name}</p>
                  <span className={p.type === 'manuel' ? 'badge-gray' : 'badge-green'}>
                    {p.type === 'manuel' ? 'manuel' : 'API'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-ink-500">{p.pays.slice(0, 5).join(' · ')}</p>
                <p className="mt-2 text-sm text-ink-600">{p.note}</p>
                <p className="mt-2 text-xs font-semibold text-ink-500">Frais : {p.frais}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Risques */}
        <section className="mt-12">
          <Card titre="Les risques, sans langue de bois" sousTitre="Mieux vaut les connaître avant de se lancer.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm text-ink-600">
              <div>
                <p className="font-bold text-ink-900">Connexion instable</p>
                <p className="mt-1">
                  Réponse : interface ultra-légère, SMS/USSD pour les employés, mode hors-ligne sur le module
                  stock, aucune image lourde.
                </p>
              </div>
              <div>
                <p className="font-bold text-ink-900">Pouvoir d’achat</p>
                <p className="mt-1">
                  Réponse : offre gratuite, paliers à 9 900 / 24 900 FCFA, paiement mensuel sans engagement,
                  prix dégressif annuel.
                </p>
              </div>
              <div>
                <p className="font-bold text-ink-900">Confiance / données</p>
                <p className="mt-1">
                  Réponse : hébergement à votre nom, export complet à tout moment, journal d’audit, pas de
                  revente de données.
                </p>
              </div>
              <div>
                <p className="font-bold text-ink-900">Recouvrement de VOS abonnements</p>
                <p className="mt-1">
                  Réponse : les mêmes relances automatiques que vous vendez… appliquées à vos clients
                  (voir l’espace privé → statut « En retard »).
                </p>
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-12 rounded-xl2 border border-brand-200 bg-brand-50 p-6">
          <h2 className="text-lg font-extrabold text-ink-900">Objectif à 12 mois, réaliste</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-4">
              <p className="text-xs uppercase text-ink-500">Clients payants</p>
              <p className="text-2xl font-extrabold text-brand-700">100</p>
              <p className="text-xs text-ink-500">≈ 3 par semaine sur 9 mois</p>
            </div>
            <div className="rounded-xl bg-white p-4">
              <p className="text-xs uppercase text-ink-500">MRR</p>
              <p className="text-2xl font-extrabold text-brand-700">≈ 1,8 M FCFA</p>
              <p className="text-xs text-ink-500">≈ 2 800 € par mois</p>
            </div>
            <div className="rounded-xl bg-white p-4">
              <p className="text-xs uppercase text-ink-500">ARR + services</p>
              <p className="text-2xl font-extrabold text-brand-700">≈ 25 M FCFA</p>
              <p className="text-xs text-ink-500">abonnements + installation + SMS</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-ink-500">
            Les montants en euros sont donnés à titre indicatif (1 € ≈ 655,957 FCFA, parité fixe) — les prix de
            vente restent en FCFA.
          </p>
        </section>

        {/* Offres rappel */}
        <section className="mt-12">
          <h2 className="titre-page">Rappel des offres</h2>
          <div className="scroll-x mt-4">
            <table className="table min-w-[640px] bg-white">
              <thead>
                <tr className="bg-ink-50">
                  <th>Offre</th>
                  <th>Prix / mois</th>
                  <th>Prix / an</th>
                  <th>Cible</th>
                </tr>
              </thead>
              <tbody>
                {PLANS.map((p) => (
                  <tr key={p.id}>
                    <td className="font-bold">{p.name}</td>
                    <td>{p.price === 0 ? 'Gratuit' : fcfa(p.price)}</td>
                    <td>{p.annual === 0 ? '—' : fcfa(p.annual)}</td>
                    <td className="text-sm text-ink-600">{p.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/tarifs" className="btn-primary">
              Voir le détail des offres
            </Link>
            <Link href="/inscription" className="btn-ghost">
              Créer un compte
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
