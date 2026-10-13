---
description: Règles d'interface pour l'Afrique — mobile d'abord, réseau faible, français, FCFA, pas d'images lourdes
trigger: always_on
---

# Interface : conçue pour un téléphone d'entrée de gamme

## Contraintes réelles à respecter

- Écran de référence : **360 × 640 px**, Android d'entrée de gamme, souvent en 3G instable.
- Poids : aucune police externe, aucune image bitmap lourde, aucune librairie d'icônes.
  Icônes = **émojis** ; logo = **SVG inline** (`components/Logo.tsx`).
- Tableaux : toujours enveloppés dans `<div className="scroll-x">` avec `min-w-[…]` pour un défilement
  horizontal propre plutôt qu'une mise en page cassée.
- Formulaires : gros boutons (`btn`, `btn-sm`), labels courts en majuscules (`label`), messages de retour
  immédiats (`Flash` dans `components/forms-app.tsx`).

## Ton et langue

- Français simple, phrases courtes, pas de jargon technique dans l'interface **client**.
- Les messages d'erreur expliquent **quoi faire** (« Ajoutez MAKE_WEBHOOK_RELANCE dans Vercel »),
  pas seulement ce qui a échoué.
- Devise affichée partout en FCFA via `fcfa()`. Jamais d'euro dans l'interface ; les conversions en euros
  ne servent que dans la documentation.
- Écrire « N’Djaména » avec l'apostrophe typographique, « Bénin », « Togo », « Cameroun » correctement.

## Classes du design system (`app/globals.css`)

| Classe | Usage |
|---|---|
| `card`, `card-tight` | conteneurs blancs arrondis avec ombre |
| `btn-primary` | action principale (vert) |
| `btn-accent` | action commerciale (ambre) |
| `btn-ghost`, `btn-dark`, `btn-sm` | actions secondaires |
| `input`, `textarea`, `select`, `label` | formulaires |
| `badge-green/amber/red/blue/gray` | statuts (via `BadgeStatut`) |
| `table`, `lien`, `scroll-x` | listes, liens, tableaux larges |

Couleurs : palette `brand` (vert) pour l'argent qui rentre, `accent` (ambre) pour les actions commerciales,
`ink` pour les neutres. Ne pas introduire de nouvelles couleurs sans raison.

## Toujours penser « impression »

Les reçus et factures utilisent la classe `no-print` sur les éléments à masquer (boutons, navigation) et
`BoutonImprimer` (`components/print-button.tsx`). Un client doit pouvoir imprimer un reçu lisible
**en noir et blanc** depuis un cybercafé.
