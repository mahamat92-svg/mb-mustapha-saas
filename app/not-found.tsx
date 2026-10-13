import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function NonTrouve() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 text-center">
      <Logo size={52} />
      <h1 className="mt-6 text-3xl font-extrabold text-ink-900">Page introuvable</h1>
      <p className="mt-3 text-sm text-ink-600">
        La page demandée n’existe pas (ou a été déplacée). Revenez à l’accueil pour continuer — vos factures et
        vos données sont intactes.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">
          Retour à l’accueil
        </Link>
        <Link href="/tableau-de-bord" className="btn-ghost">
          Mon espace client
        </Link>
        <Link href="/espace-prive" className="btn-dark">
          🔒 Espace privé
        </Link>
      </div>
    </main>
  );
}
