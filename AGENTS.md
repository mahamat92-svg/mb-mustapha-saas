# AGENTS.md — MB Mustapha (SaaS de gestion pour PME d'Afrique)

> Ce fichier est lu automatiquement par **Google Antigravity**, Cursor, Claude Code et les autres
> agents de codage. Il décrit le projet, les règles à respecter et la façon de travailler.
> Version : 1.0 — Projet : SaaS « MB Mustapha » (facturation, recouvrement, tontines, stock, paie,
> Mobile Money FCFA, automatisation Make.com).

---

## 1. En une phrase

MB Mustapha est un SaaS **Next.js 15 (App Router) + TypeScript + Tailwind + Prisma/PostgreSQL** qui aide les
PME du Tchad, du Cameroun, du Bénin et du Togo à facturer, encaisser en FCFA (Mobile Money) et automatiser
leurs relances via **Make.com**. Il possède **deux interfaces** : une **publique** pour les entreprises
clientes (`/tableau-de-bord`) et une **privée** pour l'éditeur (`/admin`, protégée par un code).

## 2. Commandes

```bash
npm install            # installer les dépendances
npm run dev            # http://localhost:3000 (fonctionne SANS base de données)
npm run build          # build de production (identique à ce que fait Vercel)
npx prisma db push     # créer/mettre à jour les tables (nécessite DATABASE_URL)
node scripts/seed.mjs  # remplir la base avec les données de démonstration
node scripts/make-test.mjs ping   # tester la connexion Make.com
```

## 3. Architecture (à respecter absolument)

```
app/                     Pages (App Router) + routes API
  page.tsx               Landing publique
  fonctionnalites/       Les 10 modules (détail, SEO)
  marche/                Étude de marché + scénarios de revenus
  tarifs/                Grille tarifaire FCFA
  connexion/             Connexion client (publique)
  inscription/           Création de compte client (essai 14 jours)
  espace-prive/          Porte d'entrée de l'interface PRIVÉE (code requis)
  assistant/             Guide & schéma de connexion Make.com
  tableau-de-bord/       ESPACE CLIENT : dashboard
  factures/ clients/ stock/ tontines/ messages/ paiements/ abonnement/
  admin/                 ESPACE PRIVÉ : pilotage, clients, revenus, make, parametres
  api/                   API REST (voir §5)
components/              UI réutilisable (ui.tsx, forms-auth.tsx, forms-app.tsx, ...)
lib/                     Coeur métier : config, store, make, paiements, auth, db, types
prisma/schema.prisma     Modèle de données PostgreSQL
make-blueprints/         Scénarios Make.com prêts à importer
docs/                    Documentation (déploiement, Make, business plan…)
scripts/                 seed.mjs, make-test.mjs
```

### Règle d'or n°1 : le portail `lib/store.ts`
Toutes les pages et toutes les routes passent par `lib/store.ts`. **Ne jamais appeler Prisma directement
depuis une page.** Raison : l'application doit continuer à fonctionner en **mode démonstration** quand
`DATABASE_URL` est absente (c'est un argument de vente : elle démarre en 30 secondes chez un prospect).

### Règle d'or n°2 : l'argent est un entier
Tous les montants sont des **entiers en FCFA** (`Int` en base, jamais de `Float`, jamais de centimes).
Affichage via `fcfa()` de `lib/utils.ts` (format `24 900 FCFA`).

## 4. Conventions

- **Langue** : tout le code, les commentaires, l'interface et les messages d'erreur sont **en français**
  (l'utilisateur final est francophone). Noms de variables/fonctions en français quand c'est du métier
  (`facture`, `montant`, `tranchePaiement`), en anglais quand c'est technique (`route`, `handler`).
- **Accents** : les fichiers de code restent en ASCII dans les identifiants ; les textes affichés portent
  les accents normaux (N’Djaména, Bénin…). Utilisez l'apostrophe typographique `’` dans les textes.
- **Composants** : serveur par défaut ; `'use client'` seulement pour les formulaires et interactions
  (`components/forms-*.tsx`, `components/dashboard-shell.tsx`, `components/calculateur.tsx`).
- **Styles** : classes du design system dans `app/globals.css` (`card`, `btn-primary`, `input`,
  `badge-green`, `table`, `lien`…). Pas de CSS inline sauf pour les barres de progression.
- **Mobile d'abord** : tout écran doit être lisible sur un téléphone d'entrée de gamme (écran 360 px).
  Les tableaux utilisent la classe `scroll-x` (défilement horizontal) plutôt que de casser la mise en page.
- **Poids** : pas d'image lourde, pas de police externe, pas de librairie d'icônes. Émojis et SVG inline.

## 5. API REST (source de vérité)

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/health` | état du service + intégrations |
| POST | `/api/auth` | connexion / déconnexion / inscription |
| GET | `/api/v1/stats` | indicateurs d'une entreprise |
| GET/POST | `/api/v1/clients` | liste / création client |
| GET/POST | `/api/v1/factures` | liste / création facture (TVA auto) |
| POST | `/api/v1/factures/relancer` | déclenche les relances Make |
| GET/POST | `/api/v1/paiements` | transactions / encaissement |
| GET/POST | `/api/v1/stock` | inventaire / mouvement (+ alerte Make) |
| GET/POST | `/api/v1/tontines` | groupes / cotisation (+ SMS) |
| GET/POST | `/api/v1/messages` | historique / envoi ou campagne |
| GET/POST | `/api/v1/abonnements` | abonnements du SaaS / souscription |
| GET | `/api/v1/organisations` | entreprises clientes (OWNER uniquement) |
| POST | `/api/v1/demo` | réinitialiser la démo |
| GET | `/api/cron/relances` | tâche planifiée 7h (relances, stock, rapports) |
| POST | `/api/webhooks/make` | **entrant** depuis Make (clé API + HMAC) |
| POST | `/api/webhooks/paiement` | callback agrégateur Mobile Money |

Sécurité : chaque route vérifie la session ; un client ne peut jamais atteindre les données d'un autre
(`resoudreOrgId()` dans `lib/api.ts`). Les appels machine (Make) utilisent `Authorization: Bearer AFRIFLOW_API_KEY`
et une signature `x-afriflow-signature` (HMAC SHA-256).

## 6. Ce qu'il ne faut JAMAIS faire

- ❌ Supprimer le mode démonstration (l'app doit builder et tourner sans `DATABASE_URL`).
- ❌ Écrire des secrets en dur : toujours `process.env.*` et `@/lib/config.ts`.
- ❌ Introduire des montants en `Float` ou en euros pour les prix (tout est en FCFA entiers).
- ❌ Envoyer un paiement à Make **sans** vérifier la signature / le statut de la transaction.
- ❌ Relancer une facture plus de 4 fois automatiquement (règle anti-harcèlement dans `/api/cron/relances`).
- ❌ Ajouter une dépendance lourde (chart.js, moment, librairie d'icônes) : le public cible a un réseau faible.
- ❌ Casser le rôle `OWNER` : c'est le seul à voir `/admin` et les données de tous les clients.

## 7. Feuille de route technique (si vous devez prolonger le projet)

1. **Export comptable** : générer un `.xlsx` SYSCOHADA depuis `lib/store.ts` (module Conformité+).
2. **Mode hors-ligne complet** : service worker + IndexedDB pour le module stock.
3. **Paie multi-pays** : tables de cotisations CNPS/CNSS/IRPP par pays dans `lib/config.ts`.
4. **Codes revendeurs** : ajouter `refCode` sur `Organization` + calcul de commission dans `/admin/revenus`.
5. **Reçus PDF serveur** : `@react-pdf/renderer` ou HTML → print (déjà prévu côté impression).
6. **Facture normalisée** : export e-MECeF (Bénin) et OTR (Togo) pour anticiper l'obligation légale.

## 8. Vérifications avant de livrer

```bash
npm run build                      # doit passer
node scripts/make-test.mjs ping    # doit répondre 200 (après npm run dev)
```
Parcours à tester à la main : `/` → `/tarifs` → `/inscription` (créer un compte) → `/tableau-de-bord`
→ créer un client → créer une facture → relancer → `/admin` (valider un paiement) → `/abonnement`.
