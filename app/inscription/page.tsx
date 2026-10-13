import Link from 'next/link';
import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';
import { InscriptionForm } from '@/components/forms-auth';
import { Card } from '@/components/ui';
import { PLANS } from '@/lib/config';
import { fcfa } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Créer mon compte',
  description: 'Créez le compte de votre entreprise en 2 minutes : essai 14 jours, paiement Mobile Money en FCFA.',
};

export default async function Inscription({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const sp = await searchParams;
  const planId = sp?.plan?.toUpperCase();
  const plan = PLANS.find((p) => p.id === planId);

  return (
    <div>
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-12 lg:grid-cols-[1.2fr_0.8fr]">
        <Card
          titre="Créer le compte de mon entreprise"
          sousTitre={plan ? `Offre choisie : ${plan.name} — ${plan.price === 0 ? 'gratuit' : fcfa(plan.price) + ' / mois'}` : 'Essai de 14 jours, aucun paiement demandé'}
        >
          <InscriptionForm planChoisi={plan?.id} />
        </Card>

        <div className="grid content-start gap-4">
          <Card titre="Ce que vous obtenez tout de suite">
            <ul className="space-y-2 text-sm text-ink-600">
              <li>✓ Un tableau de bord avec votre chiffre d’affaires et vos impayés</li>
              <li>✓ La création de factures avec TVA de votre pays</li>
              <li>✓ Les relances WhatsApp/SMS en un clic (via Make.com)</li>
              <li>✓ Le suivi du Mobile Money et les reçus automatiques</li>
              <li>✓ Un client de démonstration pour tester immédiatement</li>
            </ul>
          </Card>

          <Card titre="Quel pays choisir ?">
            <p className="text-sm text-ink-600">
              Le pays détermine la TVA (18% au Tchad, au Bénin et au Togo, 19,25% au Cameroun), la devise FCFA
              (CEMAC ou UEMOA), les opérateurs Mobile Money proposés et le calendrier fiscal (DGI, OTR…). Vous
              pourrez le modifier plus tard dans les paramètres.
            </p>
          </Card>

          <Card titre="Une question avant de commencer ?">
            <p className="text-sm text-ink-600">
              Écrivez-nous sur WhatsApp au <strong>{BRAND.whatsapp}</strong> ou consultez la page{' '}
              <Link className="lien" href="/assistant">
                Assistant & connexion Make
              </Link>
              .
            </p>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
