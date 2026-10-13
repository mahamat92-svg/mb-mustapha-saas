import Link from 'next/link';
import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { MODULES } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Les 10 modules — problèmes africains résolus',
  description:
    'Facturation FCFA, recouvrement automatique des impayés, tontines/njangi, stock hors-ligne, paie des journaliers, frais scolaires, collecte agricole, assistant IA WhatsApp, conformité fiscale.',
};

export default function Fonctionnalites() {
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <header className="max-w-3xl">
          <h1 className="titre-page sm:text-3xl">10 modules, 10 problèmes africains réglés</h1>
          <p className="sous-titre mt-3">
            Chaque module part d’un problème vécu au quotidien dans une boutique de N’Djaména, un atelier de
            Douala, un marché de Cotonou ou une école de Lomé — puis le règle avec les outils que les gens
            utilisent déjà : le téléphone, le SMS, WhatsApp et le Mobile Money.
          </p>
        </header>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <a key={m.id} href={`#${m.id}`} className="card-tight transition-colors hover:bg-brand-50">
              <p className="text-2xl">{m.icon}</p>
              <p className="mt-1 font-bold text-ink-900">{m.name}</p>
              <p className="text-xs text-ink-500">{m.tagline}</p>
            </a>
          ))}
        </div>

        <div className="mt-12 space-y-8">
          {MODULES.map((m, i) => (
            <section key={m.id} id={m.id} className="card scroll-mt-24">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{m.icon}</span>
                  <div>
                    <h2 className="text-xl font-extrabold text-ink-900">
                      {i + 1}. {m.name}
                    </h2>
                    <p className="text-sm font-semibold text-brand-700">{m.tagline}</p>
                  </div>
                </div>
                <span className="badge-blue">Inclus à partir de l’offre {m.planMin}</span>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-rose-700">🚫 Le problème réel</p>
                  <p className="mt-2 text-sm text-rose-900">{m.probleme}</p>
                </div>
                <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-700">✅ Ce que fait {m.name}</p>
                  <p className="mt-2 text-sm text-brand-900">{m.solution}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-500">Fonctions incluses</p>
                  <ul className="mt-2 grid gap-1.5 text-sm text-ink-700 sm:grid-cols-2">
                    {m.features.map((f) => (
                      <li key={f}>✓ {f}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-ink-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-500">Résultat attendu</p>
                  <p className="mt-2 text-sm font-semibold text-ink-800">{m.impact}</p>
                  <p className="mt-3 text-xs text-ink-500">Pays prioritaires : {m.pays.join(', ')}</p>
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-12 rounded-xl2 border border-brand-200 bg-brand-50 p-6 text-center">
          <h2 className="text-xl font-extrabold text-ink-900">Vous vendez à des PME ? Devenez revendeur agréé.</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-ink-600">
            Apportez-nous un client : vous touchez 30% de l’abonnement la première année (15% ensuite), payé en
            Mobile Money chaque mois. Idéal pour les cabinets comptables, cybercafés, installateurs informatiques
            et associations professionnelles.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/tarifs" className="btn-primary">
              Voir les prix à revendre
            </Link>
            <Link href="/inscription" className="btn-ghost">
              Créer mon compte
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
