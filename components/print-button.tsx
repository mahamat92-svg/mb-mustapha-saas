'use client';

export function BoutonImprimer({ libelle = '🖨️ Imprimer / PDF' }: { libelle?: string }) {
  return (
    <button className="btn-ghost btn-sm no-print" onClick={() => window.print()}>
      {libelle}
    </button>
  );
}

export function BoutonCopier({ texte, libelle = '🔗 Copier le lien' }: { texte: string; libelle?: string }) {
  return (
    <button
      className="btn-ghost btn-sm no-print"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texte);
          alert('Lien copié :\n' + texte);
        } catch {
          alert(texte);
        }
      }}
    >
      {libelle}
    </button>
  );
}
