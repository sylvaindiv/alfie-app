import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://opcasadetsteifqyaeno.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wY2FzYWRldHN0ZWlmcXlhZW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyOTE2NTQsImV4cCI6MjA3NTg2NzY1NH0.Mlq7G4XHua6CHk8Gm8eyokMFUSLNLwxvR5JRAhUxZko';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Script de migration one-time pour définir la première photo de chaque entreprise
 * en utilisant l'URL du logo (logo_url ou logo_upload)
 */
async function migrateLogoToFirstPhoto() {
  console.log('🚀 Début de la migration: Logo → Première photo de la galerie\n');

  try {
    // 1. Récupérer toutes les entreprises
    console.log('📋 Récupération de toutes les entreprises...');
    const { data: entreprises, error: entreprisesError } = await supabase
      .from('entreprises')
      .select('id, nom_commercial, logo_url, logo_upload');

    if (entreprisesError) {
      console.error('❌ Erreur lors de la récupération des entreprises:', entreprisesError);
      return;
    }

    console.log(`✅ ${entreprises?.length || 0} entreprises trouvées\n`);

    if (!entreprises || entreprises.length === 0) {
      console.log('⚠️  Aucune entreprise à migrer');
      return;
    }

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // 2. Pour chaque entreprise
    for (const entreprise of entreprises) {
      console.log(`\n🏢 Traitement: ${entreprise.nom_commercial}`);

      // Déterminer l'URL du logo à utiliser
      let logoUrl: string | null = null;

      if (entreprise.logo_upload) {
        // Si logo_upload existe, construire l'URL depuis Supabase Storage
        const { data } = supabase.storage
          .from('galerie')
          .getPublicUrl(entreprise.logo_upload);
        logoUrl = data.publicUrl;
        console.log(`  📸 Logo depuis Storage: ${entreprise.logo_upload}`);
      } else if (entreprise.logo_url) {
        // Sinon utiliser logo_url directement
        logoUrl = entreprise.logo_url;
        console.log(`  🔗 Logo URL: ${entreprise.logo_url}`);
      } else {
        console.log(`  ⏭️  Pas de logo - skip`);
        skipCount++;
        continue;
      }

      // 3. Vérifier si l'entreprise a déjà une première photo
      const { data: existingPhotos, error: photosError } = await supabase
        .from('entreprises_photos')
        .select('id, photo_url, ordre_affichage')
        .eq('entreprise_id', entreprise.id)
        .order('ordre_affichage', { ascending: true })
        .limit(1);

      if (photosError) {
        console.error(`  ❌ Erreur lors de la vérification des photos:`, photosError);
        errorCount++;
        continue;
      }

      if (existingPhotos && existingPhotos.length > 0) {
        // 4a. Si une première photo existe, la mettre à jour
        const firstPhoto = existingPhotos[0];
        console.log(`  🔄 Mise à jour de la photo existante (ordre: ${firstPhoto.ordre_affichage})`);

        const { error: updateError } = await supabase
          .from('entreprises_photos')
          .update({ photo_url: logoUrl })
          .eq('id', firstPhoto.id);

        if (updateError) {
          console.error(`  ❌ Erreur lors de la mise à jour:`, updateError);
          errorCount++;
          continue;
        }

        console.log(`  ✅ Photo mise à jour avec succès`);
        successCount++;
      } else {
        // 4b. Si aucune photo n'existe, en créer une nouvelle
        console.log(`  ➕ Création d'une nouvelle photo (ordre: 1)`);

        const { error: insertError } = await supabase
          .from('entreprises_photos')
          .insert({
            entreprise_id: entreprise.id,
            photo_url: logoUrl,
            ordre_affichage: 1,
          });

        if (insertError) {
          console.error(`  ❌ Erreur lors de la création:`, insertError);
          errorCount++;
          continue;
        }

        console.log(`  ✅ Photo créée avec succès`);
        successCount++;
      }
    }

    // 5. Résumé final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DE LA MIGRATION');
    console.log('='.repeat(60));
    console.log(`✅ Succès:   ${successCount}`);
    console.log(`⏭️  Skipped:  ${skipCount} (pas de logo)`);
    console.log(`❌ Erreurs:  ${errorCount}`);
    console.log(`📝 Total:    ${entreprises.length}`);
    console.log('='.repeat(60));

    if (errorCount === 0) {
      console.log('\n🎉 Migration terminée avec succès !');
    } else {
      console.log('\n⚠️  Migration terminée avec des erreurs');
    }

  } catch (error) {
    console.error('\n💥 Erreur critique:', error);
  }
}

// Exécuter la migration
migrateLogoToFirstPhoto();
