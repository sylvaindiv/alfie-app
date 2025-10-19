import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://opcasadetsteifqyaeno.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wY2FzYWRldHN0ZWlmcXlhZW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyOTE2NTQsImV4cCI6MjA3NTg2NzY1NH0.Mlq7G4XHua6CHk8Gm8eyokMFUSLNLwxvR5JRAhUxZko';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCurrentState() {
  console.log('🔍 Vérification de l\'état actuel des photos...\n');

  // Vérifier les photos actuelles
  const { data: photos, error } = await supabase
    .from('entreprises_photos')
    .select('id, photo_url, ordre_affichage, entreprises(nom_commercial)')
    .limit(10);

  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }

  console.log('📸 Exemples de photos actuelles:');
  console.log(JSON.stringify(photos, null, 2));

  // Compter les photos avec des problèmes
  const { data: problematicPhotos, error: probError } = await supabase
    .from('entreprises_photos')
    .select('*')
    .or('photo_url.eq.{},photo_url.is.null,photo_url.eq.');

  if (!probError && problematicPhotos) {
    console.log(`\n⚠️  ${problematicPhotos.length} photos avec des URL problématiques`);
  }

  // Compter les photos Unsplash restantes
  const { data: unsplashPhotos, error: unsplashError } = await supabase
    .from('entreprises_photos')
    .select('*')
    .ilike('photo_url', '%source.unsplash.com%');

  if (!unsplashError && unsplashPhotos) {
    console.log(`📊 ${unsplashPhotos.length} photos Unsplash restantes`);
  }
}

async function fixAllPhotos() {
  console.log('\n🚀 Début de la correction des photos...\n');

  // Récupérer TOUTES les photos avec leurs entreprises
  const { data: allPhotos, error: fetchError } = await supabase
    .from('entreprises_photos')
    .select('id, photo_url, ordre_affichage, entreprise_id, entreprises(nom_commercial)');

  if (fetchError) {
    console.error('❌ Erreur:', fetchError);
    return;
  }

  console.log(`📸 Total de ${allPhotos?.length || 0} photos à vérifier\n`);

  let fixedCount = 0;
  let skippedCount = 0;

  for (const photo of allPhotos || []) {
    const photoUrl = photo.photo_url || '';
    const needsFix = photoUrl === '{}' ||
                     photoUrl === '' ||
                     photoUrl === null ||
                     photoUrl.includes('source.unsplash.com');

    if (!needsFix) {
      skippedCount++;
      continue;
    }

    const entrepriseName = (photo.entreprises as any)?.nom_commercial || 'business';
    const seed = `${entrepriseName}-${photo.ordre_affichage}-${photo.entreprise_id.substring(0, 8)}`;
    const newPhotoUrl = `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/600`;

    console.log(`🔄 Correction: ${entrepriseName} (ordre ${photo.ordre_affichage})`);
    console.log(`   Ancienne URL: ${photoUrl}`);
    console.log(`   Nouvelle URL: ${newPhotoUrl}`);

    const { error: updateError } = await supabase
      .from('entreprises_photos')
      .update({ photo_url: newPhotoUrl })
      .eq('id', photo.id);

    if (updateError) {
      console.error(`❌ Erreur de mise à jour:`, updateError);
    } else {
      console.log(`✅ Photo corrigée\n`);
      fixedCount++;
    }
  }

  console.log(`\n✨ Correction terminée!`);
  console.log(`   ✅ ${fixedCount} photos corrigées`);
  console.log(`   ⏭️  ${skippedCount} photos déjà correctes`);
}

async function main() {
  await checkCurrentState();
  console.log('\n' + '='.repeat(60) + '\n');
  await fixAllPhotos();
  console.log('\n' + '='.repeat(60) + '\n');
  await checkCurrentState();
}

main();
