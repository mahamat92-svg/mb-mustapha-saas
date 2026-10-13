import Link from 'next/link';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { CalculateurGain } from '@/components/calculateur';
import { BRAND, COUNTRIES, MODULES, PLANS } from '@/lib/config';
import { fcfa } from '@/lib/utils';
import { BandeauDemo, Card, StatCard } from '@/components/ui';
import { modeDemo } from '@/lib/store';

export default function Accueil() {
  const demo = modeDemo();
  const plansPhares = PLANS.filter((p) => ['STARTER', 'PRO', 'BUSINESS'].includes(p.id));

  return (
    <div>
      <SiteHeader />

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                🇹🇩 🇨🇲 🇧🇯 🇹🇬 Tchad · Cameroun · Bénin · Togo · et plus
              </span>
              <h1 className="mt-5 text-3xl font-extrabold leading-tight sm:text-5xl">
                Faites rentrer l’argent de votre entreprise.
                <span className="block text-accent-300">Sans cahier, sans stress, en FCFA.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base text-white/85 sm:text-lg">
                {BRAND.name} réunit <strong>10 modules</strong> qui règlent les vrais problèmes des PME
                africaines : factures impayées, tontines, stock, paie des journaliers, frais scolaires, taxes…
                le tout relié à <strong>WhatsApp</strong>, au <strong>SMS</strong> et au{' '}
                <strong>Mobile Money</strong> grâce à Make.com.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/inscription" className="btn-accent">
                  Créer mon compte — essai 14 jours
                </Link>
                <Link href="/tarifs" className="btn border border-white/40 bg-white/10 text-white hover:bg-white/20">
                  Voir les tarifs en FCFA
                </Link>
                <Link href="/connexion" className="btn border border-white/30 text-white hover:bg-white/10">
                  Espace client
                </Link>
              </div>

              <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  ['10', 'modules métier'],
                  ['0 FCFA', 'pour commencer'],
                  ['24 900', 'FCFA/mois le pack Pro'],
                  ['2', 'interfaces : vous + vos clients'],
                ].map(([v, l]) => (
                  <div key={l} className="rounded-xl bg-white/10 px-3 py-3">
                    <dt className="text-lg font-extrabold">{v}</dt>
                    <dd className="text-[11px] uppercase tracking-wide text-white/70">{l}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Aperçu "ecran de telephone" en HTML pur */}
            <div className="mx-auto w-full max-w-sm">
              <div className="rounded-[2rem] border-4 border-white/30 bg-white p-3 shadow-2xl">
                <div className="rounded-[1.5rem] bg-ink-50 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">
                    Tableau de bord — N’Djaména Distribution
                  </p>
                  <p className="mt-2 text-xs text-ink-500">Chiffre d’affaires du mois</p>
                  <p className="text-2xl font-extrabold text-ink-900">9 495 000 FCFA</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-white p-2.5 shadow-sm">
                      <p className="text-[10px] uppercase text-ink-500">Encaissé</p>
                      <p className="text-sm font-bold text-brand-700">3 470 000</p>
                    </div>
                    <div className="rounded-xl bg-white p-2.5 shadow-sm">
                      <p className="text-[10px] uppercase text-ink-500">Impayé</p>
                      <p className="text-sm font-bold text-rose-600">6 025 000</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {[
                      ['FAC-2026-0003 · Hôtel Sahel', '4 120 000', 'Retard J-8'],
                      ['FAC-2026-0002 · Le Tchadien', '780 000', 'Partiel'],
                      ['FAC-2026-0005 · Al-Nour', '1 180 000', 'À échoir'],
                    ].map(([t, m, s]) => (
                      <div key={t} className="flex items-center justify-between rounded-xl bg-white px-2.5 py-2 shadow-sm">
                        <div>
                          <p className="text-[10px] font-semibold text-ink-700">{t}</p>
                          <p className="text-[9px] text-ink-500">{s}</p>
                        </div>
                        <p className="text-[10px] font-bold">{m}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-xl bg-brand-600 px-3 py-2 text-center text-[11px] font-bold text-white">
                    📣 Relancer les 3 impayés → WhatsApp
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-white/70">
                Aperçu du tableau de bord client (données de démonstration)
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-12">
        {demo && (
          <div className="mb-8">
            <BandeauDemo />
          </div>
        )}

        {/* ================= PROBLEMES ================= */}
        <section>
          <h2 className="titre-page">Ce qui bloque les entreprises africaines aujourd’hui</h2>
          <p className="sous-titre mt-2 max-w-3xl">
            Les logiciels occidentaux coûtent trop cher, exigent une connexion parfaite et une carte bancaire.
            Résultat : on revient au cahier. Voici les six maux que {BRAND.name} éteint, un par un.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['📕', 'Le cahier et les reçus perdus', 'Plus aucune preuve de ce que le client doit, litiges à répétition.'],
              ['🕳️', 'Les impayés qui dorment', 'Le patron n’ose pas relancer, la trésorerie se vide, les fournisseurs attendent.'],
              ['🤝', 'La tontine gérée de tête', 'Cotisations non tracées, membres mécontents, tensions dans la communauté.'],
              ['📦', 'Le stock au feeling', 'Rupture sur le produit qui rapporte, coulage, inventaire jamais juste.'],
              ['👷', 'La paie des journaliers', 'Heures disputées, CNPS/CNSS mal calculée, paye en retard, personnel démotivé.'],
              ['🧮', 'Les taxes et échéances oubliées', 'Pénalités DGI/OTR, contrôles fiscaux, expert-comptable qui réclame tout.'],
            ].map(([icone, titre, texte]) => (
              <div key={titre} className="card">
                <p className="text-2xl">{icone}</p>
                <h3 className="mt-3 text-base font-bold text-ink-900">{titre}</h3>
                <p className="mt-1.5 text-sm text-ink-600">{texte}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ================= MODULES ================= */}
        <section className="mt-14" id="modules">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="titre-page">Les 10 modules qui rapportent de l’argent</h2>
              <p className="sous-titre mt-2 max-w-2xl">
                Chaque module répond à un problème précis et se vend séparément. Vos clients activent ce dont ils
                ont besoin — vous encaissez l’abonnement en FCFA chaque mois.
              </p>
            </div>
            <Link href="/fonctionnalites" className="btn-ghost">
              Voir le détail des 10 modules
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => (
              <Link key={m.id} href={`/fonctionnalites#${m.id}`} className="card transition-transform hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-3xl">{m.icon}</p>
                  <span className="badge-gray">{m.planMin === 'STARTER' ? 'dès Starter' : `dès ${m.planMin}`}</span>
                </div>
                <h3 className="mt-3 text-base font-bold text-ink-900">{m.name}</h3>
                <p className="text-xs font-semibold text-brand-700">{m.tagline}</p>
                <p className="mt-2 text-sm text-ink-600">{m.solution.slice(0, 130)}…</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ================= DEUX INTERFACES ================= */}
        <section className="mt-14">
          <h2 className="titre-page">Deux interfaces : la vôtre (privée) et celle de vos clients (publique)</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="card border-ink-900/20 bg-gradient-to-br from-ink-900 to-ink-800 text-white">
              <span className="badge bg-white/15 text-white">🔒 Interface privée — vous seul</span>
              <h3 className="mt-3 text-lg font-bold">Le poste de pilotage de l’éditeur</h3>
              <ul className="mt-4 space-y-2 text-sm text-white/85">
                <li>• Revenus récurrents : MRR, ARR, ARPU par pays et par offre</li>
                <li>• Liste des entreprises clientes, statut, offres, renouvellements</li>
                <li>• Validation des paiements Mobile Money reçus manuellement</li>
                <li>• Journal des échanges Make.com (qui a échoué, quand, pourquoi)</li>
                <li>• Tests des scénarios, état des intégrations, clés API</li>
              </ul>
              <Link href="/espace-prive" className="btn-accent mt-5">
                Entrer dans l’espace privé (code requis)
              </Link>
            </div>

            <div className="card">
              <span className="badge-blue">🌍 Interface publique — vos clients</span>
              <h3 className="mt-3 text-lg font-bold text-ink-900">L’espace de chaque entreprise</h3>
              <ul className="mt-4 space-y-2 text-sm text-ink-600">
                <li>• Tableau de bord : CA, encaissé, impayé, taux de recouvrement</li>
                <li>• Factures, devis, reçus PDF + relances WhatsApp en un clic</li>
                <li>• Clients, stock, tontines, paie, frais scolaires selon l’offre</li>
                <li>• Abonnement et paiement Mobile Money en FCFA</li>
                <li>• Interface légère, utilisable sur un téléphone d’entrée de gamme</li>
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/inscription" className="btn-primary">
                  Créer un compte client
                </Link>
                <Link href="/connexion" className="btn-ghost">
                  Se connecter
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================= CALCULATEUR ================= */}
        <section className="mt-14">
          <Card
            titre="Combien votre entreprise perd-elle chaque mois ?"
            sousTitre="Bougez les curseurs : le calcul se fait en FCFA, en direct."
          >
            <CalculateurGain prixOffre={24900} />
          </Card>
        </section>

        {/* ================= COMMENT CA MARCHE ================= */}
        <section className="mt-14">
          <h2 className="titre-page">Comment ça marche, en 4 étapes</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['1', 'Vous créez votre compte', 'Nom de l’entreprise, pays, téléphone. La TVA du pays est configurée automatiquement.'],
              ['2', 'Vous saisissez clients et factures', 'Depuis le téléphone du comptoir, en 30 secondes. Aucun matériel spécial.'],
              ['3', 'Make.com automatise tout', 'Relances WhatsApp, alertes stock, reçus de paiement : les scénarios livrés sont déjà prêts.'],
              ['4', 'Vous encaissez', 'Mobile Money en FCFA, reçu SMS au client, caisse mise à jour, rapport quotidien au patron.'],
            ].map(([n, t, d]) => (
              <div key={n} className="card">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {n}
                </span>
                <h3 className="mt-3 font-bold text-ink-900">{t}</h3>
                <p className="mt-1 text-sm text-ink-600">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ================= TARIFS ================= */}
        <section className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="titre-page">Des offres pensées pour les bourses locales</h2>
            <Link href="/tarifs" className="btn-ghost">
              Comparer les 5 offres
            </Link>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {plansPhares.map((p) => (
              <div key={p.id} className={p.popular ? 'card border-brand-400 ring-2 ring-brand-200' : 'card'}>
                {p.popular && <span className="badge-green mb-2">Le plus choisi</span>}
                <h3 className="text-lg font-bold text-ink-900">{p.name}</h3>
                <p className="text-xs text-ink-500">{p.target}</p>
                <p className="mt-3 text-3xl font-extrabold text-brand-700">
                  {fcfa(p.price)}
                  <span className="text-sm font-semibold text-ink-500"> / mois</span>
                </p>
                <p className="text-xs text-ink-500">ou {fcfa(p.annual)} / an (2 mois offerts)</p>
                <ul className="mt-4 space-y-2 text-sm text-ink-600">
                  {p.features.slice(0, 5).map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>
                <Link href={`/inscription?plan=${p.id}`} className={p.popular ? 'btn-accent mt-5 w-full' : 'btn-primary mt-5 w-full'}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ================= MAKE ================= */}
        <section className="mt-14">
          <div className="card bg-gradient-to-br from-ink-900 to-ink-800 text-white">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <span className="badge bg-white/15 text-white">⚙️ Automatisation Make.com</span>
                <h2 className="mt-3 text-2xl font-extrabold">
                  MB Mustapha détecte. Make.com exécute. WhatsApp et le Mobile Money encaissent.
                </h2>
                <p className="mt-3 text-sm text-white/80">
                  Nos 6 scénarios livrés clés en main : relances d’impayés, alertes de rupture, reçus de paiement
                  Mobile Money, campagnes SMS/WhatsApp, rapport quotidien du patron, assistant WhatsApp
                  (AfriBot) qui transforme une conversation en facture.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href="/assistant" className="btn-accent">
                    Voir le schéma de connexion
                  </Link>
                  <Link href="/fonctionnalites#ia" className="btn border border-white/30 text-white hover:bg-white/10">
                    Découvrir AfriBot
                  </Link>
                </div>
              </div>
              <div className="rounded-xl2 bg-white/10 p-4 font-mono text-[11px] leading-relaxed">
                <p className="text-accent-300">// Schéma express</p>
                <p>MB Mustapha (facture impayée)</p>
                <p>&nbsp;&nbsp;└─▶ Webhook Make.com</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─▶ WhatsApp Cloud API</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─▶ SMS Africa’s Talking</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─▶ Google Sheet (trace)</p>
                <p>Client paie (Airtel / MTN / Orange)</p>
                <p>&nbsp;&nbsp;└─▶ Callback → Make → MB Mustapha</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─▶ Facture « PAYÉE » + reçu SMS</p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= PAYS ================= */}
        <section className="mt-14">
          <h2 className="titre-page">Conçu pour vos réalités, pays par pays</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COUNTRIES.slice(0, 4).map((c) => (
              <div key={c.code} className="card">
                <p className="text-3xl">{c.flag}</p>
                <h3 className="mt-2 font-bold text-ink-900">{c.name}</h3>
                <p className="text-xs text-ink-500">{c.fiscal} · TVA {c.vat}%</p>
                <ul className="mt-3 space-y-1 text-sm text-ink-600">
                  <li>💳 {c.mobileMoney.join(' · ')}</li>
                  <li>🏙️ {c.villes.slice(0, 3).join(', ')}</li>
                </ul>
              </div>
            ))}
          </div>
          <Link href="/marche" className="lien mt-4 inline-block">
            Voir l’étude de marché et les scénarios de revenus →
          </Link>
        </section>

        {/* ================= LE FONDATEUR ================= */}
        <section className="mt-14">
          <div className="card flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-100 text-2xl font-extrabold text-brand-700">
              MB
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-ink-500">
                Qui est derrière {BRAND.name} ?
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-ink-900 sm:text-2xl">{BRAND.fondateur}</h2>
              <p className="mt-2 max-w-3xl text-sm text-ink-600">
                Fondateur — basé entre Garoua, N’Djaména et les villes où travaillent nos premiers clients.
                « J’ai construit {BRAND.name} pour une seule raison : les petites entreprises d’Afrique perdent
                de l’argent chaque jour faute d’outils simples, en français et en FCFA. Pas de jargon, pas de
                formation interminable : on installe, on forme, et l’argent rentre. »
              </p>
              <p className="mt-2 text-sm text-ink-600">
                <strong>Mon engagement :</strong> si en 30 jours {BRAND.name} ne vous fait pas gagner de temps ou
                d’argent, je vous rembourse et vous récupérez vos données.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={`https://wa.me/${BRAND.whatsapp.replace(/[^0-9]/g, '')}`} className="btn-ghost btn-sm">
                  📱 Parler au fondateur
                </a>
                <a href={`mailto:${BRAND.email}`} className="btn-ghost btn-sm">
                  ✉️ {BRAND.email}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ================= CTA FINAL ================= */}
        <section className="mt-14">
          <div className="rounded-xl2 border border-brand-200 bg-brand-50 p-6 text-center sm:p-10">
            <h2 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">
              Vos factures impayées peuvent payer votre abonnement dès le premier mois.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-ink-600">
              Créez votre compte gratuitement, importez vos clients, activez les relances. Vous ne payez que
              lorsque vous y voyez clair dans votre argent.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/inscription" className="btn-primary">
                Commencer maintenant
              </Link>
              <a href={`https://wa.me/${BRAND.whatsapp.replace(/[^0-9]/g, '')}`} className="btn-ghost">
                Parler à un conseiller sur WhatsApp
              </a>
            </div>
          </div>
        </section>

        <section className="mt-14 grid gap-4 sm:grid-cols-3">
          <StatCard label="Modules métier" valeur="10" aide="facturation, tontine, stock, paie, IA…" icone="🧩" />
          <StatCard label="Opérateurs gérés" valeur="12+" aide="Airtel, MTN, Orange, Moov, T-Money, Wave" icone="📱" ton="vert" />
          <StatCard label="Scénarios Make.com fournis" valeur="6" aide="relance, stock, paiement, SMS, rapport, AfriBot" icone="⚙️" ton="ambre" />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
