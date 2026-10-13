'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Logo } from './Logo';
import { cn, initials } from '@/lib/utils';
import { BRAND } from '@/lib/config';

export type NavItem = { href: string; label: string; icone: string };

export function DashboardShell({
  nav,
  children,
  utilisateur,
  contexte,
  variante = 'client',
}: {
  nav: NavItem[];
  children: React.ReactNode;
  utilisateur: { name: string; email: string; role: string };
  contexte: string;
  variante?: 'client' | 'admin';
}) {
  const chemin = usePathname();
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);

  async function deconnexion() {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deconnexion' }),
    });
    router.push('/connexion');
    router.refresh();
  }

  const accent = variante === 'admin' ? 'from-ink-900 to-ink-800' : 'from-brand-700 to-brand-600';

  return (
    <div className="min-h-screen lg:flex">
      {/* --- Barre laterale --- */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 transform overflow-y-auto bg-gradient-to-b p-4 text-white transition-transform lg:static lg:translate-x-0',
          accent,
          ouvert ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between">
          <Link href={variante === 'admin' ? '/admin' : '/tableau-de-bord'} className="flex items-center gap-2">
            <span className="rounded-xl bg-white/10 px-2 py-1">
              <Logo size={28} withText={false} />
            </span>
            <span className="text-base font-extrabold">
              Afri<span className="text-accent-300">Flow</span>
              {variante === 'admin' && <span className="ml-1 text-[10px] uppercase text-white/60">privé</span>}
            </span>
          </Link>
          <button className="rounded-lg p-1.5 hover:bg-white/10 lg:hidden" onClick={() => setOuvert(false)} aria-label="Fermer">
            ✕
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-white/10 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-white/60">
            {variante === 'admin' ? 'Éditeur du SaaS' : 'Entreprise'}
          </p>
          <p className="truncate text-sm font-bold">{contexte}</p>
        </div>

        <nav className="mt-4 grid gap-1">
          {nav.map((item) => {
            const actif = chemin === item.href || (item.href !== '/admin' && item.href !== '/tableau-de-bord' && chemin.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOuvert(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                  actif ? 'bg-white text-ink-900 shadow' : 'text-white/85 hover:bg-white/10',
                )}
              >
                <span className="text-base">{item.icone}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 rounded-xl bg-black/20 p-3 text-xs">
          <p className="font-semibold opacity-90">Besoin d’aide ?</p>
          <p className="mt-1 opacity-70">Support WhatsApp 7j/7 au {BRAND.whatsapp}</p>
          <p className="mt-2 border-t border-white/10 pt-2 opacity-70">
            {BRAND.fondateur}, fondateur — {BRAND.email}
          </p>
        </div>
      </aside>

      {ouvert && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOuvert(false)} />}

      {/* --- Contenu --- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-ink-200 bg-white/95 px-4 py-3 backdrop-blur">
          <button className="rounded-lg border border-ink-200 p-2 lg:hidden" onClick={() => setOuvert(true)} aria-label="Ouvrir le menu">
            <span className="block h-0.5 w-5 bg-ink-800" />
            <span className="mt-1 block h-0.5 w-5 bg-ink-800" />
            <span className="mt-1 block h-0.5 w-5 bg-ink-800" />
          </button>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink-900">{utilisateur.name}</p>
            <p className="truncate text-xs text-ink-500">
              {utilisateur.role === 'OWNER' ? 'Propriétaire du SaaS' : 'Administrateur client'} · {utilisateur.email}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700 sm:inline">
              {initials(utilisateur.name)}
            </span>
            <button onClick={deconnexion} className="btn-ghost btn-sm">
              Déconnexion
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6">{children}</main>

        <footer className="border-t border-ink-100 px-6 py-4 text-center text-xs text-ink-500">
          MB Mustapha v1.0 — Tchad · Cameroun · Bénin · Togo · Sénégal · Côte d’Ivoire
        </footer>
      </div>
    </div>
  );
}
