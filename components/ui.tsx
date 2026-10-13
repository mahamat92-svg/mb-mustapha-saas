// =============================================================================
// MB Mustapha - Petits composants d'interface reutilisables (cote serveur)
// =============================================================================
import React from 'react';
import { cn, fcfa } from '@/lib/utils';
import type { InvoiceStatus } from '@/lib/types';

export function Card({
  children,
  className,
  titre,
  action,
  sousTitre,
}: {
  children?: React.ReactNode;
  className?: string;
  titre?: string;
  sousTitre?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn('card', className)}>
      {(titre || action) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {titre && <h2 className="text-base font-bold text-ink-900">{titre}</h2>}
            {sousTitre && <p className="mt-0.5 text-xs text-ink-500">{sousTitre}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  valeur,
  aide,
  icone,
  ton = 'neutre',
}: {
  label: string;
  valeur: string;
  aide?: string;
  icone?: string;
  ton?: 'neutre' | 'vert' | 'rouge' | 'ambre';
}) {
  const tons = {
    neutre: 'bg-white',
    vert: 'bg-brand-50 border-brand-200',
    rouge: 'bg-rose-50 border-rose-200',
    ambre: 'bg-amber-50 border-amber-200',
  };
  return (
    <div className={cn('rounded-xl2 border border-ink-200 p-4 shadow-card', tons[ton])}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">{label}</p>
        {icone && <span className="text-lg">{icone}</span>}
      </div>
      <p className="mt-2 text-xl font-extrabold text-ink-900 sm:text-2xl">{valeur}</p>
      {aide && <p className="mt-1 text-xs text-ink-500">{aide}</p>}
    </div>
  );
}

export function BadgeStatut({ statut }: { statut: InvoiceStatus | string }) {
  const map: Record<string, { classe: string; texte: string }> = {
    BROUILLON: { classe: 'badge-gray', texte: 'Brouillon' },
    ENVOYEE: { classe: 'badge-blue', texte: 'Envoyée' },
    PARTIELLE: { classe: 'badge-amber', texte: 'Partiel' },
    PAYEE: { classe: 'badge-green', texte: 'Payée' },
    IMPAYEE: { classe: 'badge-red', texte: 'En retard' },
    ANNULEE: { classe: 'badge-gray', texte: 'Annulée' },
    ACTIF: { classe: 'badge-green', texte: 'Actif' },
    ESSAI: { classe: 'badge-blue', texte: 'Essai' },
    EN_RETARD: { classe: 'badge-red', texte: 'En retard' },
    SUSPENDU: { classe: 'badge-gray', texte: 'Suspendu' },
    RECU: { classe: 'badge-green', texte: 'Reçu' },
    EN_ATTENTE: { classe: 'badge-amber', texte: 'En attente' },
    RETARD: { classe: 'badge-red', texte: 'Retard' },
    REUSSI: { classe: 'badge-green', texte: 'Réussi' },
    ECHOUE: { classe: 'badge-red', texte: 'Échoué' },
    OK: { classe: 'badge-green', texte: 'OK' },
    ERREUR: { classe: 'badge-red', texte: 'Erreur' },
  };
  const m = map[statut] || { classe: 'badge-gray', texte: String(statut) };
  return <span className={m.classe}>{m.texte}</span>;
}

export function Barre({ valeur, max = 100, ton = 'brand' }: { valeur: number; max?: number; ton?: 'brand' | 'accent' | 'rose' }) {
  const p = Math.min(100, Math.max(0, Math.round((valeur / (max || 1)) * 100)));
  const couleurs = { brand: 'bg-brand-500', accent: 'bg-accent-500', rose: 'bg-rose-500' };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
      <div className={cn('h-full rounded-full', couleurs[ton])} style={{ width: `${p}%` }} />
    </div>
  );
}

export function Vide({ message, icone = '📭', action }: { message: string; icone?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl2 border border-dashed border-ink-200 bg-white/60 px-6 py-10 text-center">
      <p className="text-3xl">{icone}</p>
      <p className="mt-2 text-sm text-ink-500">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Montant({ valeur, gros = false }: { valeur: number; gros?: boolean }) {
  return (
    <span className={cn('font-mono tabular-nums', gros ? 'text-lg font-extrabold' : 'font-semibold')}>
      {fcfa(valeur)}
    </span>
  );
}

export function BandeauDemo({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
        Mode démonstration — données fictives
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <strong>Mode démonstration.</strong> Aucune base de données n’est branchée : les écrans utilisent des
      données fictives réalistes (Tchad, Cameroun, Bénin, Togo). Ajoutez <code>DATABASE_URL</code> dans Vercel
      pour passer en production réelle.
    </div>
  );
}

export function Cellule({
  principal,
  secondaire,
}: {
  principal: React.ReactNode;
  secondaire?: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-semibold text-ink-800">{principal}</div>
      {secondaire && <div className="text-xs text-ink-500">{secondaire}</div>}
    </div>
  );
}
