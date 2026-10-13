# MB Mustapha — SaaS de gestion, facturation et Mobile Money pour les PME d'Afrique

> **Factures, recouvrement, tontines, stock, paie, assistant WhatsApp… en FCFA, en français, même avec une
> connexion faible.** Prêt pour **Google Antigravity** (règles `AGENTS.md` incluses), déployable sur
> **Vercel** en moins de 15 minutes, conçu pour le **Tchad, le Cameroun, le Bénin, le Togo** et au-delà.

---

## 1. Ce que vous obtenez

| Élément | Détail |
|---|---|
| **Deux interfaces** | 🔒 **Privée** (`/admin` + code confidentiel) pour vous, l'éditeur du SaaS · 🌍 **Publique** (`/tableau-de-bord`) pour vos entreprises clientes |
| **10 modules métier** | FactuGo, RecouveMax, NjangiPro (tontines), BoutiqueStock, PaieLocal, MotoTrack, ScolaPay, AgriMarché, AfriBot (IA WhatsApp), Conformité+ |
| **5 offres en FCFA** | Découverte (0) · Starter 9 900 · Pro 24 900 · Business 59 900 · Coopérative 149 000 FCFA/mois |
| **Paiements Mobile Money** | Kkiapay, CinetPay, PayDunya, Flutterwave + **encaissement manuel** (Airtel/Moov au Tchad) |
| **6 scénarios Make.com** | Relances, alerte stock, reçu de paiement, campagnes SMS/WhatsApp, rapport quotidien, AfriBot |
| **Blueprints Make** | 4 fichiers JSON prêts à importer dans `make-blueprints/` |
| **Mode démonstration** | L'application tourne **sans base de données** avec des données réalistes (argument de vente) |
| **PaieLocal complet** | CNPS/CNSS + IRPP/ITS par pays, bulletins imprimables, pointage des journaliers, coût employeur, simulateur brut → net (testé : `npm run test:paie`) |
| **ScolaPay complet** | Frais scolaires : échéancier automatique par élève (2 à 4 tranches), reçu numéroté, message au parent, rappels J−7 et relances des retards, tableau de recouvrement par classe, situation imprimable (`docs/SCOLAPAY.md`) |
| **Marque blanche** | Le SaaS est vendu sous VOTRE nom : `node scripts/rebrand.mjs --nom "Mon SaaS"` renomme tout (logo SVG, palette, PWA, textes) |
| **Prospection prête** | `docs/PROSPECTION-30-CLIENTS.md` + `prospection/plan-30-clients.csv` : vos 30 premiers clients, ville par ville, scripts mot pour mot |
| **Documentation** | `docs/` : déploiement, Make, architecture, business plan, guide client, paie CNPS/IRPP, ScolaPay, WhatsApp Business, prospection |

## 2. Démarrage en 3 commandes

```bash
npm install
npm run dev          # http://localhost:3000  (aucune base requise : mode démonstration)
npm run build        # vérifier la compilation avant de déployer
```

### Comptes de démonstration

| Espace | Identifiants | Où |
|---|---|---|
| 🌍 Client (Tchad) | `demo@mbmustapha.com` / `demo2026` | `/connexion` |
| 🌍 Client (Cameroun) | `douala@mbmustapha.com` / `demo2026` | `/connexion` |
| 🌍 Client (Bénin) | `cotonou@mbmustapha.com` / `demo2026` | `/connexion` |
| 🎓 École (Togo) — ScolaPay | `ecole@mbmustapha.com` / `demo2026` | `/scolarite` |
| 🔒 Propriétaire du SaaS | `patron@mbmustapha.com` / `patron2026` + code `PATRON-2026` | `/espace-prive` |

> ⚠️ Ces mots de passe sont des valeurs **de démonstration**. Changez-les (`ADMIN_PASSCODE`, `AUTH_SECRET`,
> et les comptes en base) avant toute mise en production.

## 3. Les deux interfaces

### 🔒 Interface privée — pour vous (l'éditeur)

`/espace-prive` (porte d'entrée) → `/admin`

- **Pilotage** : MRR, ARR, panier moyen, progression vers l'objectif des 100 clients, alertes.
- **Entreprises clientes** : changer une offre, activer un abonnement, suspendre un compte en retard.
- **Validation des paiements** Mobile Money reçus manuellement (Airtel, Moov, virement) en un clic.
- **Make.com & journal** : tous les échanges entrants/sortants, tests des scénarios, taux d'erreur.
- **Paramètres & clés** : état des intégrations, liste de contrôle de mise en production, marque blanche.

Trois barrières protègent cet espace : rôle `OWNER` en base + mot de passe + **code confidentiel**
(`ADMIN_PASSCODE`).

### 🌍 Interface publique — pour vos clients

`/tableau-de-bord` (et pages associées) :

| Page | Contenu |
|---|---|
| `/tableau-de-bord` | CA, encaissé, impayé, taux de recouvrement, alertes stock, modules actifs |
| `/factures` + `/factures/[id]` | création (TVA automatique du pays), filtres, **reçu imprimable + QR de vérification**, relance en un clic |
| `/clients` | fichier clients, encours par client, priorités de relance, messages groupés |
| `/stock` | inventaire, seuils, mouvements ±, alerte automatique au fournisseur |
| `/tontines` | cagnottes, tours, cotisations, SMS de confirmation aux membres |
| `/scolarite` + `/scolarite/[id]` | 🎓 école : encaissé / reste / taux de recouvrement, retards à relancer, encaissement rapide, inscription d'élève, **fiche élève imprimable** pour le parent |
| `/messages` | envoi SMS/WhatsApp, historique, coûts indicatifs |
| `/paiements` | transactions Mobile Money, codes USSD du pays, déclaration d'un paiement |
| `/abonnement` | offre en cours, changement d'offre, paiement FCFA |

Pages publiques marketing : `/` · `/fonctionnalites` · `/marche` · `/tarifs` · `/inscription` · `/assistant`.

## 4. Les 10 modules (problème → solution)

| Module | Problème africain réglé | Offre minimum |
|---|---|---|
| 🧾 **FactuGo** | carnets manuscrits, TVA approximative, reçus contestés | Starter |
| ⏰ **RecouveMax** | impayés qui dorment, patron qui n'ose pas relancer | Starter |
| 🤝 **NjangiPro** | tontines/njangi non tracées, disputes de cotisations | Pro |
| 📦 **BoutiqueStock** | ruptures, coulage, inventaire « au feeling » | Starter |
| 👷 **PaieLocal** | journaliers, heures disputées, CNPS/CNSS + IRPP/ITS mal calculés → **barèmes des 4 pays, bulletin imprimable, coût employeur** (`docs/PAIE-CNPS-IRPP.md`) | Pro |
| 🏍️ **MotoTrack** | recettes des moto-taxis non remises, courses non tracées | Pro |
| 🎓 **ScolaPay** | frais scolaires payés en retard, reçus perdus | Pro |
| 🌾 **AgriMarché** | pesées sur papier, producteurs payés des semaines plus tard | Business |
| 🤖 **AfriBot** | questions clients sans réponse, commandes WhatsApp perdues | Pro |
| 📊 **Conformité+** | échéances fiscales oubliées, pénalités DGI/OTR | Pro |

Détail complet (problème, fonctionnalités, impact, pays) : `/fonctionnalites` et `docs/PROBLEMES-AFRICAINS.md`.

## 5. Architecture technique

```
Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS
Prisma + PostgreSQL (Neon / Supabase)      ← optionnel : mode démonstration sans base
jose (JWT) + bcryptjs                      ← sessions httpOnly, mots de passe hachés
Make.com (webhooks signés HMAC SHA-256)    ← automatisation WhatsApp / SMS / Sheets / IA
Vercel (hébergement + cron 07:00)          ← /api/cron/relances
```

```
app/             Pages publiques, espace client, espace privé /admin, API REST
components/      UI réutilisable (design system minimal, sans dépendance d'icônes)
lib/config.ts    ⭐ marque, 5 offres, 10 modules, 9 pays, opérateurs, scénarios Make
lib/store.ts     ⭐ couche de données unifiée (Prisma OU mode démonstration)
lib/make.ts      signature HMAC, envoi d'événements, payloads prêts
lib/paiements.ts agrégateurs Mobile Money, USSD, vérification des callbacks
lib/paie.ts      ⭐ moteur de paie : CNPS/CNSS, abattement, IRPP/ITS, bulletin
prospection/     plan des 30 premiers clients + suivi journalier (CSV)
prisma/          schéma PostgreSQL (montants en entiers FCFA)
make-blueprints/ 4 scénarios Make importables
docs/            déploiement, Make, architecture, business plan, guide client, paie, prospection
scripts/         seed.mjs (base), make-test.mjs (Make), calcul-paie.mjs (vérifier la paie), rebrand.mjs (renommer le SaaS)
```

Points forts : **montants en FCFA entiers** (pas de flottants), **contrôle d'accès par organisation**
(un client ne voit jamais les données d'un autre), **mode démonstration** intégré, **aucune dépendance
lourde** (chargement rapide en 3G).

## 6. Connecter Make.com (le cœur de l'automatisation)

1. Sur make.com : **Scenarios → Create → Webhooks → Custom webhook** → copier l'adresse.
2. Dans Vercel → Environment Variables : `MAKE_WEBHOOK_RELANCE` (puis `_STOCK`, `_PAIEMENT`,
   `_MESSAGE`, `_RAPPORT`, `_GENERIC`) = ces adresses. Redéployer.
3. Ajouter `MAKE_WEBHOOK_SECRET` (signature HMAC) et `AFRIFLOW_API_KEY` (clé que Make utilise pour
   appeler MB Mustapha).
4. Importer les blueprints de `make-blueprints/` (01 à 04) ou créer les scénarios à la main.
5. Tester :

```bash
npm run dev
node scripts/make-test.mjs ping
node scripts/make-test.mjs paiement.reussi
```

**Sans aucune configuration Make, l'application fonctionne** : les événements sont écrits dans le journal
interne (`/admin/make`) au lieu d'être envoyés. Vous pouvez donc vendre et démontrer avant d'avoir tout branché.

Schéma complet : `docs/CONNEXION-MAKE.md` · schéma visuel : `docs/SCHEMA-MAKE.md` · page publique : `/assistant`.

## 7. Déployer sur Vercel (résumé)

```bash
git init && git add . && git commit -m "MB Mustapha v1"
git remote add origin git@github.com:VOTRE_COMPTE/afriflow.git && git push -u origin main
```

1. vercel.com → **Add New → Project → Import** votre dépôt (Vercel détecte Next.js).
2. Créer une base gratuite sur **neon.tech** → copier l'URL → la coller dans `DATABASE_URL` (Vercel).
3. En local, avec l'URL de production :
   ```bash
   DATABASE_URL="postgresql://…" npx prisma db push
   DATABASE_URL="postgresql://…" node scripts/seed.mjs
   ```
4. Renseigner les variables d'environnement (voir `.env.example`) puis redéployer.
5. Vérifier `https://votre-app.vercel.app/api/health` → `"ok": true`.

Détail pas à pas + dépannage : `docs/DEPLOIEMENT.md`.

## 8. Variables d'environnement

Toutes sont **facultatives pour démarrer** (mode démonstration), mais indispensables avant de facturer :

| Variable | Utilité |
|---|---|
| `DATABASE_URL` | PostgreSQL (Neon/Supabase) — active les vraies données |
| `AUTH_SECRET` | signature des sessions (`openssl rand -base64 32`) |
| `ADMIN_PASSCODE` | code confidentiel de l'espace privé |
| `AFRIFLOW_API_KEY` | clé que Make.com présente à votre API |
| `MAKE_WEBHOOK_SECRET` | signature HMAC des échanges |
| `MAKE_WEBHOOK_RELANCE / _STOCK / _PAIEMENT / _MESSAGE / _RAPPORT / _GENERIC` | URLs des scénarios Make |
| `CRON_SECRET` | protège la tâche planifiée de 7h |
| `KIIAPAY_*` ou `CINETPAY_*` ou `PAYDUNYA_*` ou `FLUTTERWAVE_*` | encaissement Mobile Money automatique |
| `WHATSAPP_TOKEN`, `AFRICASTALKING_*` | envoi WhatsApp / SMS (utilisés par Make) |
| `MANUAL_PAYMENT_NUMBER`, `MANUAL_PAYMENT_NAME` | numéro marchand affiché au Tchad |
| `NEXT_PUBLIC_BRAND_NAME`, `_SIGLE`, `_BASELINE`, `_COLOR`, `_ACCENT`, `_LOGO` | **marque blanche** : nom, sigle du logo, baseline, couleur (un seul hex génère les tons 50→900), logo personnalisé |
| `NEXT_PUBLIC_FOUNDER_NAME`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_SUPPORT_WHATSAPP` | signature, e-mail et WhatsApp affichés aux clients |
| `NEXT_PUBLIC_APP_URL` | URL publique (liens des factures, QR de vérification, domaine affiché) |

## 8 bis. Votre marque : « MB Mustapha » (et comment la changer en une commande)

Le produit porte **votre nom** : **MB Mustapha** (sigle **MB** pour le logo et l'icône), signé
**Mahamat Bouba Mustapha** comme fondateur. Dans le commerce sahélien, c'est un argument de vente : un client
qui lit votre nom sur une facture sait qui appeler si quelque chose ne va pas.

Tout est piloté par variables d'environnement — rien n'est codé en dur. La commande déjà utilisée :

```bash
node scripts/rebrand.mjs --nom "MB Mustapha" --sigle MB --couleur "#1d4ed8" --accent "#f59e0b" \
  --fondateur "Mahamat Bouba Mustapha" --email "contact@mbmustapha.com" --domaine "mbmustapha.com"
```

Elle écrit `.env.local`, régénère **app/icon.svg** et **public/icon.svg** (favicon + icône du téléphone) et
rappelle ce qu'il reste à renseigner. Pour changer de nom plus tard (créer une société, marque plus neutre) :

```bash
node scripts/rebrand.mjs --nom "Sahel Gestion" --sigle SG
node scripts/rebrand.mjs --nom "Njangi Manager" --sigle NM --couleur "#0f766e"
```

Ensuite : reporter les mêmes variables dans Vercel → **Settings → Environment Variables** (Production +
Preview) → **Redeploy**. Les pages lisent toutes `BRAND` (`lib/config.ts`), `tailwind.config.ts`,
`app/manifest.ts` et `components/Logo.tsx` : aucun texte de marque n'est écrit en dur.

> ⚠️ **Le seul champ qui reste à remplir : `NEXT_PUBLIC_SUPPORT_WHATSAPP`** — votre numéro WhatsApp
> professionnel. Il apparaît dans l'application, sur les factures, dans les flyers et dans le script de
> prospection. Donnez-le moi et je régénère tout d'un coup.

## 8 ter. Vos 30 premiers clients (prospection terrain)

| Fichier | Contenu |
|---|---|
| `docs/PROSPECTION-30-CLIENTS.md` | plan complet : 30 cibles réparties **ville par ville** (Tchad, Cameroun, Bénin, Togo), 7 scripts mot pour mot (porte-à-porte, appel, WhatsApp, démonstration 7 min, tontine, école, relance/fermeture), 10 objections et leurs réponses, règles de prix, onboarding 48 h, erreurs à éviter, signature de l'auteur |
| `prospection/plan-30-clients.csv` | le tableau des 30 cibles à ouvrir dans Excel/Sheets (colonnes à remplir : contact, date, statut, relance) |
| `prospection/suivi-journalier.csv` | 60 lignes pour noter chaque jour : contacts, démonstrations, essais, clients signés, montant signé |
| `flyers/flyers-a4.html` | **5 pages prêtes à imprimer** : 4 flyers A4 (commerçants, écoles, coopératives/tontines, employeurs-paie) + 10 cartes de visite — ouvrir dans le navigateur, Ctrl+P, A4, couleurs |

Objectif chiffré : **10 contacts/jour ouvré → ~10 clients payants/mois → 30 clients en 10 à 12 semaines**.

## 9. Faire de l'argent avec ce SaaS

1. **Abonnements FCFA** (source principale) — 100 clients ⇒ ≈ **1,83 M FCFA / mois** de revenus récurrents
   (calcul exact dans `/marche`).
2. **Packs SMS** revendus avec marge (12 500 FCFA / 500 SMS).
3. **Installation & formation** : 50 000 → 250 000 FCFA par client.
4. **Revendeurs agréés** (cabinets comptables, cybercafés, techniciens) : 30 % la 1ʳᵉ année.
5. **Sur-mesure / ONG / bailleurs** : projets à partir de 500 000 FCFA.

Stratégie de vente, cibles par pays et objectifs à 12 mois : `docs/PLAN-AFFAIRES.md`.

## 10. Travailler avec Google Antigravity

Le projet contient les fichiers de règles attendus par Antigravity :

| Fichier | Rôle |
|---|---|
| `AGENTS.md` | règles principales (architecture, conventions, interdits, vérifications) |
| `GEMINI.md` | consignes spécifiques Antigravity (français, planifier avant d'exécuter, vérifier) |
| `.agents/rules/architecture.md` | couche de données, mode démonstration, FCFA entiers |
| `.agents/rules/securite-make.md` | webhooks, HMAC, validation des paiements, anti-harcèlement |
| `.agents/rules/ui-afrique.md` | mobile d'abord, réseau faible, design system |
| `.agents/workflows/deployer-sur-vercel.md` | commande : *déployer sur Vercel* |
| `.agents/workflows/connecter-make.md` | commande : *connecter Make.com* |
| `.agents/workflows/ajouter-un-module.md` | commande : *ajouter un module métier* |

**Procédure recommandée** : importer le dossier dans Antigravity → demander « lis AGENTS.md puis propose un
plan pour déployer » → valider le plan → laisser exécuter → demander `npm run build` comme vérification.

## 11. Feuille de route suggérée

- **Semaine 1** : brancher la base, changer les secrets, s'imprégner des écrans avec 3 vrais commerçants.
- **Semaine 2** : activer Make (relance WhatsApp + SMS), faire 10 démonstrations terrain.
- **Semaine 3** : activer une passerelle Mobile Money (Kkiapay au Bénin/Togo, CinetPay au Cameroun).
- **Mois 2** : recruter 3 revendeurs (cabinet comptable, cybercafé, technicien), pack École.
- **Mois 3** : pack Coopérative/Tontine + formation sur site, viser les 30 premiers clients payants en
  appliquant `docs/PROSPECTION-30-CLIENTS.md`.
- **Le module qui fait signer les patrons avec salariés** : PaieLocal (bulletins CNPS/IRPP) — argument massue
  lors des démonstrations, voir `docs/PAIE-CNPS-IRPP.md`.

## 12. Licence et usage

Projet livré pour votre usage commercial. Vous êtes libre de le modifier, le rebaptiser (marque blanche) et
le revendre. Les marques citées (Airtel, MTN, Orange, Moov, Wave, Make, Vercel, Kkiapay, CinetPay…) et le
QR de vérification (api.qrserver.com) appartiennent à leurs propriétaires respectifs : vérifiez les
conditions d'utilisation avant une exploitation commerciale à grande échelle.
