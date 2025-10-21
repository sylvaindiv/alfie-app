# Diagnostic : Catégories non affichées sur HomeScreen

## Problème

Les entreprises continuent d'apparaître dans les anciennes catégories sur l'écran d'accueil, même après modification dans l'admin.

## Causes possibles

### 1. ✅ Code du HomeScreen corrigé

Le code a été mis à jour pour utiliser `entreprises_categories` au lieu de `entreprises.categorie_id`.

**Avant** (ligne ~117) :
```typescript
const entreprisesInCategory = (entreprises || []).filter(
  (ent) => ent.categorie_id === category.id  // ❌ Ancien système
);
```

**Maintenant** (lignes 114-151) :
```typescript
// Récupérer TOUTES les associations entreprises-catégories
const { data: entreprisesCategories } = await supabase
  .from('entreprises_categories')
  .select('*');

// Créer des maps pour un accès rapide
const entreprisesByCategoryMap = new Map<string, Set<string>>();
const entreprisesBySubCategoryMap = new Map<string, Set<string>>();

// Filtrer par catégorie principale
entreprisesByCategoryMap.get(category.id) || new Set();
```

### 2. ⚠️ Synchronisation des données

**PROBLÈME PROBABLE** : La table `entreprises_categories` pourrait être vide ou ne pas contenir toutes les entreprises.

## Solution : Vérifier et synchroniser les données

### Étape 1 : Exécuter le script de diagnostic

1. Ouvrez **Supabase** → **SQL Editor**
2. Ouvrez le fichier [VERIFY_AND_SYNC_CATEGORIES.sql](VERIFY_AND_SYNC_CATEGORIES.sql)
3. Exécutez les requêtes **UNE PAR UNE** dans l'ordre

### Étape 2 : Analyser les résultats

#### Vérification #1 : Ancien système
```sql
SELECT 'Entreprises avec categorie_id (ancien système)', COUNT(*)
FROM entreprises
WHERE categorie_id IS NOT NULL AND sous_categorie_id IS NOT NULL;
```
**Résultat attendu** : Un nombre > 0 (ex: 10 entreprises)

#### Vérification #2 : Nouveau système
```sql
SELECT 'Associations dans entreprises_categories', COUNT(*)
FROM entreprises_categories;
```
**Résultat attendu** : Devrait être égal ou supérieur au #1

#### Vérification #3 : Données manquantes
```sql
SELECT 'Entreprises manquantes dans entreprises_categories', COUNT(*)
FROM entreprises e
WHERE e.categorie_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM entreprises_categories ec
    WHERE ec.entreprise_id = e.id AND ec.est_principale = true
  );
```
**Si le résultat > 0** : Il y a des entreprises qui ne sont PAS dans `entreprises_categories`

### Étape 3 : Migration des données

**UNIQUEMENT si la vérification #3 montre des données manquantes**, exécutez :

```sql
INSERT INTO entreprises_categories (entreprise_id, categorie_id, sous_categorie_id, est_principale)
SELECT
  e.id,
  e.categorie_id,
  e.sous_categorie_id,
  true
FROM entreprises e
WHERE e.categorie_id IS NOT NULL
  AND e.sous_categorie_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM entreprises_categories ec
    WHERE ec.entreprise_id = e.id
      AND ec.categorie_id = e.categorie_id
      AND ec.sous_categorie_id = e.sous_categorie_id
  )
ON CONFLICT DO NOTHING;
```

### Étape 4 : Vérification finale

Exécutez la requête #5 du script pour voir les entreprises avec leurs catégories :

```sql
SELECT
  e.nom_commercial,
  c.nom AS categorie,
  sc.nom AS sous_categorie,
  ec.est_principale
FROM entreprises e
LEFT JOIN entreprises_categories ec ON ec.entreprise_id = e.id AND ec.est_principale = true
LEFT JOIN categories_entreprise c ON c.id = ec.categorie_id
LEFT JOIN sous_categories_entreprise sc ON sc.id = ec.sous_categorie_id
WHERE e.statut_abonnement = 'actif'
ORDER BY c.ordre_affichage, sc.ordre_affichage
LIMIT 20;
```

**Vérifiez que** :
- ✅ Chaque entreprise a une ligne
- ✅ `categorie` et `sous_categorie` sont remplis (pas NULL)
- ✅ Une entreprise a `est_principale = true`

## Modifications du code HomeScreen

### 1. Récupération des données (lignes 114-169)

```typescript
// Récupérer TOUTES les associations
const { data: entreprisesCategories } = await supabase
  .from('entreprises_categories')
  .select('*');

// Créer deux maps:
// - entreprisesByCategoryMap: catégories principales seulement
// - entreprisesBySubCategoryMap: toutes les sous-catégories (pour filtrage)
const entreprisesByCategoryMap = new Map<string, Set<string>>();
const entreprisesBySubCategoryMap = new Map<string, Set<string>>();

(entreprisesCategories || []).forEach((ec) => {
  if (ec.est_principale) {
    // Section d'affichage = catégorie principale uniquement
    entreprisesByCategoryMap.set(ec.categorie_id, new Set([...ids, ec.entreprise_id]));
  }
  // Filtrage par sous-catégorie = toutes les associations
  entreprisesBySubCategoryMap.set(ec.sous_categorie_id, new Set([...ids, ec.entreprise_id]));
});
```

### 2. Filtrage par sous-catégorie (lignes 194-207)

```typescript
function getFilteredEntreprises(section: CategorySection) {
  const selectedSubCat = selectedSubCategories[section.category.id];
  if (!selectedSubCat) {
    return section.entreprises;
  }

  // ✅ Utilise la map au lieu de ent.sous_categorie_id
  const entrepriseIdsInSubCategory = entreprisesBySubCategoryMap.get(selectedSubCat);
  if (!entrepriseIdsInSubCategory) {
    return [];
  }
  return section.entreprises.filter((ent) =>
    entrepriseIdsInSubCategory.has(ent.id)
  );
}
```

## Scénarios de test

### Test 1 : Affichage basique

1. Ouvrez l'application
2. Allez sur l'écran d'accueil
3. **Tirez vers le bas** pour rafraîchir
4. ✅ Les entreprises doivent apparaître dans les bonnes catégories

### Test 2 : Modification dans l'admin

1. Profil → Administration
2. Onglet "Entreprises"
3. Ouvrez une entreprise (ex: "Studio Coiffure")
4. Cliquez sur "▶ Catégories"
5. Décochez l'ancienne catégorie
6. Cochez une nouvelle catégorie (ex: "Restauration > Bistrot")
7. Retournez à l'accueil
8. **Tirez vers le bas** pour rafraîchir
9. ✅ "Studio Coiffure" doit maintenant être dans "Restauration"

### Test 3 : Filtrage par sous-catégorie

1. Sur l'écran d'accueil
2. Cliquez sur un chip de sous-catégorie (ex: "Bistrot")
3. ✅ Seules les entreprises de cette sous-catégorie s'affichent
4. Cliquez à nouveau sur le chip pour tout réafficher

## Dépannage

### Problème : "Les entreprises n'apparaissent nulle part"

**Cause** : `entreprises_categories` est vide

**Solution** :
1. Exécutez la vérification #2 du script SQL
2. Si COUNT = 0, exécutez la migration (étape 4 du script)
3. Rafraîchissez l'app

### Problème : "Les entreprises sont toujours dans les anciennes catégories"

**Cause** : Les données dans `entreprises_categories` sont obsolètes

**Solution** :
1. Dans l'admin, ouvrez chaque entreprise
2. Vérifiez que les bonnes catégories sont cochées
3. Si non, cochez/décochez pour mettre à jour
4. Rafraîchissez l'écran d'accueil

### Problème : "Erreur PGRST205: Could not find table 'entreprises_categories'"

**Cause** : La table n'existe pas

**Solution** :
1. Exécutez [CREATE_ENTREPRISES_CATEGORIES_TABLE.sql](CREATE_ENTREPRISES_CATEGORIES_TABLE.sql)
2. Redémarrez l'app

### Problème : "Erreur 42501: new row violates row-level security policy"

**Cause** : RLS trop restrictif

**Solution** :
1. Exécutez [DISABLE_RLS.sql](DISABLE_RLS.sql) OU [FIX_RLS_POLICIES.sql](FIX_RLS_POLICIES.sql)

## Résumé des fichiers créés

1. **[VERIFY_AND_SYNC_CATEGORIES.sql](VERIFY_AND_SYNC_CATEGORIES.sql)** : Script de diagnostic et migration
2. **[HOMESCREEN_FIXES.md](HOMESCREEN_FIXES.md)** : Documentation des corrections pull-to-refresh
3. **[CREATE_ENTREPRISES_CATEGORIES_TABLE.sql](CREATE_ENTREPRISES_CATEGORIES_TABLE.sql)** : Script de création de la table
4. **[DISABLE_RLS.sql](DISABLE_RLS.sql)** : Désactiver RLS (développement)
5. **[FIX_RLS_POLICIES.sql](FIX_RLS_POLICIES.sql)** : Corriger les politiques RLS

## Checklist finale

Avant de tester l'application, assurez-vous que :

- [ ] La table `entreprises_categories` existe
- [ ] RLS est désactivé OU les politiques permettent l'accès
- [ ] Les données ont été migrées (vérification #3 = 0)
- [ ] Le code du HomeScreen utilise `entreprises_categories`
- [ ] La fonction `getFilteredEntreprises` utilise la map
- [ ] Le pull-to-refresh fonctionne

Si tous les points sont cochés, l'affichage devrait être correct !
