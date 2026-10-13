'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Erreur({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[MB Mustapha] Erreur applicative :', error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 text-center">
      <p className="text-4xl">🛠️</p>
      <h1 className="mt-4 text-2xl font-extrabold text-ink-900">Une erreur est survenue</h1>
      <p className="mt-3 text-sm text-ink-600">
        Pas de panique : vos données sont enregistrées côté base. Réessayez, et si le problème persiste,
        vérifiez vos variables d’environnement (surtout <code>DATABASE_URL</code> et <code>AUTH_SECRET</code>).
      </p>
      <pre className="mt-4 max-w-full overflow-x-auto rounded-xl bg-ink-900 p-3 text-left font-mono text-[11px] text-white/80">
        {error.message}
      </pre>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="btn-primary">
          Réessayer
        </button>
        <Link href="/" className="btn-ghost">
          Retour à l’accueil
        </Link>
      </div>
    </main>
  );
}
