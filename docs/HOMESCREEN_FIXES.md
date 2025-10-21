# Corrections HomeScreen - Tri et Pull-to-Refresh

## Problèmes résolus

### 1. ❌ Problème : Les catégories ne se mettent pas à jour après modification dans l'admin

**Cause** :
- Le HomeScreen chargeait les données uniquement au montage initial (`useEffect` ligne 54)
- Aucun mécanisme de rafraîchissement n'existait

**Solution** :
- ✅ Ajout d'un **RefreshControl** sur le ScrollView
- ✅ Fonction `onRefresh()` qui recharge toutes les données
- ✅ État `refreshing` pour afficher l'indicateur de chargement

### 2. ❌ Problème : Le tri par `ordre_affichage` ne fonctionnait pas

**Cause** :
- Le code utilisait l'ancien système avec `ent.categorie_id` (colonne deprecated)
- Le nouveau système multi-catégories avec la table `entreprises_categories` n'était pas utilisé

**Solution** :
- ✅ Récupération des données depuis `entreprises_categories`
- ✅ Filtrage par `est_principale = true` pour l'affichage des catégories principales
- ✅ Le tri par `ordre_affichage` fonctionne maintenant correctement car les requêtes `.order('ordre_affichage', { ascending: true })` sont appliquées

## Modifications du code

### Fichier : [src/screens/HomeScreen.tsx](src/screens/HomeScreen.tsx)

#### 1. Import de RefreshControl (ligne 14)

```typescript
import {
  // ... autres imports
  RefreshControl,
} from 'react-native';
```

#### 2. Ajout de l'état `refreshing` (ligne 52)

```typescript
const [refreshing, setRefreshing] = useState(false);
```

#### 3. Modification de `fetchAllData()` (lignes 58-143)

**Avant** :
```typescript
async function fetchAllData() {
  try {
    // ... récupération des données

    const entreprisesInCategory = (entreprises || []).filter(
      (ent) => ent.categorie_id === category.id  // ❌ Ancien système
    );
  } catch (error) {
    // ...
  } finally {
    setLoading(false);  // ❌ Pas de gestion du refreshing
  }
}
```

**Après** :
```typescript
async function fetchAllData() {
  try {
    setRefreshing(true);  // ✅ Début du refresh

    // ... récupération des données existantes

    // ✅ Récupération des associations entreprises-catégories
    const { data: entreprisesCategories, error: ecError } = await supabase
      .from('entreprises_categories')
      .select('*')
      .eq('est_principale', true); // Seulement les catégories principales

    // ✅ Filtrage par catégorie principale
    const entrepriseIdsInCategory = (entreprisesCategories || [])
      .filter((ec) => ec.categorie_id === category.id)
      .map((ec) => ec.entreprise_id);

    const entreprisesInCategory = (entreprises || []).filter((ent) =>
      entrepriseIdsInCategory.includes(ent.id)
    );

  } catch (error) {
    // ...
  } finally {
    setLoading(false);
    setRefreshing(false);  // ✅ Fin du refresh
  }
}
```

#### 4. Ajout de la fonction `onRefresh()` (lignes 146-148)

```typescript
async function onRefresh() {
  await fetchAllData();
}
```

#### 5. Ajout du RefreshControl au ScrollView (lignes 183-190)

```typescript
<ScrollView
  contentContainerStyle={styles.scrollContent}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={[Colors.primary]}      // Android
      tintColor={Colors.primary}     // iOS
    />
  }
>
```

## Utilisation

### Pull-to-Refresh

1. **Sur l'écran d'accueil**, tirez vers le bas depuis le haut de la liste
2. Un indicateur de chargement apparaît (spinner orange #FF5B29)
3. Les données sont rechargées depuis Supabase
4. L'interface se met à jour avec les nouvelles données

### Flux de données

```
Admin modifie ordre_affichage
        ↓
Utilisateur pull-to-refresh sur HomeScreen
        ↓
fetchAllData() appelée
        ↓
Requête Supabase avec .order('ordre_affichage', { ascending: true })
        ↓
Categories triées correctement
        ↓
Entreprises assignées aux bonnes catégories via entreprises_categories
        ↓
Interface mise à jour
```

## Avantages

✅ **Synchronisation** : Les modifications dans l'admin sont maintenant visibles après un simple pull-to-refresh
✅ **Tri correct** : Les catégories et sous-catégories sont triées selon `ordre_affichage`
✅ **Multi-catégories** : Utilise le nouveau système avec table de jonction
✅ **UX native** : Geste familier de pull-to-refresh sur iOS et Android
✅ **Feedback visuel** : Indicateur de chargement pendant le refresh

## Test

Pour vérifier que tout fonctionne :

1. Ouvrez l'écran Admin (via Profil)
2. Modifiez l'ordre d'affichage d'une catégorie (ex: changez "1" en "10")
3. Cliquez sur "💾 Tout sauvegarder"
4. Retournez sur l'écran d'accueil
5. **Tirez vers le bas** pour rafraîchir
6. ✅ La catégorie devrait maintenant apparaître dans le nouvel ordre

## Système multi-catégories

Le HomeScreen affiche maintenant les entreprises selon leur **catégorie principale** uniquement (`est_principale = true`).

Si une entreprise a plusieurs catégories :
- ✅ Elle apparaît dans la section de sa catégorie principale
- ❌ Elle n'apparaît pas en double dans les autres catégories

Exemple :
```
Entreprise "Le Bistrot"
- Restauration > Bistrot (Principale) ✅ Affiché dans "Restauration"
- Sport & Bien-être > Yoga          ❌ Pas affiché dans "Sport & Bien-être"
```

## Notes techniques

- **Performance** : Une seule requête pour `entreprises_categories` au lieu de multiples requêtes
- **Consistance** : Utilise le même système que l'AdminScreen
- **Migration** : Compatible avec les anciennes données (colonne `categorie_id` toujours présente mais non utilisée)
- **RLS** : Les politiques Supabase doivent autoriser la lecture de `entreprises_categories` (déjà configuré)
