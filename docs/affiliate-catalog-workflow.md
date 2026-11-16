# Vendeurs affiliés et publication du catalogue WhatsApp

## 1. Appliquer les migrations Supabase

Les migrations suivantes ajoutent le système :

- `20261115000001_affiliate_sales_system.sql`
- `20261115000002_supplier_catalog_intake.sql`

Elles créent les vendeurs, l’attribution des commandes, le registre des commissions, les fournisseurs et la file de validation catalogue.

## 2. Configuration locale

Le fichier `.env.local` contient déjà l’URL du projet et la clé publique. Ajouter localement, sans envoyer les valeurs dans un chat :

```env
SUPABASE_SECRET_KEY=sb_secret_...
DATABASE_URL=postgresql://postgres:VOTRE_MOT_DE_PASSE@db.ralpcvehpryooszzmmya.supabase.co:5432/postgres
```

La clé secrète se trouve dans le tableau de bord Supabase : **Settings → API Keys → Publishable and secret API keys**. Créer une clé secrète dédiée à l’import KAKOS si nécessaire.

## 3. Vendeurs affiliés

Dans `/admin/affiliates` :

1. Créer le vendeur avec son code et son numéro WhatsApp.
2. Le vendeur ou le client saisit ce code pendant la commande.
3. La vente apparaît avec une commission en attente.
4. Quand la commande passe à `DELIVERED`, la commission devient `APPROVED`.
5. Après paiement du vendeur, cliquer sur `Marquer payée`.

Les commandes annulées, refusées, injoignables ou en rupture annulent automatiquement la commission.

## 4. Catalogue WhatsApp

Générer d’abord le rapport de préparation :

```powershell
node scripts/whatsapp-catalog/publish-to-supabase.mjs --root "CHEMIN_DU_CATALOGUE"
```

Synchroniser les 47 brouillons dans Supabase :

```powershell
node scripts/whatsapp-catalog/publish-to-supabase.mjs --root "CHEMIN_DU_CATALOGUE" --apply
```

Dans `/admin/catalogue-import`, corriger les prix, tailles, couleurs et disponibilités, puis approuver les fiches prêtes.

Publier uniquement les fiches approuvées :

```powershell
node scripts/whatsapp-catalog/publish-to-supabase.mjs --root "CHEMIN_DU_CATALOGUE" --apply --publish-approved
```

Les fiches avec coût manquant, disponibilité non confirmée, tailles/couleurs absentes ou plusieurs modèles mélangés restent bloquées.

