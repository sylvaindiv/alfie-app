# 📋 SPÉCIFICATION COMPLÈTE - PAGES GESTION ENTREPRISE

## 🎯 OBJECTIF
Créer 2 pages permettant aux gérants d'entreprise et aux admins de gérer leur fiche entreprise : informations, photos, prestations et FAQ.

---

## 🗂️ STRUCTURE DE NAVIGATION

### Bottom Menu (pour gérants entreprise)
```
🏠 Accueil | 📋 Deals | 🏢 Mon entreprise | 👤 Profil
```

**Accès à la page :**
- Visible uniquement si : `user.role = 'gerant_entreprise'` OU `user.is_admin = true`
- Récupérer l'entreprise via : `entreprises_gerants` où `user_id = current_user.id`

---

## 📱 PAGE 1 : DASHBOARD ENTREPRISE

### Route
`/entreprise/dashboard`

### Layout
```
┌────────────────────────────────────────────────┐
│  Header                                        │
├────────────────────────────────────────────────┤
│  Stats                                         │
├────────────────────────────────────────────────┤
│  Gestion deals (à développer plus tard)        │
└────────────────────────────────────────────────┘
│  🏠  📋  🏢  👤  ← Bottom menu                  │
└────────────────────────────────────────────────┘
```

---

### 1. HEADER

**Design :**
```
┌────────────────────────────────────────────────┐
│                                                │
│  [Logo 80x80]  Nom de l'entreprise             │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  ✏️ Modifier ma fiche                    │ │
│  └──────────────────────────────────────────┘ │
│                                                │
└────────────────────────────────────────────────┘
```

**Requête Supabase (à l'ouverture de la page) :**
```javascript
// Récupérer l'entreprise du gérant connecté
const { data: entreprise } = await supabase
  .from('entreprises_gerants')
  .select(`
    entreprise:entreprises (
      id,
      nom_commercial,
      logo_url
    )
  `)
  .eq('user_id', currentUser.id)
  .single();
```

**Éléments :**
- **Logo** : Image ronde, 80x80px, source : `entreprise.logo_url`
- **Nom** : Texte H1, bold, 24px, source : `entreprise.nom_commercial`
- **Bouton** : 
  - Style : Secondaire, border, icon ✏️
  - Action : Navigation vers `/entreprise/modifier`
  - Texte : "Modifier ma fiche"

---

### 2. STATISTIQUES

**Design :**
```
┌────────────────────────────────────────────────┐
│  📊 Mes statistiques                           │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────────┬──────────────┬──────────────┐│
│  │ 📋 Deals     │ 💸 Montant   │ 💰 CA        ││
│  │ reçus        │ versé aux    │ généré       ││
│  │              │ associations │              ││
│  ├──────────────┼──────────────┼──────────────┤│
│  │   47         │  1 250 €     │  45 000 €    ││
│  │              │              │  (fictif)    ││
│  └──────────────┴──────────────┴──────────────┘│
│                                                │
└────────────────────────────────────────────────┘
```

**Requêtes Supabase :**

**A. Deals reçus (total) :**
```javascript
const { count: dealsRecus } = await supabase
  .from('deals')
  .select('*', { count: 'exact', head: true })
  .eq('entreprise_id', entrepriseId);
```

**B. Montant versé aux associations :**
```javascript
const { data: montantVerse } = await supabase
  .from('deals')
  .select('montant_commission')
  .eq('entreprise_id', entrepriseId)
  .eq('statut', 'valide');

// Calculer la somme en JavaScript
const total = montantVerse.reduce((sum, deal) => sum + parseFloat(deal.montant_commission || 0), 0);
```

**C. CA généré total :**
```javascript
// Pour le MVP, valeur fixe fictive
const caGenere = 45000;
// TODO: À calculer plus tard avec tracking réel
```

**Éléments des cards :**
- Background : Blanc
- Border : 1px gris clair
- Border-radius : 12px
- Padding : 16px
- Gap : 12px entre les cards

**Card stats :**
- **Icône** : 24px, coloré
- **Label** : 12px, gris foncé, uppercase
- **Valeur** : 28px, bold, noir
- **Note** : 10px, gris clair (pour "fictif")

---

### 3. SECTION DEALS (placeholder)

```
┌────────────────────────────────────────────────┐
│  📋 Gestion des deals                          │
├────────────────────────────────────────────────┤
│                                                │
│  Cette section sera développée plus tard       │
│                                                │
│  Elle contiendra :                             │
│  - Liste des deals en attente                  │
│  - Filtres par statut                          │
│  - Actions : Valider / Refuser / En cours      │
│                                                │
└────────────────────────────────────────────────┘
```

---

## 📱 PAGE 2 : MODIFIER MA FICHE

### Route
`/entreprise/modifier`

### Layout
```
┌────────────────────────────────────────────────┐
│  [← Retour]  Modifier ma fiche                 │
├────────────────────────────────────────────────┤
│  [ Infos ] [ Photos ] [ Prestations ] [ FAQ ]  │
│  ───────                                       │
├────────────────────────────────────────────────┤
│                                                │
│  Contenu de l'onglet sélectionné               │
│  (scrollable)                                  │
│                                                │
└────────────────────────────────────────────────┘
│  [💾 Sauvegarder les modifications]            │ ← Fixe
└────────────────────────────────────────────────┘
│  🏠  📋  🏢  👤  ← Bottom menu                  │
└────────────────────────────────────────────────┘
```

---

### SYSTÈME D'ONGLETS

**Structure technique :**
- Variable d'état : `activeTab` (valeurs : 'infos', 'photos', 'prestations', 'faq')
- Navigation : Clic sur tab → Change `activeTab` → Affiche le contenu correspondant
- Style actif : Border-bottom coloré + texte bold

**Tabs horizontaux scrollables :**
```
[ Infos ] [ Photos ] [ Prestations ] [ FAQ ]
───────
```

---

## 📄 ONGLET 1 : INFOS

### Requête initiale (chargement)
```javascript
const { data: entreprise } = await supabase
  .from('entreprises')
  .select('*')
  .eq('id', entrepriseId)
  .single();

// Pré-remplir tous les champs du formulaire avec les valeurs
```

---

### SECTION A : Informations générales

**Design :**
```
📌 Informations générales

┌─────────────────────────────────────────┐
│ Logo actuel                             │
│ [Image preview 120x120]                 │
│ [📷 Modifier le logo]                   │
└─────────────────────────────────────────┘

Nom commercial *
[_________________________________]

Description
[_________________________________]
[_________________________________]
[_________________________________]
[_________________________________]
```

**Champs :**

1. **Logo** (entreprise.logo_url)
   - Type : Image upload
   - Preview : Afficher l'image actuelle si existe
   - Action upload : 
     ```javascript
     const file = event.target.files[0];
     const fileName = `${entrepriseId}-${Date.now()}.${file.name.split('.').pop()}`;
     
     const { data, error } = await supabase.storage
       .from('entreprises-logos')
       .upload(fileName, file);
     
     if (!error) {
       const { data: { publicUrl } } = supabase.storage
         .from('entreprises-logos')
         .getPublicUrl(fileName);
       
       // Mettre à jour la preview et la variable
       logoUrl = publicUrl;
     }
     ```

2. **Nom commercial** (entreprise.nom_commercial)
   - Type : Text input
   - Requis : Oui
   - Validation : Min 2 caractères
   - Placeholder : "Ex: La Boulangerie du Coin"

3. **Description** (entreprise.description)
   - Type : Textarea
   - Rows : 4
   - Max : 500 caractères
   - Placeholder : "Décrivez votre entreprise, vos spécialités..."

---

### SECTION B : Localisation

**Design :**
```
📍 Localisation

Adresse complète *
[_________________________________]

Code postal *
[_________________________________]

Ville *
[_________________________________]

☐ Masquer mon adresse dans ma fiche publique

ℹ️ Votre adresse est utilisée pour la géolocalisation
   même si elle est masquée publiquement.
```

**Champs :**

1. **Adresse** (entreprise.adresse)
   - Type : Text input
   - Requis : Oui
   - Placeholder : "12 Rue de la République"

2. **Code postal** (entreprise.code_postal)
   - Type : Text input
   - Requis : Oui
   - Pattern : [0-9]{5}
   - Placeholder : "13200"

3. **Ville** (entreprise.ville)
   - Type : Text input
   - Requis : Oui
   - Placeholder : "Arles"

4. **Masquer adresse** (entreprise.adresse_masquee)
   - Type : Toggle/Checkbox
   - Défaut : false
   - Info tooltip : Si activé, seule la ville sera visible pour les ambassadeurs

---

### SECTION C : Contact

**Design :**
```
📞 Contact

Téléphone
[_________________________________]

Email
[_________________________________]

Site web
[_________________________________]

Horaires
[_________________________________]
[_________________________________]
[_________________________________]
```

**Champs :**

1. **Téléphone** (entreprise.telephone)
   - Type : Tel input
   - Pattern : Téléphone français
   - Placeholder : "04 90 12 34 56"

2. **Email** (entreprise.email)
   - Type : Email input
   - Validation : Format email
   - Placeholder : "contact@entreprise.fr"

3. **Site web** (entreprise.site_web)
   - Type : URL input
   - Placeholder : "https://www.monsite.fr"

4. **Horaires** (entreprise.horaires)
   - Type : Textarea
   - Rows : 3
   - Placeholder : "Lun-Ven: 9h-18h\nSam: 9h-13h\nDim: Fermé"

---

### SECTION D : Commission

**Design :**
```
💰 Commission

Type de commission *
[Montant fixe ▼]
Options: Montant fixe | Pourcentage

Valeur *
[_____________] € (ou %)

Texte explicatif de la commission
[_________________________________]
Exemple : "par commande", "par tranche de 5€", "par séance d'essai"
```

**Champs :**

1. **Type commission** (entreprise.type_commission)
   - Type : Select/Dropdown
   - Options : 
     - "montant_fixe" → "Montant fixe (€)"
     - "pourcentage" → "Pourcentage (%)"
   - Requis : Oui

2. **Valeur commission** (entreprise.valeur_commission)
   - Type : Number input
   - Requis : Oui
   - Min : 0.01
   - Step : 0.01
   - Suffixe dynamique : Si montant_fixe → "€", si pourcentage → "%"

3. **Texte commission** (entreprise.texte_commission)
   - Type : Text input
   - Max : 100 caractères
   - Placeholder : "par commande, par séance d'essai..."
   - Helper text : "Précisez quand la commission est versée"

---

### SECTION E : Type de recommandation

**Design :**
```
📝 Type de recommandation autorisé *

◯ Photo pour achat immédiat uniquement
   (L'ambassadeur prend une photo de son ticket/facture)

◯ Formulaire de rappel uniquement
   (L'ambassadeur remplit un formulaire pour recommander quelqu'un)

◯ Les deux
   (L'ambassadeur peut choisir entre photo ou formulaire)
```

**Champ :**

1. **Type recommandation** (entreprise.type_recommandation_autorise)
   - Type : Radio buttons
   - Options :
     - "photo" → "Photo pour achat immédiat uniquement"
     - "formulaire" → "Formulaire de rappel uniquement"
     - "les_deux" → "Les deux"
   - Requis : Oui
   - Description sous chaque option pour clarifier

---

### SAUVEGARDE ONGLET INFOS

**Action du bouton "Sauvegarder" :**

```javascript
// Validation
if (!nomCommercial || !adresse || !codePostal || !ville) {
  showToast("Veuillez remplir tous les champs obligatoires", "error");
  return;
}

// Update
const { error } = await supabase
  .from('entreprises')
  .update({
    logo_url: logoUrl,
    nom_commercial: nomCommercial,
    description: description,
    adresse: adresse,
    code_postal: codePostal,
    ville: ville,
    adresse_masquee: adresseMasquee,
    telephone: telephone,
    email: email,
    site_web: siteWeb,
    horaires: horaires,
    type_commission: typeCommission,
    valeur_commission: valeurCommission,
    texte_commission: texteCommission,
    type_recommandation_autorise: typeRecommandation
  })
  .eq('id', entrepriseId);

if (error) {
  showToast("❌ Erreur lors de la sauvegarde", "error");
} else {
  showToast("✅ Modifications enregistrées", "success");
}
```

---

## 📸 ONGLET 2 : PHOTOS

### Requête initiale
```javascript
const { data: photos } = await supabase
  .from('entreprises_photos')
  .select('*')
  .eq('entreprise_id', entrepriseId)
  .order('ordre_affichage', { ascending: true });
```

---

### Design de la galerie

```
📸 Galerie photos (10 max)

ℹ️ La première photo sera utilisée comme photo principale

[+ Ajouter des photos] (grisé si >= 10 photos)

┌─────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │          │  │          │  │          │  │
│  │ Photo 1  │  │ Photo 2  │  │ Photo 3  │  │
│  │ [Badge   │  │          │  │          │  │
│  │ "Princi- │  │          │  │          │  │
│  │  pale"]  │  │          │  │          │  │
│  │  [≡] [×] │  │  [≡] [×] │  │  [≡] [×] │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                             │
│  ┌──────────┐  ┌──────────┐               │
│  │          │  │          │               │
│  │ Photo 4  │  │ Photo 5  │               │
│  │          │  │          │               │
│  │  [≡] [×] │  │  [≡] [×] │               │
│  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────┘
```

---

### Fonctionnalités

#### 1. AJOUTER DES PHOTOS

**Bouton "Ajouter des photos" :**
- Condition : Désactivé si `photos.length >= 10`
- Action : Ouvre file picker (accept: image/*)
- Multiple : Oui (jusqu'à atteindre limite de 10)

**Upload :**
```javascript
const handleAddPhotos = async (files) => {
  const remaining = 10 - photos.length;
  const filesToUpload = Array.from(files).slice(0, remaining);
  
  for (const file of filesToUpload) {
    // Upload vers storage
    const fileName = `${entrepriseId}-${Date.now()}-${Math.random()}.${file.name.split('.').pop()}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('entreprises-photos')
      .upload(fileName, file);
    
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('entreprises-photos')
        .getPublicUrl(fileName);
      
      // Créer entrée en BDD
      const maxOrdre = Math.max(...photos.map(p => p.ordre_affichage), 0);
      
      const { error: insertError } = await supabase
        .from('entreprises_photos')
        .insert({
          entreprise_id: entrepriseId,
          photo_url: publicUrl,
          ordre_affichage: maxOrdre + 1
        });
      
      if (!insertError) {
        // Recharger les photos
        await loadPhotos();
      }
    }
  }
  
  showToast("✅ Photos ajoutées", "success");
};
```

#### 2. DRAG & DROP (réordonner)

**Bibliothèque suggérée :** 
- React : `react-beautiful-dnd` ou `dnd-kit`
- Vue : `vuedraggable`
- Vanilla : `sortablejs`

**Logique de réordonnancement :**
```javascript
const handleReorder = async (startIndex, endIndex) => {
  // Réorganiser le tableau localement
  const newPhotos = Array.from(photos);
  const [removed] = newPhotos.splice(startIndex, 1);
  newPhotos.splice(endIndex, 0, removed);
  
  // Mettre à jour les ordre_affichage
  const updates = newPhotos.map((photo, index) => ({
    id: photo.id,
    ordre_affichage: index
  }));
  
  // Update batch en BDD
  for (const update of updates) {
    await supabase
      .from('entreprises_photos')
      .update({ ordre_affichage: update.ordre_affichage })
      .eq('id', update.id);
  }
  
  // Recharger
  await loadPhotos();
};
```

#### 3. SUPPRIMER UNE PHOTO

**Modal de confirmation :**
```
┌──────────────────────────────────┐
│  ⚠️ Supprimer cette photo ?      │
├──────────────────────────────────┤
│                                  │
│  Cette action est irréversible.  │
│                                  │
│  [Annuler] [Supprimer]           │
└──────────────────────────────────┘
```

**Action de suppression :**
```javascript
const handleDeletePhoto = async (photoId, photoUrl) => {
  // Supprimer de la BDD
  const { error: dbError } = await supabase
    .from('entreprises_photos')
    .delete()
    .eq('id', photoId);
  
  if (!dbError) {
    // Supprimer du storage
    const fileName = photoUrl.split('/').pop();
    await supabase.storage
      .from('entreprises-photos')
      .remove([fileName]);
    
    // Recharger les photos
    await loadPhotos();
    showToast("✅ Photo supprimée", "success");
  } else {
    showToast("❌ Erreur lors de la suppression", "error");
  }
};
```

---

### Composant Card Photo

**Structure :**
```javascript
// Props: photo, index, onReorder, onDelete
<div className="photo-card" draggable>
  <img src={photo.photo_url} alt={`Photo ${index + 1}`} />
  
  {index === 0 && (
    <div className="badge-principale">Photo principale</div>
  )}
  
  <div className="actions">
    <button className="drag-handle" title="Réorganiser">≡</button>
    <button 
      className="delete-btn" 
      onClick={() => confirmDelete(photo)}
      title="Supprimer"
    >
      ×
    </button>
  </div>
</div>
```

**Style CSS :**
```css
.photo-card {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
  cursor: move;
}

.photo-card:hover {
  border-color: #3b82f6;
}

.photo-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge-principale {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #3b82f6;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
}

.actions {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
}

.drag-handle,
.delete-btn {
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drag-handle:hover {
  background: rgba(0, 0, 0, 0.8);
}

.delete-btn:hover {
  background: #ef4444;
}
```

---

## 🛠️ ONGLET 3 : PRESTATIONS

### Requêtes initiales
```javascript
// Charger catégories + prestations
const { data: categories } = await supabase
  .from('categories_prestations')
  .select(`
    *,
    prestations:prestations_entreprise(*)
  `)
  .eq('entreprise_id', entrepriseId)
  .order('ordre_affichage', { ascending: true });

// Pour chaque catégorie, trier les prestations
categories.forEach(cat => {
  cat.prestations.sort((a, b) => a.ordre_affichage - b.ordre_affichage);
});
```

---

### Design

```
🛠️ Mes prestations

[+ Ajouter une catégorie]

┌──────────────────────────────────────────────┐
│  📁 Coupes                       [≡] [✏️] [×]  │
├──────────────────────────────────────────────┤
│                                              │
│   • Coupe homme              25 €   [≡] [✏️] [×] │
│   • Coupe femme              35 €   [≡] [✏️] [×] │
│   • Coupe enfant (inactif)   15 €   [≡] [✏️] [×] │
│                                              │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  📁 Colorations                  [≡] [✏️] [×]  │
├──────────────────────────────────────────────┤
│                                              │
│   • Mèches              Sur devis   [≡] [✏️] [×] │
│   • Balayage                 80 €   [≡] [✏️] [×] │
│                                              │
└──────────────────────────────────────────────┘

[+ Ajouter une prestation]
```

---

### Fonctionnalités

#### 1. AJOUTER UNE CATÉGORIE

**Modal :**
```
┌──────────────────────────────────┐
│  Catégorie de prestation         │
├──────────────────────────────────┤
│                                  │
│  Nom de la catégorie *           │
│  [_________________________]     │
│                                  │
│  [Annuler] [Enregistrer]         │
└──────────────────────────────────┘
```

**Action :**
```javascript
const handleAddCategorie = async (nom) => {
  if (!nom || nom.trim().length < 2) {
    showToast("Le nom est requis", "error");
    return;
  }
  
  const maxOrdre = Math.max(...categories.map(c => c.ordre_affichage), 0);
  
  const { error } = await supabase
    .from('categories_prestations')
    .insert({
      entreprise_id: entrepriseId,
      nom: nom.trim(),
      ordre_affichage: maxOrdre + 1
    });
  
  if (!error) {
    await loadCategories();
    showToast("✅ Catégorie créée", "success");
    closeModal();
  }
};
```

#### 2. MODIFIER UNE CATÉGORIE

**Modal (même structure que ajout, pré-rempli) :**

**Action :**
```javascript
const handleEditCategorie = async (categorieId, nouveauNom) => {
  const { error } = await supabase
    .from('categories_prestations')
    .update({ nom: nouveauNom.trim() })
    .eq('id', categorieId);
  
  if (!error) {
    await loadCategories();
    showToast("✅ Catégorie modifiée", "success");
  }
};
```

#### 3. SUPPRIMER UNE CATÉGORIE

**Modal de confirmation :**
```
┌──────────────────────────────────┐
│  ⚠️ Supprimer cette catégorie ?  │
├──────────────────────────────────┤
│                                  │
│  Cette catégorie contient        │
│  3 prestation(s).                │
│                                  │
│  Elles seront aussi supprimées.  │
│                                  │
│  [Annuler] [Supprimer]           │
└──────────────────────────────────┘
```

**Action :**
```javascript
const handleDeleteCategorie = async (categorieId) => {
  // Grâce au ON DELETE CASCADE, les prestations seront supprimées auto
  const { error } = await supabase
    .from('categories_prestations')
    .delete()
    .eq('id', categorieId);
  
  if (!error) {
    await loadCategories();
    showToast("✅ Catégorie supprimée", "success");
  }
};
```

#### 4. DRAG & DROP CATÉGORIES

**Même logique que photos :**
```javascript
const handleReorderCategories = async (startIndex, endIndex) => {
  const newCategories = Array.from(categories);
  const [removed] = newCategories.splice(startIndex, 1);
  newCategories.splice(endIndex, 0, removed);
  
  const updates = newCategories.map((cat, index) => ({
    id: cat.id,
    ordre_affichage: index
  }));
  
  for (const update of updates) {
    await supabase
      .from('categories_prestations')
      .update({ ordre_affichage: update.ordre_affichage })
      .eq('id', update.id);
  }
  
  await loadCategories();
};
```

---

#### 5. AJOUTER UNE PRESTATION

**Modal :**
```
┌──────────────────────────────────┐
│  Prestation                      │
├──────────────────────────────────┤
│                                  │
│  Catégorie *                     │
│  [Coupes ▼]                      │
│  [+ Créer une nouvelle catégorie]│
│                                  │
│  Nom de la prestation *          │
│  [_________________________]     │
│                                  │
│  Description                     │
│  [_________________________]     │
│  [_________________________]     │
│                                  │
│  Prix (laisser vide = sur devis) │
│  [____________] €                │
│                                  │
│  Statut                          │
│  ☑ Actif  ☐ Inactif              │
│                                  │
│  [Annuler] [Enregistrer]         │
└──────────────────────────────────┘
```

**Action :**
```javascript
const handleAddPrestation = async (data) => {
  // Validation
  if (!data.nom || !data.categorieId) {
    showToast("Nom et catégorie requis", "error");
    return;
  }
  
  // Trouver ordre_affichage max dans cette catégorie
  const prestationsCategorie = categories
    .find(c => c.id === data.categorieId)
    ?.prestations || [];
  
  const maxOrdre = Math.max(...prestationsCategorie.map(p => p.ordre_affichage), 0);
  
  const { error } = await supabase
    .from('prestations_entreprise')
    .insert({
      entreprise_id: entrepriseId,
      categorie_id: data.categorieId,
      nom: data.nom.trim(),
      description: data.description?.trim() || null,
      prix: data.prix || null,
      statut: data.statut ? 'actif' : 'inactif',
      ordre_affichage: maxOrdre + 1
    });
  
  if (!error) {
    await loadCategories();
    showToast("✅ Prestation créée", "success");
    closeModal();
  }
};
```

#### 6. MODIFIER UNE PRESTATION

**Modal (même structure, pré-rempli) :**

**Action :**
```javascript
const handleEditPrestation = async (prestationId, data) => {
  const { error } = await supabase
    .from('prestations_entreprise')
    .update({
      categorie_id: data.categorieId,
      nom: data.nom.trim(),
      description: data.description?.trim() || null,
      prix: data.prix || null,
      statut: data.statut ? 'actif' : 'inactif'
    })
    .eq('id', prestationId);
  
  if (!error) {
    await loadCategories();
    showToast("✅ Prestation modifiée", "success");
  }
};
```

#### 7. SUPPRIMER UNE PRESTATION

**Modal simple :**
```
┌──────────────────────────────────┐
│  ⚠️ Supprimer cette prestation ? │
├──────────────────────────────────┤
│                                  │
│  Cette action est irréversible.  │
│                                  │
│  [Annuler] [Supprimer]           │
└──────────────────────────────────┘
```

**Action :**
```javascript
const handleDeletePrestation = async (prestationId) => {
  const { error } = await supabase
    .from('prestations_entreprise')
    .delete()
    .eq('id', prestationId);
  
  if (!error) {
    await loadCategories();
    showToast("✅ Prestation supprimée", "success");
  }
};
```

#### 8. DRAG & DROP PRESTATIONS (dans une catégorie)

**Logique :**
```javascript
const handleReorderPrestations = async (categorieId, startIndex, endIndex) => {
  const categorie = categories.find(c => c.id === categorieId);
  const newPrestations = Array.from(categorie.prestations);
  const [removed] = newPrestations.splice(startIndex, 1);
  newPrestations.splice(endIndex, 0, removed);
  
  const updates = newPrestations.map((prest, index) => ({
    id: prest.id,
    ordre_affichage: index
  }));
  
  for (const update of updates) {
    await supabase
      .from('prestations_entreprise')
      .update({ ordre_affichage: update.ordre_affichage })
      .eq('id', update.id);
  }
  
  await loadCategories();
};
```

---

### Affichage des prestations

**Style pour prestations inactives :**
```css
.prestation-item.inactive {
  opacity: 0.5;
  font-style: italic;
}

.prestation-item.inactive::after {
  content: " (inactif)";
  color: #9ca3af;
  font-size: 12px;
}
```

**Affichage prix :**
```javascript
const displayPrix = (prix) => {
  if (!prix || prix === 0) return "Sur devis";
  return `${parseFloat(prix).toFixed(2)} €`;
};
```

---

## ❓ ONGLET 4 : FAQ

**Structure et fonctionnalités IDENTIQUES à l'onglet Prestations.**

### Requêtes initiales
```javascript
const { data: categories } = await supabase
  .from('categories_faq')
  .select(`
    *,
    questions:faq_entreprise(*)
  `)
  .eq('entreprise_id', entrepriseId)
  .order('ordre_affichage', { ascending: true });

categories.forEach(cat => {
  cat.questions.sort((a, b) => a.ordre_affichage - b.ordre_affichage);
});
```

---

### Design

```
❓ Questions fréquentes

[+ Ajouter une catégorie]

┌──────────────────────────────────────────────┐
│  📁 Tarifs                       [≡] [✏️] [×]  │
├──────────────────────────────────────────────┤
│                                              │
│   Q : Acceptez-vous les cartes ?             │
│   R : Oui, CB et espèces acceptées           │
│                                     [≡] [✏️] [×] │
│                                              │
│   Q : Avez-vous des tarifs réduits ?         │
│   R : Oui, -20% pour les étudiants           │
│                                     [≡] [✏️] [×] │
│                                              │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  📁 Horaires                     [≡] [✏️] [×]  │
├──────────────────────────────────────────────┤
│                                              │
│   Q : Êtes-vous ouverts le dimanche ?        │
│   R : Oui, de 9h à 13h                       │
│                                     [≡] [✏️] [×] │
│                                              │
└──────────────────────────────────────────────┘

[+ Ajouter une question]
```

---

### Modal : Ajouter/Modifier question

```
┌──────────────────────────────────┐
│  Question / Réponse              │
├──────────────────────────────────┤
│                                  │
│  Catégorie *                     │
│  [Tarifs ▼]                      │
│  [+ Créer une nouvelle catégorie]│
│                                  │
│  Question *                      │
│  [_________________________]     │
│                                  │
│  Réponse *                       │
│  [_________________________]     │
│  [_________________________]     │
│  [_________________________]     │
│                                  │
│  [Annuler] [Enregistrer]         │
└──────────────────────────────────┘
```

---

### Actions (similaires aux prestations)

**Ajouter question :**
```javascript
const handleAddQuestion = async (data) => {
  if (!data.question || !data.reponse || !data.categorieId) {
    showToast("Question, réponse et catégorie requis", "error");
    return;
  }
  
  const questionsCategorie = categories
    .find(c => c.id === data.categorieId)
    ?.questions || [];
  
  const maxOrdre = Math.max(...questionsCategorie.map(q => q.ordre_affichage), 0);
  
  const { error } = await supabase
    .from('faq_entreprise')
    .insert({
      entreprise_id: entrepriseId,
      categorie_id: data.categorieId,
      question: data.question.trim(),
      reponse: data.reponse.trim(),
      ordre_affichage: maxOrdre + 1
    });
  
  if (!error) {
    await loadCategories();
    showToast("✅ Question ajoutée", "success");
    closeModal();
  }
};
```

**Toutes les autres actions (modifier, supprimer, drag & drop) suivent la même logique que les prestations.**

---

## 💾 BOUTON SAUVEGARDER (fixe en bas)

### Design
```
┌────────────────────────────────────────────────┐
│          [💾 Sauvegarder les modifications]    │
└────────────────────────────────────────────────┘
```

### Comportement

**Position :**
- Position : Fixed
- Bottom : 60px (au-dessus du bottom menu)
- Width : 100% (avec padding)
- Z-index : 50
- Background : Blanc avec ombre portée

**Action :**
- Pour l'onglet **Infos** : Sauvegarde les informations (voir section onglet 1)
- Pour les onglets **Photos, Prestations, FAQ** : Les actions sont immédiates (pas de sauvegarde globale nécessaire)

**États :**
```css
.save-button {
  background: #3b82f6;
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
  font-weight: 600;
  width: 100%;
  border: none;
  cursor: pointer;
}

.save-button:hover {
  background: #2563eb;
}

.save-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.save-button.success {
  background: #10b981;
}
```

**Toast notifications :**
```javascript
const showToast = (message, type = 'info') => {
  // Type: success, error, info, warning
  // Afficher pendant 3 secondes
  // Position: top-center
};
```

---

## 🎨 SYSTÈME DE DESIGN

### Couleurs principales
```css
:root {
  --primary: #3b82f6;
  --primary-dark: #2563eb;
  --success: #10b981;
  --error: #ef4444;
  --warning: #f59e0b;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-600: #4b5563;
  --gray-900: #111827;
}
```

### Typography
```css
h1 { font-size: 24px; font-weight: bold; }
h2 { font-size: 20px; font-weight: 600; }
h3 { font-size: 16px; font-weight: 600; }
body { font-size: 14px; line-height: 1.5; }
small { font-size: 12px; }
```

### Spacing
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
```

### Border radius
```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-full: 9999px;
```

---

## 📦 COMPOSANTS RÉUTILISABLES

### 1. Input Field
```javascript
<InputField
  label="Nom commercial"
  value={value}
  onChange={setValue}
  required={true}
  placeholder="Ex: La Boulangerie"
  type="text"
  error={error}
/>
```

### 2. Textarea
```javascript
<Textarea
  label="Description"
  value={value}
  onChange={setValue}
  rows={4}
  maxLength={500}
  placeholder="Décrivez..."
/>
```

### 3. Select/Dropdown
```javascript
<Select
  label="Type de commission"
  value={value}
  onChange={setValue}
  options={[
    { value: 'montant_fixe', label: 'Montant fixe (€)' },
    { value: 'pourcentage', label: 'Pourcentage (%)' }
  ]}
  required={true}
/>
```

### 4. Toggle/Checkbox
```javascript
<Toggle
  label="Masquer mon adresse"
  checked={checked}
  onChange={setChecked}
  description="Seule la ville sera visible"
/>
```

### 5. Button
```javascript
<Button
  text="Enregistrer"
  onClick={handleSave}
  variant="primary" // primary, secondary, danger
  disabled={false}
  loading={false}
  icon="💾"
/>
```

### 6. Modal
```javascript
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Ajouter une catégorie"
  size="md" // sm, md, lg
>
  {/* Content */}
</Modal>
```

### 7. Toast
```javascript
<Toast
  message="Modifications enregistrées"
  type="success" // success, error, info, warning
  duration={3000}
/>
```

---

## 🔐 SÉCURITÉ & PERMISSIONS

### Row Level Security (RLS) Supabase

**Pour la table `entreprises` :**
```sql
-- Lecture : gérant de l'entreprise ou admin
CREATE POLICY "Gérants et admins peuvent lire leur entreprise"
ON entreprises FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM entreprises_gerants WHERE entreprise_id = id
  )
  OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);

-- Mise à jour : gérant de l'entreprise ou admin
CREATE POLICY "Gérants et admins peuvent modifier leur entreprise"
ON entreprises FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM entreprises_gerants WHERE entreprise_id = id
  )
  OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);
```

**Pour `entreprises_photos`, `prestations_entreprise`, `faq_entreprise` :**
```sql
-- Même logique : vérifier que l'user est gérant de l'entreprise liée
CREATE POLICY "Gérants peuvent gérer photos/prestations/faq"
ON entreprises_photos FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM entreprises_gerants WHERE entreprise_id = entreprises_photos.entreprise_id
  )
  OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);
```

---

## 📱 RESPONSIVE DESIGN

### Breakpoints
```css
--mobile: 0-639px
--tablet: 640px-1023px
--desktop: 1024px+
```

### Adaptations mobile
- **Onglets** : Scrollable horizontalement
- **Photos galerie** : 2 colonnes sur mobile, 3 sur tablet, 4 sur desktop
- **Formulaires** : Stack vertical sur mobile
- **Stats cards** : 1 colonne sur mobile, 3 colonnes sur desktop

---

## 🧪 TESTS À EFFECTUER

### Onglet Infos
- [ ] Chargement des données existantes
- [ ] Upload logo fonctionnel
- [ ] Validation des champs requis
- [ ] Sauvegarde et refresh des données
- [ ] Toggle "Masquer adresse"

### Onglet Photos
- [ ] Upload photos (limite 10)
- [ ] Drag & drop réordonnancement
- [ ] Suppression avec confirmation
- [ ] Badge "Photo principale" sur la première
- [ ] Affichage correct après actions

### Onglet Prestations
- [ ] Création catégorie
- [ ] Création prestation avec/sans prix
- [ ] Modification catégorie/prestation
- [ ] Suppression avec confirmation
- [ ] Drag & drop catégories et prestations
- [ ] Affichage "inactif" correct
- [ ] Cascade delete (supprimer catégorie → supprime prestations)

### Onglet FAQ
- [ ] Création catégorie
- [ ] Création question/réponse
- [ ] Modification catégorie/question
- [ ] Suppression avec confirmation
- [ ] Drag & drop catégories et questions
- [ ] Cascade delete

### Général
- [ ] Navigation entre onglets fluide
- [ ] Bouton sauvegarder fixe visible
- [ ] Toasts affichés correctement
- [ ] Responsive sur mobile/tablet/desktop
- [ ] Permissions RLS fonctionnelles

---

## 🚀 ORDRE DE DÉVELOPPEMENT RECOMMANDÉ

### Phase 1 : Setup & Page Dashboard
1. Créer les routes
2. Setup navigation bottom menu
3. Développer page Dashboard (Header + Stats)
4. Tester permissions d'accès

### Phase 2 : Page Modifier - Onglet Infos
1. Structure onglets
2. Formulaire infos (tous les champs)
3. Upload logo
4. Sauvegarde
5. Tests validation

### Phase 3 : Onglet Photos
1. Affichage galerie
2. Upload photos
3. Drag & drop
4. Suppression
5. Tests limite 10 photos

### Phase 4 : Onglet Prestations
1. Affichage catégories/prestations
2. Modals création/édition
3. Drag & drop
4. Suppression avec confirmation
5. Tests cascade delete

### Phase 5 : Onglet FAQ
1. Copier/adapter logique Prestations
2. Modals création/édition
3. Drag & drop
4. Tests

### Phase 6 : Polish
1. Responsive design
2. Animations/transitions
3. Messages d'erreur
4. Tests complets
5. Optimisations performances

---

## 📚 RESSOURCES TECHNIQUES

### Bibliothèques suggérées

**Drag & Drop :**
- React : `@dnd-kit/core` + `@dnd-kit/sortable`
- Vue : `vuedraggable`
- Vanilla : `sortablejs`

**Upload d'images :**
- Preview : `FileReader API`
- Compression : `browser-image-compression`
- Crop (optionnel) : `react-image-crop`

**Toasts :**
- React : `react-hot-toast`
- Vue : `vue-toastification`
- Vanilla : Custom ou `toastify-js`

**Modals :**
- React : `@headlessui/react` (Dialog)
- Vue : `@headlessui/vue`
- Vanilla : Custom avec portals

**Validation formulaires :**
- React : `react-hook-form` + `zod`
- Vue : `vee-validate` + `yup`

---

## 📝 NOTES IMPORTANTES

1. **Ordre des photos** : La première photo (ordre_affichage = 0) est la photo principale affichée dans les listes
2. **Limite photos** : 10 photos max par entreprise (faire un compteur visuel)
3. **Prestations sans prix** : Afficher "Sur devis" si `prix IS NULL`
4. **Cascade delete** : Vérifier que les relations ON DELETE CASCADE fonctionnent
5. **Storage Supabase** : 
   - Bucket `entreprises-logos` (public)
   - Bucket `entreprises-photos` (public)
6. **Permissions** : Toujours vérifier via `entreprises_gerants` que l'user a le droit
7. **Loading states** : Afficher des skeletons pendant les requêtes
8. **Optimistic UI** : Mettre à jour l'UI immédiatement puis rollback si erreur

---

## ✅ CHECKLIST FINALE

Avant de considérer les pages terminées :

### Fonctionnel
- [ ] Toutes les requêtes Supabase fonctionnent
- [ ] Upload d'images opérationnel (logo + photos)
- [ ] Drag & drop fluide sur tous les éléments
- [ ] Validation des formulaires complète
- [ ] Messages d'erreur explicites
- [ ] Toasts pour tous les feedbacks

### UX/UI
- [ ] Design cohérent avec le reste de l'app
- [ ] Animations smooth
- [ ] États de chargement (skeletons)
- [ ] Responsive sur tous devices
- [ ] Navigation intuitive entre onglets
- [ ] Confirmations pour actions critiques

### Sécurité
- [ ] RLS policies actives
- [ ] Permissions vérifiées côté backend
- [ ] Validation côté serveur (en plus du client)
- [ ] Storage buckets sécurisés

### Performance
- [ ] Images optimisées (compression)
- [ ] Requêtes minimisées (select only needed)
- [ ] Pas de re-renders inutiles
- [ ] Cache Supabase exploité

---

**FIN DE LA SPÉCIFICATION** 🎉

Cette spec est prête à être utilisée pour développer les 2 pages dans n'importe quel builder no-code (FlutterFlow, Adalo, Bubble, WeWeb, etc.).
