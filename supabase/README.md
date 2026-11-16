# Backend KAKOS MVP - Supabase Foundation

Ce dossier contient la configuration backend minimale et solide pour le MVP KAKOS (Next.js + Supabase + COD).

## 📂 Structure du Répertoire

- `migrations/` : Les migrations SQL pour initialiser la base de données.
  - `20260827000000_init_schema.sql` : Tables, relations, index de performance et contraintes d'intégrité (devises en XAF / F CFA).
  - `20260827000001_rls_policies.sql` : Politiques RLS (Row Level Security) garantissant la sécurité des données.
- `functions/create-order/` : Supabase Edge Function (Deno TypeScript) pour valider et enregistrer les commandes de manière transactionnelle côté serveur et générer le lien WhatsApp.
- `seed.sql` : Données de démonstration (catégories, zones de livraison au Cameroun, produits, variantes et paramètres du magasin).
- `.env.example` : Modèle de configuration des variables d'environnement.

---

## 🛠️ Schéma et Intégrité des Données

Toutes les transactions monétaires et de stock sont gérées au niveau serveur pour empêcher toute fraude (prix falsifiés, commandes hors stock).

### Tables Créées :
1. `categories` : Classification des articles (T-shirts, Jeans, Ensembles, etc.).
2. `products` : Fiche produit générale (prix fournisseur, prix de vente recommandé en XAF, statut d'activation).
3. `product_variants` : Déclinaisons de tailles et couleurs avec gestion des stocks (contrainte stock >= 0).
4. `product_images` : Galerie photos ordonnée des produits.
5. `delivery_zones` : Zones de livraison au Cameroun avec frais associés (ex: Douala standard, Yaoundé standard).
6. `orders` : Commande client Cash On Delivery (COD) avec numéro de suivi unique `KK-XXXXXX`.
7. `order_items` : Lignes d'articles commandés avec prix d'achat figé au moment de la commande.
8. `admin_profiles` : Profils administrateurs liés à `auth.users` de Supabase.
9. `order_status_history` : Historique chronologique des changements de statuts de commande.
10. `campaigns` : Bannières publicitaires et marketing.
11. `settings` : Paramètres globaux du shop (ex: numéro de contact WhatsApp).

---

## 🔒 Sécurité et Row Level Security (RLS)

La sécurité est configurée pour limiter au maximum l'exposition des données :
- **Visiteurs Publics (Storefront anonyme) :**
  - Peuvent uniquement lire (`SELECT`) les catégories, les produits actifs, leurs variantes, leurs images, les zones de livraison actives, et les campagnes actives.
  - **Aucun droit d'écriture** sur les produits, stocks ou prix.
  - **Aucun accès direct** (ni en lecture, ni en écriture) aux commandes clients (`orders`, `order_items`). La création de commande est déléguée à 100% à l'Edge Function sécurisée.
- **Administrateurs (`admin_profiles` lié à `auth.users`) :**
  - Accès complet (Lecture/Écriture) sur toutes les tables de la base de données.

---

## ⚡ Edge Function : `create-order`

Cette fonction Deno s'assure de l'intégrité de la commande :
1. **Validation du stock** en temps réel pour chaque variante demandée.
2. **Calcul des prix côté serveur** (les prix envoyés par le client sont ignorés, seuls les prix réels en base de données sont appliqués).
3. **Calcul de la livraison par zone** côté serveur.
4. **Création de la commande** en statut `PENDING` (En attente).
5. **Déduction automatique du stock**.
6. **Génération d'un lien WhatsApp** pré-rempli redirigeant le client vers le numéro de contact du shop avec le récapitulatif détaillé de sa commande.

---

## 🚀 Guide de Déploiement

### 1. Prérequis
Assurez-vous d'avoir le [Supabase CLI](https://supabase.com/docs/guides/cli) installé sur votre machine.

### 2. Initialisation et Liaison du Projet
Initialisez le projet et liez-le à votre instance Supabase distante :
```bash
# Se connecter à Supabase
supabase login

# Lier le projet local au projet cloud
supabase link --project-ref <votre-project-ref-id>
```

### 3. Appliquer le Schéma et les RLS
Poussez les migrations locales vers votre base de données en production :
```bash
supabase db push
```

### 4. Peupler la Base de Données (Seeding)
Pour injecter les catégories de base, les zones de livraison et des produits de test :
```bash
# Appliquer le fichier seed.sql (remplacez avec vos identifiants de connexion si nécessaire)
supabase db reset
```

### 5. Configurer l'Edge Function
Créez un fichier `.env` dans votre dossier `supabase/` basé sur `.env.example` :
```bash
cp supabase/.env.example supabase/.env
```
Renseignez les variables, puis déployez l'Edge Function et ses secrets :
```bash
# Déployer les secrets d'environnement sur le cloud Supabase
supabase secrets set WHATSAPP_CONTACT=237697259094

# Déployer la fonction create-order
supabase functions deploy create-order
```

---

## 🧪 Exemple de Requête de Test (Création de Commande)

Vous pouvez tester le bon fonctionnement de la création de commande via un simple `curl` ou avec Postman.

### Requête POST :
```bash
curl -X POST https://<votre-project-ref>.supabase.co/functions/v1/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <votre-anon-key>" \
  -d '{
    "customer_name": "Jean Dupont",
    "customer_phone": "+237699999999",
    "delivery_zone_id": "z0000000-0000-0000-0000-000000000001",
    "items": [
      {
        "product_variant_id": "v0000000-0000-0000-0000-000000000011",
        "quantity": 2
      }
    ]
  }'
```

### Réponse attendue (Success) :
```json
{
  "success": true,
  "order_id": "abc-123-uuid",
  "tracking_number": "KK-482015",
  "total_price": 31300.00,
  "whatsapp_url": "https://wa.me/237697259094?text=..."
}
```
