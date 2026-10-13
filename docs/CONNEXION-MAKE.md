# Connexion MB Mustapha ↔ Make.com — guide complet

> Make.com est l'**orchestrateur** : MB Mustapha détecte les événements métier, Make exécute les actions
> (WhatsApp, SMS, Google Sheets, IA, e-mails) et renvoie les résultats à MB Mustapha.
> Version visuelle et courte : page publique `/assistant`. Schémas : `docs/SCHEMA-MAKE.md`.

---

## 1. Schéma d'ensemble

```
┌──────────────────────────── VOTRE APPLICATION (Vercel) ────────────────────────────┐
│                                                                                    │
│  ESPACE PUBLIC (vos clients)         ESPACE PRIVÉ (vous)                           │
│  /tableau-de-bord  /factures         /admin  /admin/revenus  /admin/make           │
│           │                                  │                                     │
│           └───────────────┬──────────────────┘                                     │
│                           ▼                                                        │
│                 API MB Mustapha  /api/v1/...  (+ /api/cron/relances à 7h00)           │
│                           │                                                        │
│         BASE DE DONNÉES   │   PostgreSQL (Neon/Supabase)                           │
└───────────────────────────┼────────────────────────────────────────────────────────┘
                            │
        (1) SORTANT : MB Mustapha → Make          (2) ENTRANT : Make → MB Mustapha
        POST webhook signé HMAC SHA-256         POST /api/webhooks/make
        Header: x-afriflow-signature            Header: Authorization: Bearer AFRIFLOW_API_KEY
                            │                                   ▲
                            ▼                                   │
        ┌───────────────────────────────────────────────────────────────────────┐
        │                          M A K E . C O M                              │
        │  Scénario 1  Relance impayés        Scénario 4  Campagnes SMS/WhatsApp │
        │  Scénario 2  Alerte stock           Scénario 5  Rapport quotidien 7h   │
        │  Scénario 3  Paiement Mobile Money  Scénario 6  AfriBot WhatsApp       │
        └───────────────────────────────────────────────────────────────────────┘
                 │                 │                  │                │
                 ▼                 ▼                  ▼                ▼
          WhatsApp client     SMS gérant       Google Sheet      Mobile Money
          + reçu PDF          fournisseur      (journal)         Airtel/MTN/Orange
                 │                                                   │
                 └──────── (3) Le client paie → callback agrégateur ─┘
                                    → Make vérifie
                                    → POST /api/v1/paiements (clé API)
                                    → facture « PAYÉE » + reçu au client
```

---

## 2. Ce qu'MB Mustapha envoie à Make (sens SORTANT)

Chaque événement part en `POST` vers l'URL de webhook du scénario correspondant, avec ce corps :

```json
{
  "source": "afriflow",
  "event": "facture.en_retard",
  "scenario": "1. Relance des factures impayées",
  "orgId": "org_ndjamena",
  "sentAt": "2026-02-11T07:00:00.000Z",
  "data": {
    "facture": "FAC-2026-0003",
    "client": "Hôtel Sahel",
    "montantTotal": 4120000,
    "montantPaye": 0,
    "resteAPayer": 4120000,
    "devise": "XAF",
    "echeance": "2026-02-03T00:00:00.000Z",
    "joursDeRetard": 8,
    "entreprise": "N’Djaména Distribution SARL",
    "pays": "Tchad",
    "message": "Bonjour Hôtel Sahel, votre facture FAC-2026-0003 chez N’Djaména Distribution présente un reste à payer de 4 120 000 FCFA…"
  }
}
```

| Événement | Déclenché par | Champs clés |
|---|---|---|
| `facture.en_retard` | bouton « Relancer » ou cron 7h | `facture`, `resteAPayer`, `joursDeRetard`, `message` |
| `stock.seuil_atteint` | mouvement de stock (`/api/v1/stock`) | `code`, `article`, `quantite`, `seuil`, `fournisseur` |
| `paiement.reussi` | encaissement enregistré | `reference`, `montant`, `provider`, `telephone` |
| `message.envoyer` | page Messages (campagne) | `canal`, `destinataires[]`, `message` |
| `rapport.quotidien` | cron 7h | `chiffreAffaires`, `impaye`, `tauxRecouvrement`, `message` |
| `tontine.cotisation` | page Tontines | `membre`, `montant`, `canal` |
| `ping` | bouton « Tester » dans `/admin/make` | — |

**En-têtes envoyés :** `Content-Type: application/json`, `x-afriflow-event`, `x-afriflow-signature`
(HMAC SHA-256 du corps, avec `MAKE_WEBHOOK_SECRET`), `User-Agent: MB Mustapha/1.0`.

---

## 3. Ce que Make envoie à MB Mustapha (sens ENTRANT)

`POST https://VOTRE-APP.vercel.app/api/webhooks/make`

En-têtes :
```
Authorization: Bearer <AFRIFLOW_API_KEY>
Content-Type: application/json
x-afriflow-event: paiement.reussi
x-afriflow-signature: <hmac_sha256(MAKE_WEBHOOK_SECRET, corps)>   (recommandé)
```

Événements acceptés :

| `event` | Effet dans MB Mustapha |
|---|---|
| `paiement.reussi` | enregistre la transaction **et** passe la facture à « Payée »/« Partielle » |
| `client.cree` | crée une fiche client (ex. capture Google Forms / WhatsApp) |
| `facture.creee` / `commande.whatsapp` | crée une facture automatiquement (AfriBot) |
| `tontine.cotisation` | enregistre une cotisation de membre |
| `message.envoye` / `message.recu` | journalise le message dans l'historique |
| `ping` | test de connexion (réponse : « la connexion fonctionne ✅ ») |

Réponse type :
```json
{ "ok": true, "evenement": "paiement.reussi",
  "resultat": { "message": "Paiement de 200 000 FCFA encaissé et facture mise à jour." } }
```

---

## 4. Procédure de branchement (15 minutes)

1. **Créer le webhook** : make.com → Scenarios → Create → `+` → `Webhooks` → `Custom webhook` → Add →
   nommer (`afriflow-relance`) → **Save** → copier l'adresse.
2. **Coller dans Vercel** : Settings → Environment Variables → `MAKE_WEBHOOK_RELANCE` = cette adresse.
   Répéter pour `MAKE_WEBHOOK_STOCK`, `MAKE_WEBHOOK_PAIEMENT`, `MAKE_WEBHOOK_MESSAGE`,
   `MAKE_WEBHOOK_RAPPORT`, `MAKE_WEBHOOK_GENERIC`.
3. **Créer les secrets** : `MAKE_WEBHOOK_SECRET` (32 caractères aléatoires) et `AFRIFLOW_API_KEY`
   (ex. `afk_live_…`). Ces deux valeurs doivent être **identiques** des deux côtés.
4. **Redeploy** sur Vercel.
5. **Générer un premier appel** : dans MB Mustapha, ouvrez une facture impayée → **Relancer**. Make affiche
   « Successfully determined » puis les champs reçus — vous pouvez maintenant les utiliser dans vos modules.
6. **Brancher les modules** : WhatsApp Business (Cloud API), Africa's Talking (SMS), Google Sheets, Gmail.
7. **Importer les blueprints** fournis dans `make-blueprints/` (01, 02, 03, 04) pour gagner du temps.
8. **Tester le retour** : ajoutez un module `HTTP → Make a request` vers `/api/webhooks/make`
   (voir §3), puis exécutez `node scripts/make-test.mjs paiement.reussi`.

---

## 5. Les 6 scénarios livrés

| # | Nom | Sens | Déclencheur | Actions |
|---|---|---|---|---|
| 1 | Relance des factures impayées | App → Make | `facture.en_retard` (bouton ou cron) | WhatsApp → SMS → Google Sheet |
| 2 | Alerte de rupture de stock | App → Make | `stock.seuil_atteint` | SMS gérant → WhatsApp fournisseur → Sheet |
| 3 | Paiement Mobile Money reçu | Bidirectionnel | callback agrégateur | vérifier → `/api/v1/paiements` → reçu WhatsApp + SMS |
| 4 | Campagnes SMS / WhatsApp | App → Make | `message.envoyer` | boucle destinataires → envoi → journal |
| 5 | Rapport quotidien 7h | App → Make | cron | `/api/v1/stats` → mise en forme → WhatsApp + Sheet |
| 6 | AfriBot WhatsApp | Make → App | message WhatsApp entrant | IA multilingue → commande → `/api/webhooks/make` |

---

## 6. Modèles de messages prêts à l'emploi

**Relance amiable (J+3)**
> Bonjour {client}, petit rappel : la facture {facture} de {reste} FCFA arrive à échéance le {echeance}.
> Vous pouvez régler par Mobile Money en 30 secondes. Merci ! — {entreprise}

**Relance ferme (J+15)**
> Bonjour {client}, la facture {facture} ({reste} FCFA) est en retard de {jours} jours. Merci de régulariser
> avant le {date limite}, sans quoi les livraisons seront suspendues. — {entreprise}

**Reçu de paiement**
> ✅ Paiement reçu : {montant} FCFA via {operateur} (réf. {reference}). Votre facture {facture} est réglée.
> Merci de votre confiance ! — {entreprise}

**Confirmation de cotisation tontine**
> Cotisation de {montant} FCFA reçue au nom de {membre}. Cagnotte du tour : {cagnotte} FCFA. Prochain tour :
> {date}. — {tontine}

---

## 7. Sécurité : ce qui protège vos données

| Risque | Protection déjà en place |
|---|---|
| Quelqu'un découvre l'URL du webhook | `AFRIFLOW_API_KEY` exigée sur tous les appels entrants |
| Falsification du corps de la requête | signature HMAC SHA-256 (`MAKE_WEBHOOK_SECRET`), comparaison à temps constant |
| Faux paiement signalé | le statut est vérifié chez l'agrégateur, sinon validation humaine dans `/admin` |
| Double crédit d'une facture | `registerPayment` borne le cumulé au total de la facture |
| Harcèlement du client | 4 relances automatiques maximum par facture |

---

## 8. Diagnostic

| Symptôme | Où regarder | Cause fréquente |
|---|---|---|
| « mode simulation » dans la réponse | `/admin/make` → journal | `MAKE_WEBHOOK_*` non configurée |
| Make répond 410/404 | journal | webhook supprimé ou scénario désactivé |
| Rien ne démarre dans Make | scénario Make | scénario sur **OFF** (le plus courant !) |
| 401 côté MB Mustapha | journal | `AFRIFLOW_API_KEY` différente entre Make et Vercel |
| Le client ne reçoit rien | WhatsApp/SMS | numéro non renseigné sur la fiche client ou canal non activé |
| Le reçu part deux fois | Make | deux scénarios écoutent le même événement |
