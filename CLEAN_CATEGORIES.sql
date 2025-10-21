-- Script pour nettoyer entreprises_categories et repartir sur de bonnes bases
-- À exécuter dans l'éditeur SQL de Supabase

-- ÉTAPE 1 : Supprimer TOUTES les données de entreprises_categories
-- (Les mauvaises données viennent de la migration depuis les colonnes obsolètes)
DELETE FROM entreprises_categories;

-- ÉTAPE 2 : Vérifier que la table est vide
SELECT
  'Associations restantes dans entreprises_categories' AS description,
  COUNT(*) AS count
FROM entreprises_categories;
-- Résultat attendu: 0

-- ÉTAPE 3 : À partir de maintenant, vous devrez assigner les catégories
-- manuellement depuis l'interface admin pour chaque entreprise.

-- Pour faciliter le travail, voici la liste des entreprises actives qui n'ont pas de catégorie :
SELECT
  e.id,
  e.nom_commercial,
  'Pas de catégorie assignée' AS statut
FROM entreprises e
WHERE e.statut_abonnement = 'actif'
  AND NOT EXISTS (
    SELECT 1 FROM entreprises_categories ec
    WHERE ec.entreprise_id = e.id
  )
ORDER BY e.nom_commercial;
