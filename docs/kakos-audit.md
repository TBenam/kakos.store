# Audit Technique et Plan d'Architecture - KAKOS MENSWEAR

Ce document présente l'audit approfondi du projet KAKOS (boutique de prêt-à-porter urbain haut de gamme pour l'Afrique centrale/Cameroun) ainsi que les recommandations d'architecture cible.

---

## 1. Stack Technique Cible (Next.js + TypeScript + Supabase)

L'architecture est optimisée pour la performance, l'interactivité, le référencement naturel (SEO) et la simplicité de gestion opérationnelle (sans backend lourd type Medusa ou Firebase).

*   **Framework Frontend & Core :** Next.js 14+ (App Router) avec TypeScript pour un typage strict et sécurisé.
*   **Moteur de Styles :** Tailwind CSS (intégré nativement, reprenant la configuration et les tokens identifiés dans le design system KAKOS).
*   **Base de Données :** Supabase PostgreSQL (Stockage des produits, commandes, clients et campagnes).
*   **Stockage de Fichiers (Assets) :** Supabase Storage (Hébergement des images produits de haute qualité).
*   **Authentification :** Supabase Auth (limité à l'administration uniquement pour sécuriser le dashboard).
*   **Logique Backend / Traitement :** Supabase Edge Functions (pour l'envoi de notifications WhatsApp, la validation de commandes, etc.).

---

## 2. Structure Actuelle du Workspace

L'analyse de l'arborescence racine montre deux répertoires principaux :
```
c:\Users\pc\Desktop\kakos.store/
├── design system/         # Maquettes fonctionnelles sous forme de fichiers HTML/CSS (Tailwind) et previews PNG
└── images/                # Dossier catalogue fournisseur brut contenant les assets et métadonnées produits
```

---

## 3. Analyse du Catalogue Fournisseur (`images/`)

Le dossier `images/` sert de source de vérité pour le catalogue initial. Il contient 14 sous-dossiers structurés de manière uniforme :

### Structure d'un produit (exemple : `Pull 7000FRS/`)
*   **Photos de produit :** Fichiers `.jpg` bruts (prises de vue réelles, ex: `762676803_..._n.jpg`).
*   **`description.txt` :** Fichier contenant les données textuelles brutes issues du canal d'approvisionnement (ex : prix fournisseur en F CFA, prix négocié, tailles disponibles).
*   **`product.json` :** Fichier structuré contenant les métadonnées pré-générées pour l'intégration automatique :
    *   `title` : Titre du produit.
    *   `handle` : Identifiant URL (ex : `pull`).
    *   `supplierPrice` : Prix fournisseur (ex : `7000`).
    *   `salePrice` : Prix de vente recommandé (ex : `14900`).
    *   `category` : Catégorie principale (ex : `Sweats / Hoodies`).
    *   `sizes` : Liste des tailles (ex : `["S", "M", "L", "XL"]`).
    *   `colors` : Couleurs détectées (ex : `["Multicolore"]`).
    *   `images` : Liste ordonnée des fichiers images correspondants.
    *   `status` : Statut de validation (ex : `REVIEW_REQUIRED`).

### Inventaire des produits détectés :
1.  `Culottes 3500 FRS` (Catégorie : Culottes / Shorts - Prix fournisseur : 3 500 F CFA)
2.  `Doudoune balenciaga 10 000FRS` (Catégorie : Vestes / Doudounes - Prix fournisseur : 10 000 F CFA)
3.  `Jeans Oversizes` (Catégorie : Jeans - Prix fournisseur : variable)
4.  `Pull 7000FRS` (Catégorie : Sweats / Hoodies - Prix fournisseur : 7 000 F CFA)
5.  `T-shirt 3000FRS` (Catégorie : T-shirts - Prix fournisseur : 3 000 F CFA)
6.  `Tshirt 1977 4000FRS` (Catégorie : T-shirts - Prix fournisseur : 4 000 F CFA)
7.  `Tshirt 4000FRS` (Catégorie : T-shirts - Prix fournisseur : 4 000 F CFA)
8.  `ensemble LV 10 000 FRS` (Catégorie : Ensembles - Prix fournisseur : 10 000 F CFA)
9.  `ensemble culotte 8000FRS` (Catégorie : Ensembles - Prix fournisseur : 8 000 F CFA)
10. `ensembles 10 000FRS` (Catégorie : Ensembles - Prix fournisseur : 10 000 F CFA)
11. `ensembles 8000 FRS` (Catégorie : Ensembles - Prix fournisseur : 8 000 F CFA)
12. `jeans simples 8000FRS` (Catégorie : Jeans - Prix fournisseur : 8 000 F CFA)
13. `pantalon supercent 6000 FRS` (Catégorie : Pantalons - Prix fournisseur : 6 000 F CFA)
14. `salopettes hommes 5000FRS` (Catégorie : Salopettes - Prix fournisseur : 5 000 F CFA)

---

## 4. Correspondance des Maquettes (`design system/`) et Routes Cibles

Les maquettes statiques fournies sont directement mappées vers l'architecture de pages Next.js (App Router) :

| Dossier Maquette | Rôle Fonctionnel | Route Next.js Cible |
| :--- | :--- | :--- |
| `kakos_homepage_urban_monolith` | Page d'accueil éditoriale, héro banner et sections phares. | `/` |
| `kakos_nouveaut_s_listing` | Liste de tous les produits avec filtres (taille, couleur, prix). | `/shop` ou `/collections/nouveautes` |
| `kakos_panier_urbain` | Panier latéral (Drawer) interactif avec gestion des quantités. | Composant partagé ou `/cart` (Fallback mobile) |
| `kakos_checkout_cod` | Formulaire de commande rapide (Cash On Delivery + WhatsApp). | `/checkout` |
| `kakos_confirmation_commande` | Confirmation de commande basique et récapitulatif. | `/checkout/success` |
| `kakos_confirmation_de_commande_optimis_e` | Page de succès optimisée pour le réengagement client. | `/checkout/success?optimized=true` |
| `kakos_recherche_urbaine` | Fenêtre/Overlay de recherche interactive. | Composant partagé ou `/search` |
| `kakos_r_sultats_de_recherche` | Page des résultats de recherche. | `/search?q=query` |
| `kakos_recherche_sans_r_sultat` | Écran d'état vide (Empty State) pour recherche infructueuse. | Géré dynamiquement dans `/search` |
| `kakos_urban_sale_experience` | Expérience dédiée aux promotions / ventes flash. | `/collections/sale` ou `/promotions` |
| `kakos_admin_dashboard_overview` | Dashboard d'accueil pour l'administration. | `/admin` |
| `kakos_admin_catalogue_produits` | Tableau de gestion du catalogue et prix pour l'admin. | `/admin/products` |
| `kakos_admin_dition_produit` | Fiche d'édition / création de produit avec dropzone d'images. | `/admin/products/[id]` ou `/admin/products/new` |
| `kakos_admin_gestion_des_commandes` | Tableau de suivi des commandes clients (statuts de livraison). | `/admin/orders` |
| `kakos_admin_d_tail_commande_kk_xxxx` | Fiche détaillée d'une commande spécifique avec historique. | `/admin/orders/[id]` |
| `kakos_admin_gestion_des_campagnes` | Gestion des bannières promo et codes de réduction. | `/admin/campaigns` |

---

## 5. Composants Réutilisables & Design System

Le design system documenté dans [`design system/kakos_urban_monolith/DESIGN.md`](file:///C:/Users/pc/Desktop/kakos.store/design%20system/kakos_urban_monolith/DESIGN.md) impose des directives strictes :
*   **Palette de couleurs :** Base monochrome (Noir `#0A0A0A`, Blanc `#FFFFFF`, Gris intermédiaires) relevée par l'accent **Electric Cyan (`#00F0FF`)** réservé aux incitations à l'action critiques.
*   **Brutalisme Épuré :** Pas d'ombres diffuses, utilisation d'outlines nettes d'un pixel et d'ombres pleines décalées de 4px ("Block Shadows").
*   **Typographie :** **Oswald** en majuscules pour les titres accrocheurs (ambiance streetwear architecturale), et **Inter** pour le corps de texte informatif.

### Composants Frontend à extraire :
1.  **Layout Commun :**
    *   `AnnouncementBar` : Bandeau supérieur défilant (ex: offres de livraison gratuite).
    *   `Header` / `TopAppBar` : Barre de navigation collante (Sticky) avec logo centré KAKOS et boutons d'action (Menu Burger, Sac d'achat).
    *   `NavigationDrawer` : Menu coulissant latéral contenant les catégories du catalogue.
2.  **E-Commerce UI :**
    *   `ProductCard` : Carte produit haute densité intégrant l'image, le badge de statut (ex: "NEW DROP"), le prix en F CFA et le titre.
    *   `CartDrawer` : Tiroir latéral du panier avec récapitulatif des prix et bouton de commande rapide.
    *   `SearchOverlay` : Barre de recherche plein écran avec suggestions dynamiques.
    *   `PopupNewsletter` : Fenêtre surgissante promotionnelle déclinée en 4 variantes existant déjà dans le design (Desktop avec/sans image, Mobile avec/sans image).
3.  **Admin UI :**
    *   `AdminSidebar` : Menu de navigation persistant (Dashboard, Produits, Commandes, Campagnes).
    *   `AdminHeader` : Barre d'outils avec profil admin.
    *   `DataTable` : Tableau générique paginé et filtrable pour les listes de commandes et produits.
    *   `StatusBadge` : Badge coloré pour les étapes de commande (ex: En attente, Confirmée, Expédiée).

---

## 6. Risques Techniques et Solutions

1.  **Optimisation des Images (Streetwear Editorial) :**
    *   *Risque :* Le catalogue contient des photos haute résolution non compressées. Charger ces images directement va dégrader le score Core Web Vitals (LCP) et consommer inutilement de la bande passante mobile au Cameroun.
    *   *Solution :* Utilisation systématique du composant `<Image>` de Next.js pour le redimensionnement et le formatage automatique (WebP/AVIF). Mise en place d'un pipeline de compression lors du téléversement vers Supabase Storage.
2.  **Tunnel de Commande Simplifié (WhatsApp / COD) :**
    *   *Risque :* Le paiement en ligne traditionnel par carte bancaire est peu utilisé dans la région cible.
    *   *Solution :* Le checkout doit supporter le Cash on Delivery (Paiement à la livraison) et initier une redirection/notification automatique via WhatsApp Web/API contenant le détail de la commande pour validation humaine rapide.
3.  **Synchronisation du Catalogue Initial :**
    *   *Risque :* Les données produits actuelles résident dans des fichiers `product.json` locaux.
    *   *Solution :* Développer un script de seeding robuste en TypeScript pour lire `images/**/product.json`, uploader les images associées dans un bucket Supabase Storage public, et insérer les entrées correspondantes dans la table `products` de PostgreSQL.
4.  **Sécurité des Routes d'Administration :**
    *   *Risque :* Exposition accidentelle du tableau de bord ou des informations de livraison client.
    *   *Solution :* Middleware Next.js couplé à Supabase Auth pour rediriger tout utilisateur non authentifié tentant d'accéder aux routes `/admin/*` vers `/admin/login`.

---

## 7. Architecture Cible Proposée (Arborescence)

```
c:\Users\pc\Desktop\kakos.store/
├── supabase/
│   ├── migrations/            # Scripts SQL d'initialisation PostgreSQL (tables, RLS)
│   └── seed.ts                # Script de chargement du catalogue depuis images/
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # Layout racine globale
│   │   ├── page.tsx           # Page d'accueil client (maquette homepage)
│   │   ├── shop/
│   │   │   └── page.tsx       # Listing catalogue client (maquette nouveautés)
│   │   ├── products/
│   │   │   └── [handle]/
│   │   │       └── page.tsx   # Fiche produit détaillée
│   │   ├── checkout/
│   │   │   ├── page.tsx       # Formulaire de commande COD (maquette checkout)
│   │   │   └── success/
│   │   │       └── page.tsx   # Confirmation de commande
│   │   ├── admin/
│   │   │   ├── layout.tsx     # Layout d'administration (Sidebar + Header)
│   │   │   ├── page.tsx       # Vue d'ensemble (maquette dashboard)
│   │   │   ├── products/
│   │   │   │   ├── page.tsx   # Liste du catalogue admin
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # Édition / Création de produit
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx   # Liste des commandes
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # Détail d'une commande
│   │   │   └── campaigns/
│   │   │       └── page.tsx   # Campagnes et codes promo
│   │   └── api/
│   │       └── checkout/      # Endpoint de soumission commande
│   ├── components/            # Composants partagés et atomiques
│   │   ├── ui/                # Boutons, inputs, badges génériques
│   │   ├── client/            # Composants front-office (Header, CartDrawer, etc.)
│   │   └── admin/             # Composants back-office (AdminSidebar, DataTable)
│   ├── lib/                   # Utilitaires et clients
│   │   ├── supabase.ts        # Client Supabase typé
│   │   └── utils.ts           # Fonctions utilitaires diverses
│   └── types/                 # Déclarations des types TypeScript globale
├── docs/
│   └── kakos-audit.md         # Ce livrable d'audit
├── package.json
└── tailwind.config.ts         # Configuration des couleurs et polices KAKOS
```

---

## 8. Plan de Travail et Ordre d'Implémentation

### Étape 1 : Initialisation du Projet
*   Créer le squelette Next.js + TypeScript + Tailwind CSS dans le répertoire courant.
*   Configurer `tailwind.config.ts` pour intégrer la palette KAKOS (Primary, Secondary, Electric Cyan, Surface-container-lowest, etc.) et les polices Oswald/Inter.

### Étape 2 : Modélisation des Données & Seeding
*   Concevoir les schémas PostgreSQL Supabase (`products`, `orders`, `order_items`, `campaigns`).
*   Écrire et exécuter le script de seeding qui parse le catalogue fournisseur (`images/`) pour populer la base et le stockage d'images (Supabase Storage).

### Étape 3 : Intégration du Front-Office Client
*   Implémenter le Layout global (Header, Footer, Announcement Bar, Menu burger).
*   Créer la page d'accueil à partir de `kakos_homepage_urban_monolith`.
*   Créer la page listing catalogue (`/shop`) avec filtres.
*   Implémenter le panier d'achat persistant (Local Storage) et le tiroir latéral (`CartDrawer`).
*   Créer la page `/checkout` avec intégration du mode COD (WhatsApp notification draft).

### Étape 4 : Intégration du Back-Office Admin
*   Sécuriser la route `/admin` avec l'authentification Supabase.
*   Créer les écrans Dashboard, Catalogue produits, Fiche produit (édition), Gestion des commandes et Détail commande.

### Étape 5 : Tests et Optimisation
*   Optimiser le LCP (Next Image) et tester la fluidité mobile.
