# Schémas de la connexion MB Mustapha ↔ Make.com

Ce document contient le **schéma visuel** (ASCII, lisible partout) et les **diagrammes Mermaid**
(rendus automatiquement par GitHub, Notion, Obsidian, VS Code…).

---

## 1. Schéma ASCII complet (vue en 3 flux)

```
                        ╔══════════════════════════════════════════════════════╗
                        ║        AFRIFLOW  —  APPLICATION  (Vercel)             ║
                        ║                                                       ║
   ENTREPRISES CLIENTES ║  ESPACE PUBLIC               ESPACE PRIVÉ (vous)     ║
   ────────────────►    ║  /tableau-de-bord            /admin                   ║
   Factures, stock,     ║  /factures  /stock           /admin/revenus           ║
   tontines, messages   ║  /tontines  /messages        /admin/make  /clients    ║
                        ║        │                            │                 ║
                        ║        └──────────┬─────────────────┘                 ║
                        ║                   ▼                                   ║
                        ║     API REST /api/v1/...   +   /api/cron/relances 7h  ║
                        ║                   │                                   ║
                        ║   PostgreSQL ◄────┴────► Journal WebhookLog           ║
                        ╚═══════════════════│═══════════════════════════════════╝
                                            │
   ┌────────────────────────────────────────┴──────────────────────────────────────┐
   │                                                                                │
   │  (1) SORTANT                                        (2) ENTRANT                │
   │  POST webhook Make                                  POST /api/webhooks/make   │
   │  x-afriflow-signature: HMAC(secret, corps)           Authorization: Bearer …   │
   │           │                                                  ▲                 │
   │           ▼                                                  │                 │
   │  ┌───────────────────────── M A K E . C O M ──────────────────────────────┐    │
   │  │  Custom webhook ──▶ Router ──▶ WhatsApp Cloud API                      │    │
   │  │                          │                                             │    │
   │  │                          ├──▶ Africa's Talking (SMS)                   │    │
   │  │                          ├──▶ Google Sheets (journal des relances)      │    │
   │  │                          ├──▶ Gmail (facture PDF)                       │    │
   │  │                          └──▶ HTTP (retour vers MB Mustapha)               │    │
   │  └────────────────────────────────────────────────────────────────────────┘    │
   │           │                              │                                     │
   │           ▼                              ▼                                     │
   │   WhatsApp / SMS client            Google Sheet (preuve)                        │
   └────────────────────────────────────────────────────────────────────────────────┘
                                            │
   (3) ENCAISSEMENT                         │
   Client paie par Airtel / MTN / Orange / Moov / T-Money / Wave
        │
        ▼
   Agrégateur (Kkiapay, CinetPay, PayDunya, Flutterwave)
        │  callback "notify_url"
        ├──────────────► /api/webhooks/paiement  (voie directe)
        └──────────────► Make (vérification) ──► /api/v1/paiements (voie robuste)
                                   │
                                   ▼
                    Facture → « PAYÉE »  +  reçu WhatsApp & SMS
```

---

## 2. Diagramme de flux Mermaid

```mermaid
flowchart TD
    A["🏢 Entreprise cliente<br/>(espace public)"] -->|crée une facture| B["API MB Mustapha<br/>/api/v1/factures"]
    B --> C[("PostgreSQL<br/>factures, clients, stock")]
    D["⏰ Cron Vercel 07:00<br/>/api/cron/relances"] --> E{Détection}
    C --> E
    E -->|facture impayée| F["Webhook Make<br/>événement facture.en_retard"]
    E -->|stock sous le seuil| G["Webhook Make<br/>événement stock.seuil_atteint"]
    E -->|fin de traitement| H["Webhook Make<br/>rapport.quotidien"]

    F --> I["WhatsApp Cloud API"]
    F --> J["SMS Africa's Talking"]
    F --> K["Google Sheets<br/>journal"]
    G --> J
    H --> I

    I --> L["📱 Client reçoit la relance"]
    L --> M["Client paie en Mobile Money<br/>Airtel / MTN / Orange / Moov / T-Money / Wave"]
    M --> N["Agrégateur<br/>Kkiapay / CinetPay"]
    N -->|callback vérifié| O["POST /api/v1/paiements<br/>Bearer AFRIFLOW_API_KEY"]
    O --> P["Facture → PAYÉE<br/>+ reçu WhatsApp/SMS"]
    P --> C

    Q["🔒 Vous : /admin"] -->|valide un paiement manuel| P
    Q -->|teste un scénario| F
```

---

## 3. Diagramme de séquence — la relance d'un impayé

```mermaid
sequenceDiagram
    participant P as 👤 Patron (vous ou le client)
    participant AF as 🟢 MB Mustapha (Vercel)
    participant DB as 🗄️ PostgreSQL
    participant MK as ⚙️ Make.com
    participant WA as 💬 WhatsApp / SMS
    participant CL as 📱 Client débiteur

    P->>AF: Clic « Relancer les impayés »
    AF->>DB: Sélection des factures IMPAYÉES
    DB-->>AF: FAC-2026-0003 · 4 120 000 FCFA · J+8
    AF->>MK: POST webhook (HMAC) facture.en_retard
    MK->>MK: Router (WhatsApp + SMS + Sheet)
    MK->>WA: message personnalisé + montant
    WA-->>CL: 💬 « Votre facture … reste à payer … »
    MK-->>AF: 200 OK
    AF->>DB: reminders++ / lastRemind = maintenant
    AF->>DB: journal WebhookLog (SORTANT, OK)
    CL->>AF: paie via Mobile Money (référence facture)
    AF->>DB: Facture → PAYÉE
    AF->>MK: paiement.reussi → reçu client
    MK->>WA: « ✅ Paiement reçu … »
    WA-->>CL: reçu
```

---

## 4. Diagramme de séquence — encaissement Mobile Money

```mermaid
sequenceDiagram
    participant CL as 📱 Client
    participant AG as 💳 Agrégateur (CinetPay / Kkiapay)
    participant MK as ⚙️ Make.com
    participant AF as 🟢 MB Mustapha
    participant DB as 🗄️ PostgreSQL

    CL->>AG: Paiement Mobile Money (montant + référence facture)
    AG-->>CL: SMS de confirmation opérateur
    AG->>MK: Callback « transaction réussie »
    MK->>AG: Vérification de la transaction (API Get transaction)
    AG-->>MK: status = ACCEPTED ✅
    MK->>AF: POST /api/v1/paiements (Bearer AFRIFLOW_API_KEY)
    AF->>DB: Payment + Invoice.paid = total → PAYÉE
    AF->>MK: paiement.reussi (reçu)
    MK->>CL: WhatsApp « reçu » + SMS
    AF-->>MK: 201 Created
```

---

## 5. Matrice des responsabilités

| Tâche | MB Mustapha | Make.com | Opérateur / Agrégateur |
|---|---|---|---|
| Calcul de la TVA et du total | ✅ | | |
| Détection d'une facture impayée | ✅ | | |
| Rédaction du message de relance | ✅ (payload prêt) | | |
| Envoi WhatsApp / SMS | | ✅ | |
| Journal des relances | ✅ (WebhookLog) | ✅ (Google Sheet) | |
| Vérification d'une transaction | ✅ (si appel direct) | ✅ | ✅ |
| Mise à jour de la facture | ✅ | | |
| Reçu au client | ✅ (déclencheur) | ✅ (envoi) | |
| Validation manuelle (Tchad) | ✅ (`/admin`) | | |

---

## 6. Où trouver chaque schéma dans l'application

| Emplacement | Contenu |
|---|---|
| `/assistant` (page publique) | schéma express + procédure + variables |
| `/admin/make` (espace privé) | schéma des flux + journal réel + tests |
| `/paiements` (espace client) | les 4 étapes d'un encaissement Mobile Money |
| `docs/CONNEXION-MAKE.md` | guide complet, payloads, sécurité, diagnostic |
| `docs/SCHEMA-MAKE.md` | ce document (ASCII + Mermaid) |
