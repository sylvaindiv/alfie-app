-- Script de vérification et synchronisation des catégories d'entreprises
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. VÉRIFICATION : Compter les entreprises avec catégorie dans l'ancienne colonne
SELECT
  'Entreprises avec categorie_id (ancien système)' AS description,
  COUNT(*) AS count
FROM entreprises
WHERE categorie_id IS NOT NULL AND sous_categorie_id IS NOT NULL;

-- 2. VÉRIFICATION : Compter les associations dans la nouvelle table
SELECT
  'Associations dans entreprises_categories (nouveau système)' AS description,
  COUNT(*) AS count
FROM entreprises_categories;

-- 3. VÉRIFICATION : Comparer les deux
SELECT
  'Entreprises manquantes dans entreprises_categories' AS description,
  COUNT(*) AS count
FROM entreprises e
WHERE e.categorie_id IS NOT NULL
  AND e.sous_categorie_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM entreprises_categories ec
    WHERE ec.entreprise_id = e.id
      AND ec.categorie_id = e.categorie_id
      AND ec.sous_categorie_id = e.sous_categorie_id
      AND ec.est_principale = true
  );

-- 4. MIGRATION : Insérer les données manquantes
-- ATTENTION: Exécutez cette requête SEULEMENT si la vérification #3 montre des entreprises manquantes
INSERT INTO entreprises_categories (entreprise_id, categorie_id, sous_categorie_id, est_principale)
SELECT
  e.id as entreprise_id,
  e.categorie_id,
  e.sous_categorie_id,
  true as est_principale
FROM entreprises e
WHERE e.categorie_id IS NOT NULL
  AND e.sous_categorie_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM entreprises_categories ec
    WHERE ec.entreprise_id = e.id
      AND ec.categorie_id = e.categorie_id
      AND ec.sous_categorie_id = e.sous_categorie_id
  )
ON CONFLICT (entreprise_id, categorie_id, sous_categorie_id) DO NOTHING;

-- 5. VÉRIFICATION FINALE : Afficher quelques entreprises avec leurs catégories
SELECT
  e.nom_commercial,
  c.nom AS categorie,
  sc.nom AS sous_categorie,
  ec.est_principale,
  e.categorie_id AS ancien_categorie_id,
  e.sous_categorie_id AS ancien_sous_categorie_id
FROM entreprises e
LEFT JOIN entreprises_categories ec ON ec.entreprise_id = e.id AND ec.est_principale = true
LEFT JOIN categories_entreprise c ON c.id = ec.categorie_id
LEFT JOIN sous_categories_entreprise sc ON sc.id = ec.sous_categorie_id
WHERE e.statut_abonnement = 'actif'
ORDER BY c.ordre_affichage, sc.ordre_affichage
LIMIT 20;

-- 6. DIAGNOSTIC : Trouver les entreprises qui ont des catégories dans l'ancien système mais pas dans le nouveau
SELECT
  e.nom_commercial,
  c_old.nom AS categorie_ancienne,
  sc_old.nom AS sous_categorie_ancienne,
  'MANQUANT dans entreprises_categories' AS statut
FROM entreprises e
JOIN categories_entreprise c_old ON c_old.id = e.categorie_id
JOIN sous_categories_entreprise sc_old ON sc_old.id = e.sous_categorie_id
WHERE e.categorie_id IS NOT NULL
  AND e.sous_categorie_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM entreprises_categories ec
    WHERE ec.entreprise_id = e.id
      AND ec.est_principale = true
  )
ORDER BY e.nom_commercial;
