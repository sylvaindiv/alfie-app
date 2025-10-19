import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://opcasadetsteifqyaeno.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wY2FzYWRldHN0ZWlmcXlhZW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyOTE2NTQsImV4cCI6MjA3NTg2NzY1NH0.Mlq7G4XHua6CHk8Gm8eyokMFUSLNLwxvR5JRAhUxZko';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectDatabase() {
  console.log('🔍 Inspection de la structure de la base de données...\n');

  // Récupérer quelques lignes de entreprises_photos pour comprendre la structure
  const { data: photos, error: photosError } = await supabase
    .from('entreprises_photos')
    .select('*')
    .limit(5);

  if (photosError) {
    console.error('❌ Erreur lors de la récupération des photos:', photosError);
  } else {
    console.log('📸 Structure de entreprises_photos:');
    console.log(JSON.stringify(photos, null, 2));
  }

  // Récupérer quelques lignes de entreprises pour comprendre la structure
  const { data: entreprises, error: entreprisesError } = await supabase
    .from('entreprises')
    .select('*')
    .limit(5);

  if (entreprisesError) {
    console.error('❌ Erreur lors de la récupération des entreprises:', entreprisesError);
  } else {
    console.log('\n🏢 Structure de entreprises:');
    console.log(JSON.stringify(entreprises, null, 2));
  }

  // Compter les photos avec unsplash
  const { data: unsplashPhotos, error: countError } = await supabase
    .from('entreprises_photos')
    .select('*')
    .ilike('photo_url', '%source.unsplash.com%');

  if (countError) {
    console.error('❌ Erreur lors du comptage:', countError);
  } else {
    console.log(`\n📊 Nombre de photos Unsplash à remplacer: ${unsplashPhotos?.length || 0}`);
    if (unsplashPhotos && unsplashPhotos.length > 0) {
      console.log('Exemples de photos Unsplash trouvées:');
      console.log(JSON.stringify(unsplashPhotos.slice(0, 3), null, 2));
    }
  }
}

async function getFreePicsum(query: string): Promise<string> {
  // Utiliser Picsum Photos (Lorem Picsum) qui ne nécessite pas de clé API
  // Génère une image aléatoire de 800x600
  const seed = encodeURIComponent(query);
  return `https://picsum.photos/seed/${seed}/800/600`;
}

async function updatePhotos() {
  console.log('\n🚀 Début de la mise à jour des photos...\n');

  // Récupérer toutes les photos avec unsplash et leurs entreprises associées
  const { data: photosToUpdate, error: fetchError } = await supabase
    .from('entreprises_photos')
    .select('*, entreprises(*)')
    .ilike('photo_url', '%source.unsplash.com%');

  if (fetchError) {
    console.error('❌ Erreur:', fetchError);
    return;
  }

  console.log(`📸 ${photosToUpdate?.length || 0} photos à mettre à jour\n`);

  for (const photo of photosToUpdate || []) {
    const entrepriseName = photo.entreprises?.nom_commercial || 'business office';
    console.log(`🔄 Traitement: ${entrepriseName} (photo ID: ${photo.id})`);

    // Récupérer une nouvelle photo
    const newPhotoUrl = getFreePicsum(entrepriseName + '-' + photo.ordre_affichage);

    // Mettre à jour la photo (UPDATE au lieu de DELETE + INSERT)
    const { error: updateError } = await supabase
      .from('entreprises_photos')
      .update({ photo_url: newPhotoUrl })
      .eq('id', photo.id);

    if (updateError) {
      console.error(`❌ Erreur de mise à jour pour ${entrepriseName}:`, updateError);
    } else {
      console.log(`✅ Photo mise à jour pour ${entrepriseName}`);
    }
  }

  console.log('\n✨ Mise à jour terminée!');
}

// Exécuter l'inspection puis la mise à jour
inspectDatabase().then(() => {
  console.log('\n▶️  Lancement de la mise à jour...\n');
  return updatePhotos();
});
