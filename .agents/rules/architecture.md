---
description: Architecture d'MB Mustapha — couches de données, mode démonstration, argent en FCFA entiers
trigger: always_on
---

# Architecture MB Mustapha

## Chaîne d'accès aux données (à ne jamais court-circuiter)

```
Page (app/**/page.tsx)  ou  Route API (app/api/**/route.ts)
        │
        ▼
lib/store.ts          ← SEUL point d'entrée métier (fonctions françaises : listInvoices, registerPayment…)
        │
        ├─▶ lib/db.ts  (getPrisma) ─▶ PostgreSQL (Prisma)
        └─▶ lib/demo-data.ts        ─▶ données fictives si DATABASE_URL absente
```

- **Interdit** : `import { PrismaClient } from '@prisma/client'` dans une page ou un composant.
- **Interdit** : écrire de la logique métier dans un composant React.
- **Obligatoire** : toute nouvelle fonctionnalité métier s'ajoute dans `lib/store.ts`
  (avec les deux branches : Prisma **et** démonstration).

## Mode démonstration (non négociable)

`lib/db.ts → baseConfiguree()` renvoie `false` si `DATABASE_URL` est vide. Dans ce cas, `getPrisma()`
renvoie `null` et le store sert `lib/demo-data.ts` (5 entreprises, ~17 factures, tontines, stock…).
Cela permet de :

1. builder sur Vercel sans base (le jour de la mise en ligne),
2. faire une démonstration client en 30 secondes,
3. tester l'interface sans risque de casser des données réelles.

Toute nouvelle fonction du store **doit** prévoir les deux branches.

## Argent et fiscalité

- Montants : entiers en FCFA (`Int`), jamais de centimes, jamais de `Float`.
- Affichage : `fcfa(24900)` → « 24 900 FCFA » (utilise `Intl.NumberFormat('fr-FR')`).
- TVA par pays dans `lib/config.ts` : Cameroun 19,25 % · Tchad / Bénin / Togo 18 % · Niger 19 %.
- Devises : `XAF` (CEMAC : Tchad, Cameroun, Gabon) et `XOF` (UEMOA : Bénin, Togo, Sénégal, Côte d'Ivoire).

## Rôles

| Rôle | Accès | Interface |
|---|---|---|
| `OWNER` | toutes les entreprises, revenus du SaaS | `/admin` (privée, + code `ADMIN_PASSCODE`) |
| `CLIENT_ADMIN` | son entreprise uniquement | `/tableau-de-bord` (publique) |
| `CLIENT_USER` | son entreprise, droits réduits | `/tableau-de-bord` |

Le contrôle est centralisé dans `lib/api.ts → resoudreOrgId()` et `lib/api.ts → exigerOwner()`.
