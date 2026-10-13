import Link from 'next/link';
import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { COUNTRIES, PLANS, REVENDEUR_COMMISSION } from '@/lib/config';
import { fcfa } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Tarifs en FCFA',
  description:
    'Offres MB Mustapha : Découverte gratuit, Starter 9 900 FCFA, Pro 24 900 FCFA, Business 59 900 FCFA, Coopérative 149 000 FCFA. Paiement Mobile Money (Airtel, MTN, Orange, Moov, T-Money, Wave).',
};

const SERVICES = [
  ['Installation + reprise de vos données (cahier, Excel)', '50 000 FCFA'],
  ['Formation de 2 heures sur place (N’Djaména, Douala, Cotonou, Lomé)', '75 000 FCFA'],
  ['Paramétrage tontine / coopérative (membres, tours, PV)', '120 000 FCFA'],
  ['Pack 500 SMS de relance', '12 500 FCFA'],
  ['Étiquettes codes-barres + scan (petite boutique)', '35 000 FCFA'],
  ['Pack revendeur agréé (formation + outils de vente)', 'Gratuit — commission 30%'],
];

export default function Tarifs() {
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <header className="mx-auto max-w-3xl text-center">
          <h1 className="titre-page sm:text-3xl">Des tarifs calculés en FCFA, pas en euros</h1>
          <p className="sous-titre mt-3">
            Pas d’engagement, pas de carte bancaire : on paie par Mobile Money, mois par mois, ou à l’année avec
            2 mois offerts. Résiliable à tout moment, données exportables.
          </p>
        </header>

        {/* 5 offres */}
        <div className="mt-10 grid gap-4 lg:grid-cols-3 xl:grid-cols-5">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={p.popular ? 'card border-brand-400 ring-2 ring-brand-200' : 'card'}
            >
              {p.popular && <span className="badge-green mb-2">Le plus choisi</span>}
              <h2 className="text-lg font-bold text-ink-900">{p.name}</h2>
              <p className="text-xs text-ink-500">{p.tagline}</p>
              <p className="mt-3 text-2xl font-extrabold text-brand-700">
                {p.price === 0 ? 'Gratuit' : fcfa(p.price)}
                {p.price > 0 && <span className="text-xs font-semibold text-ink-500"> /mois</span>}
              </p>
              {p.annual > 0 && <p className="text-xs text-ink-500">ou {fcfa(p.annual)} / an (2 mois offerts)</p>}
              <p className="mt-2 rounded-lg bg-ink-50 px-2.5 py-1.5 text-[11px] text-ink-600">{p.target}</p>
              <ul className="mt-3 space-y-1.5 text-sm text-ink-600">
                {p.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <Link
                href={`/inscription?plan=${p.id}`}
                className={p.popular ? 'btn-accent mt-4 w-full' : 'btn-primary mt-4 w-full'}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Comparaison */}
        <section className="mt-12">
          <h2 className="titre-page">Comparaison détaillée</h2>
          <div className="scroll-x mt-4">
            <table className="table min-w-[820px] bg-white">
              <thead>
                <tr className="bg-ink-50">
                  <th>Inclus</th>
                  {PLANS.map((p) => (
                    <th key={p.id}>{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-semibold">Modules métier</td>
                  {PLANS.map((p) => (
                    <td key={p.id}>{p.maxModules === 'illimite' ? 'Tous (10)' : p.maxModules}</td>
                  ))}
                </tr>
                <tr>
                  <td className="font-semibold">Utilisateurs</td>
                  {PLANS.map((p) => (
                    <td key={p.id}>{p.limits.users === 'illimite' ? 'Illimités' : p.limits.users}</td>
                  ))}
                </tr>
                <tr>
                  <td className="font-semibold">Factures / mois</td>
                  {PLANS.map((p) => (
                    <td key={p.id}>{p.limits.invoices === 'illimite' ? 'Illimitées' : p.limits.invoices}</td>
                  ))}
                </tr>
                <tr>
                  <td className="font-semibold">SMS + WhatsApp / mois</td>
                  {PLANS.map((p) => (
                    <td key={p.id}>{p.limits.messages.toLocaleString('fr-FR')}</td>
                  ))}
                </tr>
                <tr>
                  <td className="font-semibold">Scénarios Make.com</td>
                  {PLANS.map((p) => (
                    <td key={p.id}>{p.limits.makeScenarios === 'illimite' ? 'Illimités' : p.limits.makeScenarios}</td>
                  ))}
                </tr>
                <tr>
                  <td className="font-semibold">Marque blanche (votre logo)</td>
                  {PLANS.map((p) => (
                    <td key={p.id}>{['BUSINESS', 'COOPERATIVE'].includes(p.id) ? '✓' : '—'}</td>
                  ))}
                </tr>
                <tr>
                  <td className="font-semibold">Formation sur site</td>
                  {PLANS.map((p) => (
                    <td key={p.id}>{p.id === 'COOPERATIVE' ? '✓' : 'En option'}</td>
                  ))}
                </tr>
                <tr>
                  <td className="font-semibold">Prix annuel</td>
                  {PLANS.map((p) => (
                    <td key={p.id} className="font-bold">
                      {p.annual === 0 ? 'Gratuit' : fcfa(p.annual)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Moyens de paiement */}
        <section className="mt-12 grid gap-4 lg:grid-cols-2">
          <div className="card">
            <h2 className="text-base font-bold text-ink-900">Payer en Mobile Money</h2>
            <p className="mt-1 text-xs text-ink-500">
              Choisissez l’opérateur de votre pays — l’application vous guide (ou vous composez le code USSD
              indiqué).
            </p>
            <div className="scroll-x mt-4">
              <table className="table min-w-[520px]">
                <thead>
                  <tr className="bg-ink-50">
                    <th>Pays</th>
                    <th>Opérateurs acceptés</th>
                    <th>Fiscalité gérée</th>
                  </tr>
                </thead>
                <tbody>
                  {COUNTRIES.slice(0, 4).map((c) => (
                    <tr key={c.code}>
                      <td className="font-semibold">
                        {c.flag} {c.name}
                      </td>
                      <td className="text-sm text-ink-600">{c.mobileMoney.join(' · ')}</td>
                      <td className="text-sm text-ink-600">
                        TVA {c.vat}% — {c.fiscal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-ink-500">
              Sans passerelle disponible (cas fréquent au Tchad) : envoi sur le numéro marchand + validation en un
              clic par nos équipes, sous 30 minutes en journée.
            </p>
          </div>

          <div className="card">
            <h2 className="text-base font-bold text-ink-900">Prestations & revente</h2>
            <div className="scroll-x mt-3">
              <table className="table min-w-[420px]">
                <tbody>
                  {SERVICES.map(([s, p]) => (
                    <tr key={s}>
                      <td className="text-sm text-ink-700">{s}</td>
                      <td className="whitespace-nowrap text-right font-semibold">{p}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-800">
              Programme revendeur : {Math.round(REVENDEUR_COMMISSION * 100)}% de commission sur la première année,
              15% ensuite. Idéal pour cabinets comptables, cybercafés et techniciens.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="titre-page">Questions fréquentes</h2>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {[
              ['Est-ce que ça marche sans connexion internet ?', 'L’interface est très légère et le module stock fonctionne en mode dégradé hors-ligne (les données se synchronisent au retour du réseau). Les relances peuvent passer par SMS, qui fonctionne même en zone rurale.'],
              ['Mes données m’appartiennent-elles ?', 'Oui. Vous pouvez exporter à tout moment en Excel/CSV, et l’offre Business peut être hébergée à votre nom. Nous ne revendons aucune donnée.'],
              ['Faut-il un ordinateur ?', 'Non. Tout se fait depuis un téléphone Android d’entrée de gamme. Les employés sans smartphone reçoivent leurs pointages et confirmations par SMS.'],
              ['Comment se passe la facturation de l’abonnement ?', 'Un reçu PDF avec TVA (18% ou 19,25% selon le pays) est généré chaque mois et envoyé par WhatsApp ou e-mail. Déductible de vos charges.'],
              ['Puis-je changer d’offre en cours de mois ?', 'Oui, à la hausse comme à la baisse. La différence est calculée au prorata en FCFA.'],
              ['Que se passe-t-il si je ne paie pas ?', 'Aucune surfacturation : le compte passe en « En retard », les modules restent lisibles 15 jours, puis l’accès en écriture est suspendu jusqu’au règlement.'],
            ].map(([q, r]) => (
              <div key={q} className="card-tight">
                <p className="font-bold text-ink-900">{q}</p>
                <p className="mt-1.5 text-sm text-ink-600">{r}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-xl2 border border-brand-200 bg-brand-50 p-6 text-center">
          <h2 className="text-xl font-extrabold text-ink-900">Commencez gratuitement, décidez après.</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-ink-600">
            L’offre Découverte est gratuite à vie. Les offres payantes démarrent par 14 jours d’essai, sans
            paiement.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/inscription" className="btn-primary">
              Créer mon compte
            </Link>
            <Link href="/marche" className="btn-ghost">
              Voir le potentiel du marché
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
