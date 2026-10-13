'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';
import { BRAND } from '@/lib/config';

const LIENS = [
  { href: '/', label: 'Accueil' },
  { href: '/fonctionnalites', label: 'Problèmes résolus' },
  { href: '/marche', label: 'Marché & offre' },
  { href: '/tarifs', label: 'Tarifs FCFA' },
];

export function SiteHeader() {
  const [ouvert, setOuvert] = useState(false);
  const chemin = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LIENS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                chemin === l.href ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50',
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/connexion" className="btn-ghost btn-sm">
            Espace client
          </Link>
          <Link href="/inscription" className="btn-primary btn-sm">
            Créer mon compte
          </Link>
        </div>

        <button
          aria-label="Ouvrir le menu"
          className="rounded-lg border border-ink-200 p-2 md:hidden"
          onClick={() => setOuvert((v) => !v)}
        >
          <span className="block h-0.5 w-5 bg-ink-800" />
          <span className="mt-1 block h-0.5 w-5 bg-ink-800" />
          <span className="mt-1 block h-0.5 w-5 bg-ink-800" />
        </button>
      </div>

      {ouvert && (
        <div className="border-t border-ink-200 bg-white px-4 py-3 md:hidden">
          <nav className="grid gap-1">
            {LIENS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOuvert(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href="/connexion" className="btn-ghost" onClick={() => setOuvert(false)}>
              Espace client
            </Link>
            <Link href="/inscription" className="btn-primary" onClick={() => setOuvert(false)}>
              Créer un compte
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const annee = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-ink-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-ink-500">
            Le logiciel de gestion qui parle FCFA, SMS et Mobile Money. Conçu à N’Djaména, Douala, Cotonou et
            Lomé — pour l’Afrique.
          </p>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-500">Produit</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="lien" href="/fonctionnalites">Les 10 modules</Link></li>
            <li><Link className="lien" href="/tarifs">Tarifs & abonnements</Link></li>
            <li><Link className="lien" href="/marche">Opportunité de marché</Link></li>
            <li><Link className="lien" href="/inscription">Créer un compte</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-500">Espaces</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="lien" href="/connexion">Espace client (public)</Link></li>
            <li><Link className="lien" href="/espace-prive">🔒 Espace privé (propriétaire)</Link></li>
            <li><Link className="lien" href="/assistant">Assistant & connexion Make</Link></li>
            <li><Link className="lien" href="/api/health">État du service</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-500">Contact</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-600">
            <li>WhatsApp : {BRAND.whatsapp}</li>
            <li>{BRAND.email}</li>
            <li>Fondateur : {BRAND.fondateur}</li>
            <li>Support en français, 7j/7</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-100 px-4 py-4 text-center text-xs text-ink-500">
        © {annee} {BRAND.name} — Yaoundé • Garoua • Maroua • N’Djaména • Moundou • Cotonou • Lomé. Paiement
        Mobile Money en FCFA.
      </div>
    </footer>
  );
}
