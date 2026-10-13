# Architecture technique d'MB Mustapha

## 1. Pile technique

| Couche | Technologie | Pourquoi ce choix |
|---|---|---|
| Framework | **Next.js 15** (App Router) | rendu serveur + routes API dans un seul projet, déploiement Vercel natif |
| Langage | **TypeScript** | sécurité sur les montants et les types métier |
| UI | **React 19 + Tailwind CSS 3** | pas de librairie de composants lourde (réseau faible) |
| Base | **PostgreSQL** via **Prisma** | standard, gratuit chez Neon/Supabase, montants en entiers |
| Auth | **jose** (JWT) + **bcryptjs** | cookie httpOnly, mots de passe hachés, 3 rôles |
| Automatisation | **Make.com** (webhooks signés HMAC) | WhatsApp/SMS/Sheets/IA sans écrire d'intégrations |
| Paiement | **Kkiapay, CinetPay, PayDunya, Flutterwave** + manuel | couverture CEMAC + UEMOA + secours Tchad |
| Hébergement | **Vercel** (+ cron 07:00) | gratuit au démarrage, CDN mondial |

**Dépendances volontairement absentes** : aucune librairie d'icônes, aucun composant UI externe, aucune
librairie de graphiques, aucune police web. Résultat : chargement rapide en 3G et empreinte disque minimale.

## 2. Arborescence

```
mb-mustapha-saas/
├── app/
│   ├── page.tsx                     Landing publique (10 modules, tarifs, double interface)
│   ├── fonctionnalites/             Détail des 10 modules (SEO)
│   ├── marche/                      Étude de marché + scénarios de revenus
│   ├── tarifs/                      Grille FCFA + comparatif + FAQ
│   ├── inscription/                 Création de compte client (essai 14 j)
│   ├── connexion/                   Connexion client (publique)
│   ├── espace-prive/                🔒 Porte de l'interface privée (code confidentiel)
│   ├── assistant/                   Guide & schéma Make.com (public)
│   ├── tableau-de-bord/             🌍 ESPACE CLIENT — indicateurs
│   ├── factures/  clients/  stock/  tontines/  messages/  paiements/  abonnement/
│   ├── scolarite/                  🎓 ScolaPay : tableau de bord école + fiche élève imprimable
│   ├── admin/                       🔒 ESPACE PRIVÉ : pilotage, clients, revenus, make, parametres
│   │   └── actions.ts               server actions sécurisées (validation, statuts, tests)
│   ├── api/                         voir §4 (18 routes, dont /api/v1/scolarite)
│   ├── layout.tsx  globals.css  icon.svg  error.tsx  not-found.tsx
├── components/
│   ├── ui.tsx                       Card, StatCard, BadgeStatut, Barre, Vide, Montant, BandeauDemo
│   ├── site-chrome.tsx              en-tête et pied de page publics
│   ├── dashboard-shell.tsx          coque des deux espaces (nav latérale, mobile)
│   ├── forms-auth.tsx               connexion, inscription, espace privé
│   ├── forms-app.tsx                facture, client, relance, stock, cotisation, message, abonnement
│   ├── paiement-libre.tsx           déclaration d'un encaissement
│   ├── paie-forms.tsx               pointage, génération de la paie, simulateur brut → net
│   ├── scolarite-forms.tsx          inscription d'élève, encaissement rapide, relances parents
│   ├── calculateur.tsx              calculateur de gain (argumentaire commercial)
│   ├── print-button.tsx             impression / copie de lien
│   └── Logo.tsx                     logo SVG inline
├── lib/
│   ├── config.ts          ⭐ marque, offres, modules, pays, opérateurs, scénarios Make
│   ├── store.ts           ⭐ couche de données unifiée (Prisma OU démonstration)
│   ├── demo-data.ts         jeu de données réalistes (5 entreprises, ~17 factures…)
│   ├── db.ts                getPrisma() + détection de la base
│   ├── make.ts              HMAC, envoi d'événements, payloads prêts à l'emploi
│   ├── paiements.ts         agrégateurs, USSD, vérification des callbacks, liens
│   ├── paie.ts             moteur PaieLocal (CNPS/CNSS, IRPP/ITS, journaliers)
│   ├── scolarite.ts        moteur ScolaPay (échéanciers, encaissements, relances parents)
│   ├── auth.ts              sessions JWT, rôles, hachage, code confidentiel
│   ├── api.ts               helpers des routes (ok, erreur, gardes, orgId)
│   ├── types.ts / types-fwd.ts   types partagés serveur / navigateur
│   ├── nav.ts               navigation des deux espaces
│   └── utils.ts             fcfa(), frDate(), invoiceNumber(), slug()…
├── prisma/schema.prisma             13 modèles, montants Int en FCFA
├── make-blueprints/                 4 scénarios Make importables
├── scripts/seed.mjs, calcul-paie.mjs, make-test.mjs, rebrand.mjs
├── prospection/                     30 premiers clients (CSV) + suivi journalier
├── docs/                            cette documentation
├── AGENTS.md · GEMINI.md · .agents/ règles et workflows Antigravity
└── .env.example · vercel.json · tailwind.config.ts · next.config.mjs
```

## 3. Flux applicatif type

```
Requête HTTP
   │
   ├─ Page (Server Component) ── requireSession() / requireOwner()  [lib/auth.ts]
   │        └─ lib/store.ts ──┬─ Prisma ──── PostgreSQL
   │                          └─ demo-data ─ jeu fictif (si DATABASE_URL absente)
   │
   └─ Route API ── handler() [lib/api.ts] ── exigerSession()/exigerOwner() + resoudreOrgId()
                     └─ lib/store.ts ── écriture + lib/make.ts (envoi Make signé)
```

## 4. API REST

| Méthode | Route | Garde | Description |
|---|---|---|---|
| GET | `/api/health` | publique | état du service, intégrations, offres |
| POST | `/api/auth` | publique | `connexion` / `deconnexion` / `inscription` |
| GET | `/api/v1/stats` | session | indicateurs (CA, encaissé, impayé, taux) |
| GET/POST | `/api/v1/clients` | session ou clé API | liste / création |
| GET/POST | `/api/v1/factures` | session ou clé API | liste / création (TVA automatique) |
| POST | `/api/v1/factures/relancer` | session | déclenche les relances (Make) |
| GET/POST | `/api/v1/paiements` | session ou clé API | transactions / encaissement |
| GET/POST | `/api/v1/stock` | session | inventaire / mouvement (+ alerte) |
| GET/POST | `/api/v1/tontines` | session | groupes / cotisation (+ SMS) |
| GET/POST | `/api/v1/messages` | session | historique / envoi ou campagne |
| GET/POST | `/api/v1/abonnements` | session | abonnements du SaaS / souscription |
| GET/POST | `/api/v1/scolarite` | session ou clé API | élèves, tranches, encaissements, synthèse / inscrire, encaisser, relancer |
| GET/POST | `/api/v1/paie` | session ou clé API | bulletins, pointage / génération de la paie du mois |
| GET | `/api/v1/paie/verifier` | session | 4 cas de référence (vérification des barèmes) |
| GET | `/api/v1/organisations` | **OWNER** | entreprises clientes + statistiques globales |
| POST | `/api/v1/demo` | publique | réinitialise la démonstration (bloqué si base) |
| GET | `/api/cron/relances` | `CRON_SECRET` | relances + alertes stock + rapports (7h) |
| POST | `/api/webhooks/make` | clé API + HMAC | événements venant de Make |
| POST | `/api/webhooks/paiement` | signature agrégateur | callback Mobile Money |

## 5. Sécurité

- **Sessions** : JWT HS256 dans un cookie `httpOnly` + `sameSite=lax` + `secure` en production (7 jours).
- **Mots de passe** : bcrypt (10 tours). En mode démonstration uniquement, comparaison en clair assumée.
- **Cloisonnement** : `resoudreOrgId()` empêche toute lecture d'une autre entreprise ;
  les pages re-vérifient l'appartenance de la ressource (`factures/[id]`).
- **Espace privé** : rôle `OWNER` + code `ADMIN_PASSCODE` (3ᵉ facteur léger).
- **Webhooks** : clé API `Bearer` + signature HMAC SHA-256 à comparaison à temps constant.
- **Paiements** : jamais crédités sans vérification du statut chez l'agrégateur ou validation humaine.
- **Journal d'audit** : tous les échanges Make sont conservés (table `WebhookLog`).

## 6. Performance et contraintes terrain

| Contrainte | Réponse technique |
|---|---|
| Réseau 3G instable | pages serveur compactes, aucune image bitmap, polices système |
| Téléphone bas de gamme | interface mobile-first, tableaux défilants, boutons larges |
| Pannes de courant | aucune donnée volatile côté client ; les actions sont idempotentes |
| Employés sans smartphone | confirmations par SMS (Make + Africa's Talking), pointage USSD |
| Zone sans agrégateur (Tchad) | mode de paiement manuel + validation en un clic par le propriétaire |
| Données en FCFA | entiers en base, formatage `fr-FR`, aucune décimale |

## 7. Extensions prévues (points d'ancrage déjà en place)

- **Export SYSCOHADA / Excel** : à brancher dans `lib/store.ts` (les agrégats existent déjà).
- **Mode hors-ligne complet** : `public/manifest.webmanifest` est en place ; ajouter un service worker.
- **Paiement des salaires en lot** : `lib/paiements.ts` peut boucler sur les employés.
- **Codes revendeurs** : ajouter `refCode` sur `Organization` + commission dans `/admin/revenus`.
- **Facture normalisée électronique** (e-MECeF Bénin, OTR Togo) : générer le format attendu depuis
  `lib/config.ts` (les paramètres fiscaux par pays y sont déjà centralisés).
