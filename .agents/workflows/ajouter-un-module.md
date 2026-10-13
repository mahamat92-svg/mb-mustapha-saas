---
description: Ajouter ou modifier un module métier (facturation, tontine, stock…) dans MB Mustapha sans casser l'existant
---

# Workflow : ajouter un module métier

Un « module » = une douleur client + un écran + des fonctions dans le store + éventuellement un événement Make.

## 1. Le déclarer dans la configuration

`lib/config.ts → MODULES` : ajouter une entrée avec `id`, `code`, `name`, `icon` (émoji), `tagline`,
`probleme`, `solution`, `impact`, `features[]`, `pays[]`, `planMin`. Il apparaîtra automatiquement sur
`/fonctionnalites`, `/tableau-de-bord` (grille des modules) et `/assistant`.

Si le module change la grille tarifaire, ajuster `maxModules` dans `PLANS`.

## 2. Modéliser les données

`prisma/schema.prisma` : ajouter le modèle (montants en `Int`), avec `orgId` + `@@index([orgId])`.
Puis :
```bash
npx prisma db push        # ou npx prisma migrate dev --name ajout_module
npx prisma generate
```

## 3. Écrire les fonctions du store

Dans `lib/store.ts`, ajouter les fonctions (ex. `listX(orgId)`, `createX(orgId, data)`) **avec les deux
branches** : Prisma (`if (!db) {...}` pour la démonstration, puis le chemin réel). Ajouter des données
fictives crédibles dans `lib/demo-data.ts` (noms locaux, montants en FCFA réalistes).

## 4. Exposer une API

Créer `app/api/v1/<module>/route.ts` sur le modèle de `app/api/v1/stock/route.ts` :
`handler()`, `exigerSession()`, `resoudreOrgId()`, `ok()/erreur()`. Dès qu'une action mérite d'être
automatisée, envoyer un événement : `envoyerAMake('<scenario>', '<evenement>', data, orgId)`.

## 5. Créer l'écran

`app/<module>/page.tsx` (espace client) : serveur, `requireSession()`, `DashboardShell` + `NAV_CLIENT`
(`lib/nav.ts`). Formulaires interactifs dans `components/forms-app.tsx` avec le hook `useAppel()`.
Penser mobile (`scroll-x`, `StatCard`, `BadgeStatut`).

## 6. Documenter

- `docs/PROBLEMES-AFRICAINS.md` : le problème client et le bénéfice mesurable.
- `README.md` : la ligne dans le tableau des modules.
- Scénario Make correspondant dans `make-blueprints/` s'il y a automatisation.

## 7. Vérifier

```bash
npm run build
node scripts/make-test.mjs ping
```
Parcours manuel : créer une donnée → la voir dans l'écran → déclencher l'automatisation → vérifier
`/admin/make` (journal) → vérifier qu'aucune autre entreprise ne voit ces données.
