import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://opcasadetsteifqyaeno.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wY2FzYWRldHN0ZWlmcXlhZW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyOTE2NTQsImV4cCI6MjA3NTg2NzY1NH0.Mlq7G4XHua6CHk8Gm8eyokMFUSLNLwxvR5JRAhUxZko';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addAdminColumn() {
  console.log('🔍 Vérification des tables existantes...');

  // Lister toutes les tables pour trouver le bon nom
  const { data: tables, error: tablesError } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (tablesError) {
    console.error('❌ Erreur:', tablesError);
  } else {
    console.log('✅ Table users existe');
  }

  // Tester différents noms pour la table photos
  const photoTableNames = [
    'photo_entreprises',
    'photos_entreprises',
    'entreprise_photos',
    'galerie_entreprises',
  ];

  console.log('\n🔍 Recherche de la table des photos...');
  for (const tableName of photoTableNames) {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);

    if (!error) {
      console.log(`✅ Table trouvée: ${tableName}`);
      break;
    }
  }

  console.log('\n📋 Instructions pour ajouter la colonne is_admin:');
  console.log('Connectez-vous à Supabase Dashboard et exécutez cette requête SQL:');
  console.log(`
-- Ajouter la colonne is_admin à la table users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Mettre à jour votre utilisateur comme admin (remplacez l'ID)
UPDATE users
SET is_admin = true
WHERE id = 'c37e64bb-9b07-4e73-9950-2e71518c94bf';

-- Vérifier
SELECT id, nom, prenom, email, role, is_admin FROM users;
  `);
}

addAdminColumn().catch(console.error);
