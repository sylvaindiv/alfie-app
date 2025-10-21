# Gestion des catégories d'entreprises

## ✨ Nouvelle fonctionnalité

Vous pouvez maintenant **modifier la catégorie et la sous-catégorie** de chaque entreprise directement depuis l'interface d'administration.

## 🎯 Utilisation

### Modifier les catégories d'une entreprise

1. Ouvrir l'onglet "**Entreprises**" dans l'interface admin
2. Cliquer sur une entreprise pour développer ses détails
3. En haut du formulaire, vous verrez deux nouveaux sélecteurs :
   - **Catégorie** : Sélectionner la catégorie principale
   - **Sous-catégorie** : Sélectionner la sous-catégorie (filtrée selon la catégorie choisie)

### Interface des sélecteurs

```
┌─────────────────────────────────────────────────┐
│ Catégorie          │ Sous-catégorie             │
│ [Restauration  ▼]  │ [Bar à vin      ▼]        │
└─────────────────────────────────────────────────┘
```

**Comment ça fonctionne :**
- Cliquer sur "Catégorie" → Une liste d'alertes affiche toutes les catégories
- Sélectionner une catégorie → Elle s'affiche dans le bouton
- La sélection d'une catégorie **réinitialise automatiquement** la sous-catégorie
- Cliquer sur "Sous-catégorie" → Affiche uniquement les sous-catégories de la catégorie sélectionnée
- Si aucune catégorie n'est sélectionnée → Message : "Sélectionnez d'abord une catégorie"

### Sauvegarder les modifications

Une fois les catégories modifiées :
1. Modifier les autres champs si nécessaire (nom, téléphone, email, etc.)
2. Cliquer sur le bouton **"💾 Sauvegarder"**
3. Toutes les modifications sont enregistrées en une seule fois, y compris les catégories

## 🔧 Fonctionnement technique

### Dépendance entre catégorie et sous-catégorie

Lorsque vous changez de catégorie :
```typescript
setSelectedEntreprise({
  ...ent,
  categorie_id: cat.id,
  sous_categorie_id: '', // Reset automatique
});
```

La sous-catégorie est automatiquement réinitialisée car les sous-catégories dépendent de la catégorie parent.

### Filtrage des sous-catégories

```typescript
const filteredSC = sousCategories.filter(
  (sc) => sc.categorie_id === ent.categorie_id
);
```

Seules les sous-catégories appartenant à la catégorie sélectionnée sont affichées.

### Sauvegarde

Lors du clic sur "Sauvegarder", les champs suivants sont mis à jour :
- `nom_commercial`
- `description`
- `logo_url`
- `telephone`
- `email`
- `site_web`
- **`categorie_id`** ← Nouveau
- **`sous_categorie_id`** ← Nouveau

## 📱 Interface utilisateur

### Layout du formulaire entreprise

```
┌───────────────────────────────────────────────┐
│ Catégorie          │ Sous-catégorie           │
│ [Restauration  ▼]  │ [Bar à vin      ▼]      │
├───────────────────────────────────────────────┤
│ Nom                │ Téléphone                │
│ [Le Bistrot...]    │ [01 23 45...]            │
├───────────────────────────────────────────────┤
│ Email              │ Site web                 │
│ [contact@...]      │ [www.bistrot.fr]        │
├───────────────────────────────────────────────┤
│ Logo URL                                      │
│ [https://example.com/logo.jpg]                │
├───────────────────────────────────────────────┤
│ Description                                   │
│ [Petit restaurant convivial...]               │
└───────────────────────────────────────────────┘
            [💾 Sauvegarder]
```

### Styles des sélecteurs

**Bouton de sélection** :
- Bordure : 1px solid `Colors.border`
- Padding : `Spacing.sm`
- Background : `Colors.surface`
- Icône flèche : ▼ à droite

**Sélection active** :
- Affiche le nom de la catégorie/sous-catégorie sélectionnée
- Texte par défaut : "Sélectionner..." si aucune sélection

## 🎨 Exemple d'utilisation

### Scénario : Recatégoriser un restaurant

1. **Situation initiale** :
   - Entreprise : "Le Petit Bistrot"
   - Catégorie : Restauration
   - Sous-catégorie : Bistrot

2. **Changement** :
   - L'utilisateur veut le passer en "Bar à vin"

3. **Actions** :
   - Ouvrir "Le Petit Bistrot" dans l'admin
   - Catégorie reste "Restauration"
   - Cliquer sur "Sous-catégorie"
   - Sélectionner "Bar à vin" dans la liste
   - Cliquer sur "💾 Sauvegarder"

4. **Résultat** :
   - L'entreprise est maintenant catégorisée comme "Restauration > Bar à vin"
   - Visible immédiatement dans l'app

### Scénario : Changer complètement de catégorie

1. **Situation initiale** :
   - Entreprise : "Le Spa Zen"
   - Catégorie : Bien-être
   - Sous-catégorie : Spa

2. **Changement** :
   - Reclasser en "Beauté > Institut de beauté"

3. **Actions** :
   - Ouvrir "Le Spa Zen"
   - Cliquer sur "Catégorie" → Sélectionner "Beauté"
   - ⚠️ La sous-catégorie se réinitialise automatiquement
   - Cliquer sur "Sous-catégorie" → Sélectionner "Institut de beauté"
   - Cliquer sur "💾 Sauvegarder"

## ⚠️ Points d'attention

### Réinitialisation automatique

Lorsque vous changez la catégorie, **la sous-catégorie est réinitialisée**. C'est normal car les sous-catégories dépendent de la catégorie parent.

**Workflow correct** :
1. Sélectionner la catégorie
2. Puis sélectionner la sous-catégorie
3. Sauvegarder

### Sous-catégories vides

Si une catégorie n'a aucune sous-catégorie :
- Le bouton "Sous-catégorie" affichera "Sélectionner..."
- Cliquer dessus affichera : "Aucune sous-catégorie. Sélectionnez d'abord une catégorie"
- Solution : Créer des sous-catégories dans l'onglet "Catégories"

## 🔄 Synchronisation avec les badges

Les compteurs d'utilisation dans l'onglet "Catégories" se mettent à jour automatiquement :

**Avant modification** :
```
▼ Restauration [12 🏢]
   Bistrot [5]
   Bar à vin [7]
```

**Après changement** (1 bistrot → bar à vin) :
```
▼ Restauration [12 🏢]
   Bistrot [4]   ← -1
   Bar à vin [8] ← +1
```

## 📊 Avantages

1. **Flexibilité** : Recatégoriser facilement les entreprises
2. **Cohérence** : Les sous-catégories sont toujours cohérentes avec leur catégorie
3. **Rapidité** : Modification en 2 clics + sauvegarde
4. **Sécurité** : Impossible de sélectionner une sous-catégorie incompatible
5. **Visibilité** : Voir immédiatement la catégorie actuelle de chaque entreprise

## 🚀 Améliorations futures possibles

- Recherche dans la liste des catégories
- Édition en masse (modifier plusieurs entreprises en même temps)
- Historique des changements de catégorie
- Suggestions de catégorie basées sur le nom/description
- Import/Export CSV avec catégories
