# Configuration de l'administration

Ce document explique comment activer les fonctionnalités d'administration dans l'application Alfie.

## 1. Ajout de la colonne is_admin dans Supabase

Connectez-vous au **Supabase Dashboard** et exécutez les requêtes SQL suivantes dans l'éditeur SQL :

### Étape 1 : Ajouter la colonne is_admin

```sql
-- Ajouter la colonne is_admin à la table users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
```

### Étape 2 : Définir votre utilisateur comme admin

```sql
-- Mettre à jour votre utilisateur comme admin
-- Remplacez l'ID par votre ID utilisateur (actuellement : c37e64bb-9b07-4e73-9950-2e71518c94bf pour Sylvain DI VITO)
UPDATE users
SET is_admin = true
WHERE id = 'c37e64bb-9b07-4e73-9950-2e71518c94bf';
```

### Étape 3 : Vérifier que tout fonctionne

```sql
-- Vérifier les utilisateurs admin
SELECT id, nom, prenom, email, role, is_admin
FROM users
WHERE is_admin = true;
```

## 2. Fonctionnalités disponibles

Une fois configuré, les utilisateurs avec `is_admin = true` auront accès à :

### Dans l'écran Profil
- Une nouvelle section "Administration" apparaîtra
- Bouton "Gérer les catégories et entreprises"

### Gestion des catégories
- ✅ Voir toutes les catégories et sous-catégories
- ✅ Modifier les noms et ordres d'affichage
- ✅ Créer de nouvelles catégories
- ✅ Créer de nouvelles sous-catégories
- ✅ Supprimer des catégories (avec confirmation)
- ✅ Supprimer des sous-catégories (avec confirmation)

### Gestion des entreprises
- ✅ Voir toutes les entreprises
- ✅ Modifier les informations (nom, description, contact)
- ✅ Modifier les URLs des logos
- ✅ Visualiser les galeries de photos de chaque entreprise

## 3. Interface d'administration

L'interface d'administration s'ouvre en modal plein écran depuis l'écran Profil et contient :

- **Onglet Catégories** : Gestion complète des catégories et sous-catégories
- **Onglet Entreprises** : Édition des informations et visualisation des galeries

## 4. Corrections effectuées

- ✅ Nom de table corrigé : `entreprises_photos` au lieu de `photo_entreprises`
- ✅ Type User mis à jour avec le champ `is_admin: boolean`
- ✅ Navigation simplifiée : Admin accessible uniquement via le profil
- ✅ Boutons d'ajout et suppression ajoutés pour les catégories

## 5. Comment tester

1. Exécutez les requêtes SQL ci-dessus dans Supabase
2. Relancez l'application : `npm start`
3. Accédez à l'onglet "Profil"
4. Vous devriez voir une section "Administration"
5. Cliquez sur "Gérer les catégories et entreprises"
6. L'interface d'administration s'ouvre en plein écran

## Notes importantes

- Seuls les utilisateurs avec `is_admin = true` voient la section Administration
- Les autres utilisateurs ne voient pas cette section et ne peuvent pas y accéder
- Toutes les modifications sont sauvegardées directement dans Supabase
- Les suppressions demandent une confirmation pour éviter les erreurs
