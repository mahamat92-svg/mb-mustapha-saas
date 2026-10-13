import Link from 'next/link';
import type { Metadata } from 'next';
import { EspacePriveForm } from '@/components/forms-auth';
import { Logo } from '@/components/Logo';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Espace privé — accès réservé', robots: { index: false } };

const CONTENU = [
  ['📈', 'Revenus du SaaS', 'MRR, ARR, panier moyen, répartition par pays et par offre'],
  ['🏢', 'Vos clients entreprises', 'Statut, offre, renouvellement, mise en pause ou suspension'],
  ['✅', 'Validation des paiements', 'Les paiements Airtel/Moov/virement reçus, validés en un clic'],
  ['⚙️', 'Journal Make.com', 'Tous les échanges, avec le détail des erreurs et des tests'],
  ['🔑', 'Réglages & clés', 'État des intégrations, clés API, code confidentiel, marque blanche'],
  ['🧪', 'Outils de démonstration', 'Réinitialiser les données, tester un scénario devant un prospect'],
];

export default async function EspacePrive() {
  // Deja connecte en OWNER ? on va directement au poste de pilotage.
  const session = await getSession();
  if (session?.role === 'OWNER') redirect('/admin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-ink-900 via-ink-900 to-brand-900 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="rounded-xl bg-white/10 px-2 py-1">
            <Logo size={28} withText={false} />
          </span>
          <span className="text-lg font-extrabold">
            Afri<span className="text-accent-300">Flow</span>
          </span>
        </Link>
        <Link href="/" className="text-sm text-white/70 hover:text-white">
          ← Retour au site public
        </Link>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 pb-16 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <span className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
            🔒 ZONE PRIVÉE — PROPRIÉTAIRE DU SAAS
          </span>
          <h1 className="mt-5 text-3xl font-extrabold sm:text-4xl">
            Votre poste de pilotage.
            <span className="block text-accent-300">Vos clients n’y ont jamais accès.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm text-white/75">
            Cette interface est séparée de l’espace public : elle exige un e-mail de propriétaire, un mot de passe
            ET un code confidentiel (variable <code className="rounded bg-white/10 px-1">ADMIN_PASSCODE</code>).
            Elle sert à suivre vos revenus et à opérer le SaaS au quotidien.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {CONTENU.map(([icone, titre, texte]) => (
              <div key={titre} className="rounded-xl2 border border-white/10 bg-white/5 p-4">
                <p className="text-2xl">{icone}</p>
                <p className="mt-2 font-bold">{titre}</p>
                <p className="mt-1 text-xs text-white/65">{texte}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl2 border border-accent-400/30 bg-accent-400/10 p-4 text-sm text-accent-100">
            <strong>Conseil de sécurité :</strong> changez les valeurs par défaut (
            <code>ADMIN_PASSCODE</code>, <code>AUTH_SECRET</code>, <code>AFRIFLOW_API_KEY</code>) dans les
            variables d’environnement Vercel avant d’ouvrir le service au public.
          </div>
        </div>

        <div className="rounded-xl2 border border-white/10 bg-white p-6 text-ink-800 shadow-2xl">
          <h2 className="text-lg font-extrabold text-ink-900">Accès propriétaire</h2>
          <p className="mt-1 text-xs text-ink-500">
            Trois informations sont exigées : e-mail, mot de passe, code confidentiel.
          </p>
          <div className="mt-5">
            <EspacePriveForm />
          </div>

          <div className="mt-6 rounded-xl bg-ink-50 p-3 text-xs text-ink-600">
            <p className="font-bold text-ink-800">Première mise en service</p>
            <p className="mt-1">
              Sur une base vide, créez votre compte propriétaire avec le script <code>scripts/seed.mjs</code>{' '}
              (voir le README, section « Créer votre compte propriétaire »), ou changez simplement l’e-mail du
              compte de démonstration dans <code>prisma/seed</code>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
