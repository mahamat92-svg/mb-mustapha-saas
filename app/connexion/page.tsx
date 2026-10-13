import Link from 'next/link';
import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { ConnexionForm } from '@/components/forms-auth';
import { Card } from '@/components/ui';

export const metadata: Metadata = { title: 'Connexion — Espace client' };

export default function Connexion() {
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-12 lg:grid-cols-2">
        <Card titre="Connexion à votre espace" sousTitre="Espace public — réservé aux entreprises clientes">
          <ConnexionForm />
        </Card>

        <div className="grid gap-4">
          <Card titre="Pas encore de compte ?">
            <p className="text-sm text-ink-600">
              Créez votre entreprise en 2 minutes et essayez toutes les fonctions pendant 14 jours. Aucun
              paiement demandé au départ.
            </p>
            <Link href="/inscription" className="btn-primary mt-4 w-full">
              Créer mon compte gratuitement
            </Link>
          </Card>

          <Card titre="Vous êtes l’éditeur du SaaS ?">
            <p className="text-sm text-ink-600">
              Votre poste de pilotage est séparé et protégé par un code confidentiel supplémentaire.
            </p>
            <Link href="/espace-prive" className="btn-dark mt-4 w-full">
              🔒 Accéder à l’espace privé
            </Link>
          </Card>

          <Card titre="Comptes de démonstration">
            <ul className="space-y-2 text-sm text-ink-600">
              <li>
                🏢 <strong>Entreprise (Tchad)</strong> — demo@mbmustapha.com / demo2026
              </li>
              <li>
                🏢 <strong>Entreprise (Cameroun)</strong> — douala@mbmustapha.com / demo2026
              </li>
              <li>
                🏢 <strong>Coopérative (Bénin)</strong> — cotonou@mbmustapha.com / demo2026
              </li>
              <li>
                🎓 <strong>École (Togo)</strong> — ecole@mbmustapha.com / demo2026
                <span className="block text-xs text-ink-500">module ScolaPay : 12 élèves, échéanciers, retardataires</span>
              </li>
              <li>
                🔒 <strong>Propriétaire du SaaS</strong> — patron@mbmustapha.com / patron2026 (+ code
                PATRON-2026)
              </li>
            </ul>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
