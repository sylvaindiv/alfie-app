# STATUS.md - État du Projet Alfie

> **Note**: Ce fichier complète [CLAUDE.md](CLAUDE.md) qui contient toutes les règles de développement et l'architecture. Ici on se concentre uniquement sur l'état d'avancement et les prochaines étapes.

**Dernière mise à jour** : 20 octobre 2025

---

## 🤖 INSTRUCTION POUR CLAUDE CODE

**Quand tu complètes une tâche (écran créé, fonctionnalité implémentée, bug corrigé) :**

1. ✅ **Mets à jour ce fichier STATUS.md immédiatement**
2. Déplace l'élément de "❌ CE QUI MANQUE" vers "✅ CE QUI EST FAIT"
3. Ajoute la date à côté : `(Créé le XX oct)`
4. Mets à jour le compteur dans le titre (ex: 6/10 → 7/10)
5. Update la section "Dernière mise à jour" en haut

**Exemple** : Si tu viens de créer AuthScreen, change :

```diff
- ## ❌ CE QUI MANQUE (4 écrans)
+ ## ❌ CE QUI MANQUE (3 écrans)

- ### 7. AuthScreen (PRIORITÉ 1)
- **Fichier à créer** : `src/screens/AuthScreen.tsx`

+ ## ✅ CE QUI EST FAIT (7/10 écrans)
+
+ 7. **AuthScreen** ✅ (Créé le 20 oct)
+    - Flow d'onboarding complet
+    - Mock OTP fonctionnel
+    - Gestion nouveau compte vs existant
```

💡 **Important** : Fais cette mise à jour **sans qu'on te le demande** après chaque accomplissement majeur.

---

## ✅ CE QUI EST FAIT (7/10 écrans)

### Écrans fonctionnels

1. **HomeScreen** ✅

   - Header avec photo profil + logos associations
   - Barre recherche (nom entreprise uniquement)
   - Grille catégories avec images en fond

2. **EntreprisesListScreen** ✅

   - Filtres sous-catégories (chips 40px)
   - Tri par distance/popularité/alphabétique/commission
   - Liste cartes entreprises

3. **EntrepriseDetailScreen** ✅

   - Galerie photos swipable
   - Infos complètes + contact
   - CTA "Créer une recommandation" (pas encore connecté)

4. **LeadsScreen** ✅

   - Stats cards (validés ce mois + total commissions)
   - Filtres par statut et association
   - Liste des leads

5. **LeadDetailScreen** ✅

   - Détails complets du lead
   - Preuve photo (si auto-reco)
   - Commentaires entreprise

6. **ProfileScreen** ✅ (Créé le 19 oct)

   - Photo profil + infos personnelles
   - Liste associations
   - Statistiques (3 cards)
   - Toggles notifications
   - Liens légaux
   - Déconnexion fonctionnelle ✅ (Ajouté le 20 oct)
   - **Note** : Édition infos/photo et gestion associations affichent "À venir"

7. **AuthScreen** ✅ (Créé le 20 oct)
   - Flow complet téléphone → OTP → onboarding
   - Intégration Firebase Auth (SMS OTP)
   - Formulaire nouveau compte (Prénom, Nom, Email, Code postal, Adresse)
   - Création utilisateur dans Supabase
   - Gestion statut_onboarding (incomplet si pas d'asso)
   - Navigation automatique vers MainApp après connexion
   - Persistance de session via Firebase
   - **Note** : Nécessite configuration Firebase (voir FIREBASE_SETUP.md)

### Composants

- `CategoryCard.tsx` ✅ (thème appliqué)
- `EntrepriseCard.tsx` ✅ (thème appliqué le 19 oct)
- `LeadCard.tsx` ✅ (thème appliqué le 19 oct)

---

### Navigation & Authentification

- `AppNavigator.tsx` ✅ Mis à jour le 20 oct
  - AuthStack avec routing conditionnel
  - Persistance de session Firebase
  - Écran de chargement pendant vérification auth
  - Navigation automatique Auth ↔ MainApp

### Configuration

- `src/config/firebase.ts` ✅ (Créé le 20 oct)
  - Configuration Firebase Auth
  - Fonctions sendPhoneVerification, verifyOTP, signOut
- `FIREBASE_SETUP.md` ✅ (Créé le 20 oct)
  - Documentation complète configuration Firebase
  - Guide étape par étape
  - Configuration iOS/Android
  - Numéros de test
  - Troubleshooting

---

## ❌ CE QUI MANQUE (3 écrans)

### 8. ChoixTypeRecoScreen (Conditionnel)

**Fichier à créer** : `src/screens/ChoixTypeRecoScreen.tsx`

**Logique de routing** :

```typescript
if (entreprise.type_recommandation_autorise === 'photo') {
  navigate('PhotoReco');
} else if (entreprise.type_recommandation_autorise === 'formulaire') {
  navigate('FormulaireReco');
} else {
  // Afficher modal avec 2 boutons
}
```

### 9. PhotoRecoScreen (Auto-recommandation)

**Fichier à créer** : `src/screens/PhotoRecoScreen.tsx`

**Fonctionnalités** :

- Prendre photo ou galerie
- Prévisualisation
- Choix association (si plusieurs)
- Envoi → Créer lead + preuve_photo

**Création lead** :

```typescript
{
  type_lead: 'auto_recommandation',
  ambassadeur_id: user.id,
  association_id: selected,
  entreprise_id: current,
  statut: 'en_attente',
  montant_commission: entreprise.valeur_commission
}
// + incrémenter nb_leads_crees
```

### 10. FormulaireRecoScreen

**Fichier à créer** : `src/screens/FormulaireRecoScreen.tsx`

**Fonctionnalités** :

- Toggle "Pour moi" / "Pour quelqu'un"
- Formulaire : Prénom*, Nom*, Téléphone\*, Email, Commentaire
- Choix association (si plusieurs)
- Validation + création lead

**Création lead** :

```typescript
{
  type_lead: 'recommandation_tiers',
  nom_prospect: form.nom,
  prenom_prospect: form.prenom,
  telephone_prospect: form.tel,
  email_prospect: form.email || null,
  commentaire_initial: form.comment || null,
  // ... même logique que photo
}
```

---

## 🔧 AMÉLIORATIONS ProfileScreen

Le ProfileScreen affiche des Alert "À venir" pour certaines actions. À rendre fonctionnel :

1. **Modifier infos** (email, code postal, adresse)

   - Créer modals d'édition
   - Sauvegarder via Supabase

2. **Upload photo profil**

   - Permissions caméra/galerie
   - Upload Supabase Storage
   - Update users.photo_profil_url

3. **Ajouter association**

   - Modal recherche par nom
   - Créer ambassadeur en base
   - Update statut_onboarding

4. **Retirer association**

   - Confirmation
   - DELETE ambassadeur

5. **Déconnexion réelle** ✅ (Fonctionnel depuis le 20 oct)
   - Firebase signOut()
   - Navigation automatique vers AuthScreen

---

## 🎯 ORDRE RECOMMANDÉ

### ✅ Phase 1 : Authentification (COMPLÉTÉE le 20 oct)

1. ✅ **AuthScreen** avec Firebase Auth (SMS OTP réels)
2. ✅ Intégration à la navigation (AuthStack)
3. ✅ Persistance de session
4. ✅ Déconnexion fonctionnelle

### Phase 2 : Recommandations (cœur de l'app) - EN COURS

3. **FormulaireRecoScreen** (plus simple)
4. **PhotoRecoScreen**
5. **ChoixTypeRecoScreen**
6. Connecter CTA EntrepriseDetailScreen

### Phase 3 : Améliorer ProfileScreen

7. Modals édition
8. Upload photo
9. Gestion associations

### Phase 4 : Polish

10. Tests end-to-end
11. Gestion erreurs
12. Optimisations

---

## 📊 DONNÉES DE TEST

### User hardcodé (MVP)

```typescript
const USER_ID = 'c37e64bb-9b07-4e73-9950-2e71518c94bf'; // Sylvain DI VITO
```

Pour tester avec un autre utilisateur, modifier juste cet ID dans les écrans.

### Associations de démo

- FC Arles
- Rugby Club Châteaurenard
- Danse Graveson

### Entreprises de démo

| Nom             | Type        | Commission | Type reco  |
| --------------- | ----------- | ---------- | ---------- |
| La Mie Dorée    | Boulangerie | 3€ fixe    | photo      |
| Energy Fitness  | Sport       | 25€ fixe   | formulaire |
| Le Provençal    | Restaurant  | 10%        | formulaire |
| Studio Coiffure | Coiffeur    | 15€ fixe   | formulaire |
| Assur+ Conseil  | Assurance   | 50€ fixe   | formulaire |

---

## 🚀 PROCHAINE ACTION

**Phase 1 terminée !** L'authentification est complète avec Firebase Auth.

**Avant de tester** :

1. Configurer Firebase en suivant [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
2. Mettre à jour les clés dans `src/config/firebase.ts`
3. Configurer des numéros de test Firebase (pour développement)

**Prochaine étape : Phase 2** - Créer les écrans de recommandation :

1. **FormulaireRecoScreen** (recommandation tiers)
2. **PhotoRecoScreen** (auto-recommandation photo)
3. **ChoixTypeRecoScreen** (routing conditionnel)

**Commande pour tester** :

```bash
npm start
```

Ensuite presser `i` (iOS) ou `a` (Android) pour lancer l'app.
