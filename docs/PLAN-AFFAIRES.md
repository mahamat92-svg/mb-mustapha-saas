# Plan d'affaires — gagner de l'argent avec MB Mustapha en Afrique

> ⚠️ **Avertissement méthodologique** : les ordres de grandeur démographiques et de marché ci-dessous sont
> des estimations destinées à cadrer la réflexion. Les calculs de revenus, eux, sont **exacts** : ils
> découlent uniquement de vos prix (`lib/config.ts`). Avant toute décision importante, vérifiez les chiffres
> auprès des sources officielles (Banque mondiale, GSMA *State of the Industry*, BEAC, BCEAO, ANPI/API des
> pays, INS).

---

## 1. Le marché, sans exagération

| Pays | Population (ordre de grandeur) | Ce qui compte pour vous |
|---|---|---|
| 🇹🇩 Tchad | ~18–19 M | très peu de concurrence logicielle locale, paiement manuel dominant, forte demande |
| 🇨🇲 Cameroun | ~28–29 M | marché le plus mûr de la CEMAC, MTN/Orange bien installés, concurrence réelle |
| 🇧🇯 Bénin | ~13–14 M | agrégateurs matures (Kkiapay, CinetPay), e-MECeF en déploiement |
| 🇹🇬 Togo | ~9–10 M | T-Money dominant, OTR exigeant sur la facture électronique |

**Votre vrai marché** : les entreprises de 1 à 50 personnes qui facturent régulièrement.
Dans chaque pays, cela représente des dizaines de milliers de commerces, ateliers, écoles privées,
cliniques, coopératives, transporteurs et prestataires de services.

**Votre vrai concurrent** : le cahier (à 500 FCFA) et les feuilles Excel d'un cousin qui « s'y connaît ».

**Votre avantage** : en français, en FCFA, sur un téléphone d'entrée de gamme, avec WhatsApp et le Mobile
Money — exactement les outils que le client utilise déjà.

---

## 2. Offre et prix (déjà paramétrés dans l'application)

| Offre | Prix / mois | Prix / an | Cible | Argument de vente principal |
|---|---|---|---|---|
| Découverte | **0 FCFA** | — | commerçant qui teste | « Essayez, vous ne payez rien » |
| Starter | **9 900 FCFA** | 99 000 | boutique, atelier, salon | « Vos factures et votre stock au propre » |
| Pro | **24 900 FCFA** | 249 000 | PME, distributeur, école | « Récupérez votre argent, encaissez par téléphone » |
| Business | **59 900 FCFA** | 599 000 | groupe, ONG, plusieurs agences | « Tous les modules, votre logo, vos agences » |
| Coopérative | **149 000 FCFA** | 1 490 000 | tontines, coopératives d'épargne | « Plus jamais de dispute de cotisation » |

**Ancrage psychologique** : le prix du pack Pro (24 900 FCFA ≈ 38 €) est inférieur au salaire mensuel d'un
caissier, et il remplace 2 à 3 jours de travail administratif par mois. Comparez toujours à un **coût évité**
(facture récupérée, temps gagné), jamais à un autre logiciel.

---

## 3. Sources de revenus (5)

1. **Abonnements FCFA** — récurrent, marge ≈ 85 %. Encaissé par Mobile Money, mensuel ou annuel.
2. **Packs SMS/WhatsApp revendus** — ex. 500 SMS = 12 500 FCFA (marge ≈ 40 %).
3. **Installation & formation** — 50 000 à 250 000 FCFA selon la taille (reprise du cahier, étiquettes,
   formation des vendeurs).
4. **Réseau de revendeurs** — 30 % de commission la 1ʳᵉ année, 15 % ensuite : vos revendeurs font la vente
   à votre place (cabinets comptables, cybercafés, techniciens).
5. **Sur-mesure & données** — rapports pour ONG/bailleurs, intégrations, hébergement dédié (à partir de
   500 000 FCFA par projet).

---

## 4. Scénarios de revenus (calculs exacts)

| Clients payants | Mix d'offres | MRR (mois) | ARR (an) |
|---|---|---|---|
| 10 | 6 Starter + 3 Pro + 1 Business | **147 600 FCFA** | 1 771 200 FCFA |
| 30 | 15 Starter + 10 Pro + 4 Business + 1 Coop | **582 400 FCFA** | 6 988 800 FCFA |
| 100 | 40 Starter + 40 Pro + 15 Business + 5 Coop | **1 832 000 FCFA** | 21 984 000 FCFA |
| 300 | 100 Starter + 130 Pro + 50 Business + 20 Coop | **5 652 000 FCFA** | 67 824 000 FCFA |

Pour situer : **30 clients payants ≈ 890 €/mois** de revenus récurrents ; **100 clients ≈ 2 800 €/mois**
(1 € = 655,957 FCFA, parité fixe). Ajoutez les services et la revente de SMS pour viser 30 à 40 % de plus.

---

## 5. Coûts (démarrage et croisière)

| Poste | Démarrage (0–30 clients) | Croisière (100+ clients) |
|---|---|---|
| Hébergement Vercel | 0 FCFA (offre gratuite) | ~20 000 – 40 000 FCFA/mois (Pro) |
| Base de données Neon/Supabase | 0 FCFA | ~15 000 – 30 000 FCFA/mois |
| Make.com | 0 – 9 $ /mois | ~30 – 60 $ /mois selon les opérations |
| WhatsApp / SMS | à l'usage (30 – 45 FCFA / conversation) | refacturé au client avec marge |
| Frais d'agrégateur | 1,8 % – 3,5 % des encaissements | idem |
| Support terrain (carburant, temps) | le vrai coût | 1 personne à temps plein dès ~60 clients |
| Marketing | 0 (bouche-à-oreille, démonstrations) | 5 – 10 % du CA |

**Point mort réaliste** : ~12 à 20 clients payants couvrent vos charges techniques et d'exploitation.

---

## 6. Go-to-market (90 premiers jours)

### Semaine 1 — Fondations
- [ ] Brancher la base, changer tous les secrets, tester un parcours complet de bout en bout.
- [ ] Imprimer 200 flyers : « Vos clients vous doivent de l'argent ? Ce logiciel les fait payer. »
- [ ] Créer une page Facebook/TikTok professionnelle avec des captures d'écran réelles.

### Semaine 2 — Premières démonstrations
- [ ] 10 démonstrations de 15 minutes (marchés, groupements de commerçants, écoles).
- [ ] Utilisez le **test des impayés** : listez les créances du patron, puis cliquez « Relancer ».
- [ ] Objectif : 5 comptes Découverte créés, 2 payants.

### Semaines 3-6 — Automatisation et preuve
- [ ] Activer Make (relance WhatsApp + SMS) chez les 5 premiers clients.
- [ ] Publier chaque semaine un résultat chiffré : « Hôtel Sahel a récupéré 4 120 000 FCFA en 9 jours ».
- [ ] Recruter **3 revendeurs** (1 cabinet comptable, 1 cybercafé, 1 technicien informatique).

### Semaines 7-12 — Spécialisation par pack
- [ ] **Pack École** (frais scolaires + reçus SMS) : ciblez 10 écoles privées.
- [ ] **Pack Tontine** : 5 associations, avec démonstration du SMS de confirmation devant le bureau.
- [ ] **Pack Boutique** : 20 boutiques autour d'un même marché (effet de contagion).
- [ ] Objectif à J+90 : **30 clients payants** (≈ 582 000 FCFA/mois).

---

## 7. Arguments de vente et réponses aux objections

| Objection | Réponse |
|---|---|
| « Je n'ai pas d'ordinateur » | « Tout se fait sur votre téléphone. Votre vendeur utilise le sien. » |
| « Le réseau est mauvais chez moi » | « Les confirmations partent par SMS. Et l'application est très légère. » |
| « C'est trop cher » | « Une facture de 100 000 FCFA récupérée paie 10 mois de l'offre Starter. » |
| « Je gère bien avec mon cahier » | « Combien vous doit-on aujourd'hui, précisément ? » (silence) |
| « Je ne sais pas utiliser l'informatique » | « Vous savez envoyer un message WhatsApp ? Alors vous savez utiliser MB Mustapha. » |
| « Et si je veux arrêter ? » | « Aucun engagement. Vos données s'exportent en Excel quand vous voulez. » |

---

## 8. Risques et parades

| Risque | Parade |
|---|---|
| Connexion internet instable | interface légère, SMS/USSD, mode dégradé hors-ligne |
| Clients qui paient en retard **votre** abonnement | mêmes relances automatiques + suspension à J+15 |
| Copies par des concurrents | avance sur le terrain : réseau de revendeurs, données clients, support local |
| Évolutions fiscales (facture électronique) | paramètres fiscaux centralisés dans `lib/config.ts`, export prévu |
| Dépendance à un agrégateur | 4 agrégateurs prévus + paiement manuel toujours disponible |
| Vol/perte de données | base sauvegardée, journal d'audit, export client à tout moment |

---

## 9. Indicateurs à suivre chaque semaine

| Indicateur | Où le lire | Objectif |
|---|---|---|
| MRR | `/admin/revenus` | +10 % par mois |
| Clients actifs / en essai | `/admin/clients` | 30 % de conversion essai → payant |
| Taux d'erreur des automatisations | `/admin/make` | < 5 % |
| Impayés d'abonnement | `/admin/revenus` | < 10 % du MRR |
| Factures récupérées chez vos clients | `/admin` (à collecter auprès d'eux) | argument marketing n°1 |

---

## 10. Vision à 24 mois

1. **Mois 1-6** : 100 clients entre Tchad et Cameroun, équipe de 3 personnes (vous + 1 support + 1 terrain).
2. **Mois 7-12** : extension Bénin/Togo via 10 revendeurs, pack école déployé dans 40 établissements.
3. **Mois 13-24** : 500 à 1 000 clients, offre « Institution » pour ONG et bailleurs, API publique pour les
   partenaires (agrégateurs, cabinets comptables), hébergement des données au nom du client.
4. **Revenus visés à 24 mois** : entre 3 et 5 M FCFA/mois de récurrent, soit une activité solide et
   rentable dans la zone FCFA — sans dépendre d'investisseurs extérieurs.
