-- Script de rollback pour annuler les modifications de VERIFY_AND_SYNC_CATEGORIES.sql
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. DIAGNOSTIC : Voir ce qui a été modifié
SELECT
  'Total associations dans entreprises_categories' AS description,
  COUNT(*) AS count
FROM entreprises_categories;

-- 2. DIAGNOSTIC : Voir s'il y a des doublons
SELECT
  entreprise_id,
  categorie_id,
  sous_categorie_id,
  COUNT(*) AS occurrences
FROM entreprises_categories
GROUP BY entreprise_id, categorie_id, sous_categorie_id
HAVING COUNT(*) > 1;

-- 3. DIAGNOSTIC : Voir les entreprises avec plusieurs catégories principales
SELECT
  e.nom_commercial,
  COUNT(*) AS nb_categories_principales
FROM entreprises e
JOIN entreprises_categories ec ON ec.entreprise_id = e.id
WHERE ec.est_principale = true
GROUP BY e.id, e.nom_commercial
HAVING COUNT(*) > 1
ORDER BY nb_categories_principales DESC;

-- 4. OPTION 1 : Supprimer UNIQUEMENT les duplicatas créés par le script
-- (Garde la première occurrence de chaque association)
DELETE FROM entreprises_categories
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY entreprise_id, categorie_id, sous_categorie_id
        ORDER BY created_at
      ) AS row_num
    FROM entreprises_categories
  ) AS numbered
  WHERE row_num > 1
);

-- 5. OPTION 2 : Remettre uniquement UNE catégorie principale par entreprise
-- (Garde la plus ancienne association comme principale, met les autres à false)
UPDATE entreprises_categories
SET est_principale = false
WHERE id NOT IN (
  SELECT id
  FROM (
    SELECT DISTINCT ON (entreprise_id)
      id,
      entreprise_id
    FROM entreprises_categories
    WHERE est_principale = true
    ORDER BY entreprise_id, created_at ASC
  ) AS first_principales
);

-- 6. OPTION 3 (DANGER) : Supprimer TOUTES les données de entreprises_categories
-- et recommencer proprement
-- ATTENTION: N'exécutez cette requête QUE si vous êtes sûr !
-- DELETE FROM entreprises_categories;

-- 7. OPTION 4 : Recréer les associations depuis l'ancien système uniquement
-- (Supprime tout et recrée proprement)
-- ÉTAPE 1 : Sauvegarder les modifications manuelles (si vous en avez fait)
CREATE TEMP TABLE backup_entreprises_categories AS
SELECT * FROM entreprises_categories;

-- ÉTAPE 2 : Supprimer tout
DELETE FROM entreprises_categories;

-- ÉTAPE 3 : Recréer depuis entreprises.categorie_id
INSERT INTO entreprises_categories (entreprise_id, categorie_id, sous_categorie_id, est_principale)
SELECT DISTINCT
  e.id AS entreprise_id,
  e.categorie_id,
  e.sous_categorie_id,
  true AS est_principale
FROM entreprises e
WHERE e.categorie_id IS NOT NULL
  AND e.sous_categorie_id IS NOT NULL
  AND e.statut_abonnement = 'actif'
ON CONFLICT (entreprise_id, categorie_id, sous_categorie_id) DO NOTHING;

-- 8. VÉRIFICATION FINALE : Compter les résultats
SELECT
  'Entreprises actives avec catégorie' AS description,
  COUNT(*) AS count
FROM entreprises
WHERE categorie_id IS NOT NULL
  AND sous_categorie_id IS NOT NULL
  AND statut_abonnement = 'actif';

SELECT
  'Associations principales dans entreprises_categories' AS description,
  COUNT(*) AS count
FROM entreprises_categories
WHERE est_principale = true;

-- 9. AFFICHER le résultat final
SELECT
  e.nom_commercial,
  c.nom AS categorie,
  sc.nom AS sous_categorie,
  ec.est_principale,
  c.ordre_affichage AS ordre_cat,
  sc.ordre_affichage AS ordre_sous_cat
FROM entreprises e
JOIN entreprises_categories ec ON ec.entreprise_id = e.id
JOIN categories_entreprise c ON c.id = ec.categorie_id
JOIN sous_categories_entreprise sc ON sc.id = ec.sous_categorie_id
WHERE e.statut_abonnement = 'actif'
  AND ec.est_principale = true
ORDER BY c.ordre_affichage, sc.ordre_affichage, e.nom_commercial
LIMIT 30;
