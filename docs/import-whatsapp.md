# Importer un catalogue depuis WhatsApp

Ce premier pipeline transforme un export ZIP WhatsApp en brouillons de produits. Il ne publie rien dans Supabase.

## Flux sécurisé

1. Exporter la discussion WhatsApp **avec les médias** au format ZIP.
2. Lancer l'extraction :

   ```bash
   npm run catalog:whatsapp -- extract "C:\chemin\fournisseur.zip" --output "work\fournisseur-1" --supplier "Nom du fournisseur"
   ```

3. Ouvrir `work/fournisseur-1/review.html` dans un navigateur.
4. Corriger le nom, la catégorie, les prix et la disponibilité. Cocher seulement les produits réellement vérifiés.
5. Télécharger `catalog-reviewed.json`, puis le valider :

   ```bash
   npm run catalog:whatsapp -- validate "C:\chemin\catalog-reviewed.json"
   ```

## Fichiers produits

- `catalog-draft.json` : source structurée complète et traçable.
- `review.html` : interface locale de validation humaine.
- `review.csv` : vue de contrôle utilisable dans Excel ou Google Sheets.
- `products/<id>/` : photos liées à chaque brouillon.

## Garde-fous

- Un produit commence toujours en `REVIEW_REQUIRED` avec `publish: false`.
- Un prix de vente n'est jamais inventé.
- Une disponibilité fournisseur n'est jamais assimilée à un stock KAKOS.
- Les doublons sont repérés par empreinte du texte, prix et contenu des images.
- Un produit approuvé reste bloqué s'il manque son prix, sa photo, sa catégorie ou la confirmation fournisseur.

## Étape Supabase prévue

La publication distante sera ajoutée après validation du modèle de données destiné au dropshipping local. Le schéma actuel décrémente un stock appartenant à KAKOS ; il faut le faire évoluer avant de publier des articles disponibles chez un fournisseur afin de ne pas afficher un faux stock.
