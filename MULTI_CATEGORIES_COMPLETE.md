# Système de multi-catégories pour les entreprises - Guide complet

## 🎯 Vue d'ensemble

Les entreprises peuvent maintenant appartenir à **plusieurs catégories et sous-catégories** simultanément, avec une catégorie principale clairement identifiée.

## 📋 Étapes de mise en place

### 1. Migration de la base de données

Connectez-vous au **Supabase Dashboard** → SQL Editor et exécutez **dans l'ordre** :

#### Étape 1 : Créer la table de liaison

```sql
CREATE TABLE IF NOT EXISTS entreprises_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  categorie_id UUID NOT NULL REFERENCES categories_entreprise(id) ON DELETE CASCADE,
  sous_categorie_id UUID NOT NULL REFERENCES sous_categories_entreprise(id) ON DELETE CASCADE,
  est_principale BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(entreprise_id, categorie_id, sous_categorie_id)
);

CREATE INDEX idx_entreprises_categories_entreprise ON entreprises_categories(entreprise_id);
CREATE INDEX idx_entreprises_categories_categorie ON entreprises_categories(categorie_id);
CREATE INDEX idx_entreprises_categories_sous_categorie ON entreprises_categories(sous_categorie_id);
```

#### Étape 2 : Migrer les données existantes

```sql
INSERT INTO entreprises_categories (entreprise_id, categorie_id, sous_categorie_id, est_principale)
SELECT
  id as entreprise_id,
  categorie_id,
  sous_categorie_id,
  true as est_principale
FROM entreprises
WHERE categorie_id IS NOT NULL AND sous_categorie_id IS NOT NULL;
```

#### Étape 3 : Vérification

```sql
-- Vérifier que toutes les entreprises ont été migrées
SELECT COUNT(*) FROM entreprises_categories;

-- Afficher quelques exemples
SELECT
  e.nom_commercial,
  c.nom as categorie,
  sc.nom as sous_categorie,
  ec.est_principale
FROM entreprises e
JOIN entreprises_categories ec ON e.id = ec.entreprise_id
JOIN categories_entreprise c ON ec.categorie_id = c.id
JOIN sous_categories_entreprise sc ON ec.sous_categorie_id = sc.id
LIMIT 10;
```

### 2. Relancer l'application

```bash
npm start
```

## 🎨 Interface utilisateur

### Vue dans l'admin

Lorsque vous ouvrez une entreprise dans l'interface d'administration :

```
Catégories (3)

Restauration
  ☑ Bistrot (Principale)
  ☑ Restaurant gastronomique
      [Définir principale]

Bar
  ☑ Bar à vin
      [Définir principale]

Bien-être
  ☐ Spa
  ☐ Massage
```

### Fonctionnement

1. **Cocher une checkbox** → Ajoute immédiatement l'association à la base de données
2. **Décocher une checkbox** → Supprime immédiatement l'association
3. **Badge "Principale"** → Indique la catégorie principale de l'entreprise
4. **Bouton "Définir principale"** → Change la catégorie principale

## ⚡ Fonctionnalités

### Ajout d'une catégorie

1. Cliquer sur une checkbox non cochée
2. ✅ L'association est créée instantanément dans `entreprises_categories`
3. Si c'est la première catégorie, elle devient automatiquement **principale**

### Suppression d'une catégorie

1. Cliquer sur une checkbox cochée
2. ❌ L'association est supprimée instantanément
3. ⚠️ Vous ne pouvez pas supprimer la catégorie principale si c'est la seule

### Changement de catégorie principale

1. Cliquer sur **"Définir principale"** sous une catégorie
2. 🔄 Le flag `est_principale` est déplacé
3. 🔄 Les colonnes `categorie_id` et `sous_categorie_id` sont mises à jour (compatibilité)

## 🗄️ Structure de données

### Table `entreprises_categories`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique |
| `entreprise_id` | UUID | L'entreprise |
| `categorie_id` | UUID | La catégorie |
| `sous_categorie_id` | UUID | La sous-catégorie |
| `est_principale` | BOOLEAN | Catégorie principale ? |
| `created_at` | TIMESTAMP | Date de création |

### Exemple de données

```
entreprise_id: abc123
┌──────────────────┬────────────────┬─────────────────┐
│ Catégorie        │ Sous-catégorie │ Est principale? │
├──────────────────┼────────────────┼─────────────────┤
│ Restauration     │ Bistrot        │ ✓               │
│ Restauration     │ Gastronomique  │                 │
│ Bar              │ Bar à vin      │                 │
└──────────────────┴────────────────┴─────────────────┘
```

## 🔄 Compatibilité avec l'ancien système

Les colonnes `categorie_id` et `sous_categorie_id` dans la table `entreprises` sont **conservées** :

- Elles contiennent toujours la catégorie **principale**
- Elles sont automatiquement synchronisées quand vous changez la catégorie principale
- Cela permet aux anciennes parties du code de continuer à fonctionner

```sql
-- Synchronisation automatique lors du changement de catégorie principale
UPDATE entreprises
SET
  categorie_id = 'ID_NOUVELLE_CAT',
  sous_categorie_id = 'ID_NOUVELLE_SOUS_CAT'
WHERE id = 'ID_ENTREPRISE';
```

## 📊 Cas d'usage

### Cas 1 : Restaurant avec bar

**Entreprise** : "Le Bistrot du Coin"

**Avant** : Une seule catégorie
- Restauration > Bistrot

**Maintenant** : Plusieurs catégories
- ✓ Restauration > Bistrot **(Principale)**
- ✓ Bar > Bar à vin

**Avantage** : Les utilisateurs peuvent le trouver en cherchant soit dans "Restauration", soit dans "Bar"

### Cas 2 : Hôtel avec spa

**Entreprise** : "Hôtel du Lac"

**Catégories** :
- ✓ Hôtellerie > Hôtel 4 étoiles **(Principale)**
- ✓ Bien-être > Spa
- ✓ Restauration > Restaurant gastronomique

**Avantage** : Visibilité maximale dans l'app

### Cas 3 : Salon de coiffure et barbier

**Entreprise** : "Style & Barbe"

**Catégories** :
- ✓ Beauté > Coiffure **(Principale)**
- ✓ Beauté > Barbier

## 🎯 Règles métier

### Règle 1 : Une catégorie principale obligatoire

- Une entreprise doit toujours avoir **au moins une** catégorie
- La première catégorie ajoutée devient automatiquement **principale**
- Vous ne pouvez pas supprimer la catégorie principale si c'est la seule

### Règle 2 : Pas de doublons

- Contrainte unique sur `(entreprise_id, categorie_id, sous_categorie_id)`
- Impossible d'ajouter deux fois la même association

### Règle 3 : Cascades

- Supprimer une entreprise → supprime automatiquement toutes ses associations
- Supprimer une catégorie → supprime automatiquement toutes les associations

## 🔍 Requêtes SQL utiles

### Lister toutes les catégories d'une entreprise

```sql
SELECT
  c.nom as categorie,
  sc.nom as sous_categorie,
  ec.est_principale
FROM entreprises_categories ec
JOIN categories_entreprise c ON ec.categorie_id = c.id
JOIN sous_categories_entreprise sc ON ec.sous_categorie_id = sc.id
WHERE ec.entreprise_id = 'ID_ENTREPRISE'
ORDER BY ec.est_principale DESC, c.nom;
```

### Trouver toutes les entreprises d'une catégorie

```sql
SELECT DISTINCT
  e.nom_commercial,
  e.ville
FROM entreprises e
JOIN entreprises_categories ec ON e.id = ec.entreprise_id
WHERE ec.categorie_id = 'ID_CATEGORIE'
  AND ec.sous_categorie_id = 'ID_SOUS_CATEGORIE';
```

### Compter les entreprises par catégorie

```sql
SELECT
  c.nom as categorie,
  sc.nom as sous_categorie,
  COUNT(ec.entreprise_id) as nb_entreprises
FROM entreprises_categories ec
JOIN categories_entreprise c ON ec.categorie_id = c.id
JOIN sous_categories_entreprise sc ON ec.sous_categorie_id = sc.id
GROUP BY c.nom, sc.nom
ORDER BY nb_entreprises DESC;
```

## 🚀 Optimisations futures possibles

1. **Recherche multi-catégories** : Permettre aux utilisateurs de filtrer par plusieurs catégories
2. **Suggestions automatiques** : Suggérer des catégories basées sur le nom/description
3. **Statistiques** : Voir quelles combinaisons de catégories sont les plus populaires
4. **Import/Export** : CSV avec support multi-catégories
5. **Hiérarchie visuelle** : Afficher l'arbre complet des catégories dans l'app

## ✅ Checklist de vérification

- [ ] Table `entreprises_categories` créée
- [ ] Index créés
- [ ] Données existantes migrées
- [ ] Vérification que toutes les entreprises ont au moins une catégorie
- [ ] Test d'ajout d'une catégorie
- [ ] Test de suppression d'une catégorie
- [ ] Test de changement de catégorie principale
- [ ] Les compteurs d'utilisation se mettent à jour correctement
- [ ] Les badges "Principale" s'affichent correctement

## 📝 Notes importantes

- Les checkboxes modifient la base de données **immédiatement** (pas de bouton "Sauvegarder")
- Le bouton "💾 Sauvegarder informations" ne concerne que les autres champs (nom, téléphone, etc.)
- Les catégories sont sauvegardées dans une table séparée pour plus de flexibilité
