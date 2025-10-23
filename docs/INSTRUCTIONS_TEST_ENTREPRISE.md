# Instructions de test - Page Entreprise

## 1. Préparation de la base de données

Pour tester la fonctionnalité, vous devez associer l'utilisateur de test à une entreprise. Exécutez cette requête SQL dans Supabase :

```sql
-- 1. Créer une entreprise de test (si elle n'existe pas déjà)
INSERT INTO entreprises (
  nom,
  description,
  adresse,
  telephone,
  email,
  site_web,
  type_commission,
  valeur_commission,
  texte_commission
) VALUES (
  'Entreprise Test',
  'Entreprise de test pour le développement',
  '1 rue de Test, 75001 Paris',
  '01 23 45 67 89',
  'contact@entreprise-test.fr',
  'https://entreprise-test.fr',
  'pourcentage',
  10,
  'Commission de 10% sur chaque vente'
)
ON CONFLICT DO NOTHING
RETURNING id;

-- 2. Associer l'utilisateur hardcodé (Sylvain) à cette entreprise
-- Remplacez <ENTREPRISE_ID> par l'ID retourné par la requête ci-dessus
INSERT INTO entreprises_gerants (
  entreprise_id,
  user_id
) VALUES (
  '<ENTREPRISE_ID>',
  'c37e64bb-9b07-4e73-9950-2e71518c94bf'
)
ON CONFLICT DO NOTHING;
```

## 2. Lancement de l'application

```bash
npm start
```

## 3. Navigation

Une fois l'application lancée :
- Un nouvel onglet "Entreprise" devrait apparaître dans la bottom bar (entre "Mes deals" et "Profil")
- Cliquez dessus pour accéder à la page de gestion d'entreprise

## 4. Fonctionnalités à tester

### Dashboard
- ✅ Affichage du logo et nom de l'entreprise
- ✅ Statistiques CA (45 000 € - valeur fictive)
- ✅ Informations rapides (nom, téléphone, email)

### Onglet Infos
- ✅ Modification des informations générales (nom, description, adresse)
- ✅ Validation stricte (email, téléphone, site web)
- ✅ Sélecteur d'horaires structuré (jour par jour)
- ✅ Affichage de la commission en lecture seule
- ✅ Boutons Annuler / Enregistrer

### Onglet Photos
- ✅ Upload du logo (max 1, ratio 1:1)
- ✅ Upload de photos (max 8, ratio 16:9)
- ✅ Compression automatique avant upload
- ✅ Suppression d'images
- ✅ Réorganisation des photos (drag & drop) - **Note: non implémenté dans ce MVP**

### Onglet Prestations
- ✅ Création de catégories de prestations
- ✅ Ajout de prestations par catégorie (nom, description, prix)
- ✅ Modification et suppression
- ✅ Réorganisation (drag & drop) - **Note: non implémenté dans ce MVP**

### Onglet FAQ
- ✅ Création de catégories FAQ
- ✅ Ajout de questions/réponses par catégorie
- ✅ Modification et suppression
- ✅ Réorganisation (drag & drop) - **Note: non implémenté dans ce MVP**

## 5. Points d'attention

### Affichage conditionnel
L'onglet "Entreprise" n'apparaît **que si** :
- L'utilisateur est connecté
- L'utilisateur a une entrée dans la table `entreprises_gerants`

### Buckets Storage
Les buckets suivants doivent être créés dans Supabase Storage (publics) :
- ✅ `entreprises-logos`
- ✅ `entreprises-photos`

### Validation
- Email : format standard `example@domain.com`
- Téléphone : formats français acceptés (01 23 45 67 89, 0123456789, +33123456789)
- Site web : URL valide (http:// ou https:// ajouté automatiquement)

## 6. Problèmes connus

- Le drag & drop des photos/prestations/FAQ n'est pas encore implémenté (ordre fixe pour le MVP)
- Les horaires sont stockés en JSON dans le champ `horaires` (format personnalisé)

## 7. Désactiver l'onglet Entreprise

Pour tester l'affichage conditionnel, supprimez l'entrée de la table `entreprises_gerants` :

```sql
DELETE FROM entreprises_gerants
WHERE user_id = 'c37e64bb-9b07-4e73-9950-2e71518c94bf';
```

L'onglet devrait disparaître immédiatement.
