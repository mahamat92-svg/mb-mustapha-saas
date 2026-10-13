---
description: Sécurité des webhooks Make.com, clés API, signatures HMAC et validation des paiements Mobile Money
trigger: always_on
---

# Sécurité — Make.com, paiements, secrets

## Double barrière sur les appels entrants

`POST /api/webhooks/make` vérifie **deux** choses avant d'agir :

1. `Authorization: Bearer AFRIFLOW_API_KEY` (`lib/api.ts → apiKeyValide`)
2. `x-afriflow-signature` = HMAC SHA-256 du corps brut avec `MAKE_WEBHOOK_SECRET`
   (`lib/make.ts → verifySignature`, comparaison à temps constant).

Si l'une échoue → HTTP 401 **et** écriture dans le journal `WebhookLog`. Ne jamais retirer ces contrôles,
même « pour tester plus vite » : ces routes créent des factures et créditent des paiements.

## Règle des paiements

- Un paiement ne passe à `REUSSI` que si : signature vérifiée **ou** statut confirmé par l'agrégateur
  (`lib/paiements.ts → verifierKkiapay` / `verifierCinetpay`), **ou** validation humaine du propriétaire
  depuis `/admin` (paiement manuel Airtel/Moov/virement).
- Le mode « EN_ATTENTE » est le défaut pour toute saisie manuelle : c'est le propriétaire qui tranche.
- Sans agrégateur configuré, l'application affiche les **instructions de paiement manuel**
  (`lib/paiements.ts → initierPaiement`), elle ne prétend jamais qu'un paiement est encaissé.

## Secrets

| Variable | Rôle | À changer en production |
|---|---|---|
| `AUTH_SECRET` | signe les sessions JWT (`jose`) | **oui** — `openssl rand -base64 32` |
| `ADMIN_PASSCODE` | 3ᵉ facteur de `/espace-prive` | **oui** |
| `AFRIFLOW_API_KEY` | clé que Make utilise | **oui** |
| `MAKE_WEBHOOK_SECRET` | signe les échanges | **oui** |
| `CRON_SECRET` | protège `/api/cron/relances` | **oui** |

Jamais de secret dans le code, jamais commité (`.env` est dans `.gitignore`), toujours lu via
`process.env` ou `lib/config.ts → integrationStatus()`.

## Anti-harcèlement client

Le cron `/api/cron/relances` ignore toute facture ayant déjà `reminders >= 4`. Ne pas modifier ce garde-fou :
au-delà, la relance devient contre-productive (et illégale dans certains pays).
