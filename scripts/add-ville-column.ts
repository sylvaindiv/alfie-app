import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://opcasadetsteifqyaeno.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wY2FzYWRldHN0ZWlmcXlhZW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyOTE2NTQsImV4cCI6MjA3NTg2NzY1NH0.Mlq7G4XHua6CHk8Gm8eyokMFUSLNLwxvR5JRAhUxZko';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addVilleColumn() {
  console.log('Ajout de la colonne ville à la table users...');

  // Note: Cette requête nécessite des privilèges admin/service_role
  // Vous devrez exécuter cette commande manuellement dans le SQL Editor de Supabase
  console.log('\nVeuillez exécuter cette commande SQL dans le SQL Editor de Supabase:');
  console.log('----------------------------------------');
  console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS ville text;');
  console.log('----------------------------------------');
  console.log('\nPuis vérifiez avec:');
  console.log('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'users\';');
}

addVilleColumn();
