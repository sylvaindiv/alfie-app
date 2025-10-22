import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../config/supabase';
import { Association, Entreprise } from '../types/database.types';
import { Colors, Spacing, Typography, BorderRadius, CommonStyles, getShadow } from '../theme';

interface PhotoRecoScreenProps {
  route: {
    params: {
      entrepriseId: string;
    };
  };
  navigation: any;
}

export default function PhotoRecoScreen({
  route,
  navigation,
}: PhotoRecoScreenProps) {
  // User hardcodé pour le MVP
  const USER_ID = 'c37e64bb-9b07-4e73-9950-2e71518c94bf'; // Sylvain DI VITO
  const { entrepriseId } = route.params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [userAssociations, setUserAssociations] = useState<Association[]>([]);
  const [selectedAssociationId, setSelectedAssociationId] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    requestPermissions();
  }, []);

  async function requestPermissions() {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permissions requises',
        'Nous avons besoin des permissions caméra et galerie pour utiliser cette fonctionnalité.'
      );
    }
  }

  async function loadData() {
    try {
      // Charger l'entreprise
      const { data: entrepriseData, error: entrepriseError } = await supabase
        .from('entreprises')
        .select('*')
        .eq('id', entrepriseId)
        .single();

      if (entrepriseError) throw entrepriseError;
      setEntreprise(entrepriseData);

      // Charger les associations de l'utilisateur
      const { data: assosData, error: assosError } = await supabase
        .from('ambassadeurs')
        .select(`
          association:associations(*)
        `)
        .eq('user_id', USER_ID);

      if (assosError) throw assosError;

      const associations = (assosData || [])
        .map((item: any) => item.association)
        .filter((asso: any) => asso !== null);

      setUserAssociations(associations);

      // Si une seule association, la sélectionner automatiquement
      if (associations.length === 1) {
        setSelectedAssociationId(associations[0].id);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  async function takePhoto() {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  }

  async function pickFromGallery() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur sélection photo:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner la photo');
    }
  }

  async function uploadPhotoToSupabase(uri: string): Promise<string | null> {
    try {
      // Générer un nom de fichier unique
      const timestamp = Date.now();
      const fileName = `preuves/${USER_ID}/${timestamp}.jpg`;

      // Lire le fichier en tant qu'ArrayBuffer
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from('photos-preuves')
        .upload(fileName, fileData, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Erreur détaillée upload:', error);
        throw error;
      }

      // Récupérer l'URL publique
      const { data: publicUrlData } = supabase.storage
        .from('photos-preuves')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Erreur upload photo:', error);
      throw error; // Propager l'erreur au lieu de retourner null
    }
  }

  async function handleSubmit() {
    // Validation
    if (!photoUri) {
      Alert.alert('Photo requise', 'Veuillez prendre ou sélectionner une photo');
      return;
    }
    if (!selectedAssociationId) {
      Alert.alert('Erreur', 'Veuillez sélectionner une association');
      return;
    }

    setSubmitting(true);

    try {
      // Upload de la photo
      const photoUrl = await uploadPhotoToSupabase(photoUri);
      if (!photoUrl) {
        throw new Error('Échec de l\'upload de la photo');
      }

      // Créer le deal
      const { data: dealData, error: dealError } = await supabase
        .from('deals')
        .insert({
          type_deal: 'auto_recommandation',
          ambassadeur_id: USER_ID,
          association_id: selectedAssociationId,
          entreprise_id: entrepriseId,
          statut: 'en_attente',
          montant_commission: entreprise?.valeur_commission || null,
        })
        .select()
        .single();

      if (dealError) throw dealError;

      // Créer la preuve photo associée au deal
      const { error: preuveError } = await supabase
        .from('preuves_photos')
        .insert({
          deal_id: dealData.id,
          photo_url: photoUrl,
          statut: 'en_attente',
        });

      if (preuveError) {
        console.warn('Erreur création preuve photo:', preuveError);
      }

      // Incrémenter le compteur nb_deals_crees de l'ambassadeur
      const { data: ambassadeurData } = await supabase
        .from('ambassadeurs')
        .select('nb_deals_crees')
        .eq('user_id', USER_ID)
        .eq('association_id', selectedAssociationId)
        .single();

      if (ambassadeurData) {
        await supabase
          .from('ambassadeurs')
          .update({
            nb_deals_crees: (ambassadeurData.nb_deals_crees || 0) + 1,
          })
          .eq('user_id', USER_ID)
          .eq('association_id', selectedAssociationId);
      }

      // Incrémenter le compteur nb_deals_recus de l'entreprise
      const { data: entrepriseData } = await supabase
        .from('entreprises')
        .select('nb_deals_recus')
        .eq('id', entrepriseId)
        .single();

      if (entrepriseData) {
        await supabase
          .from('entreprises')
          .update({
            nb_deals_recus: (entrepriseData.nb_deals_recus || 0) + 1,
          })
          .eq('id', entrepriseId);
      }

      Alert.alert(
        'Auto-recommandation envoyée !',
        `Votre achat chez ${entreprise?.nom_commercial} a été enregistré avec succès.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Utiliser reset pour empêcher le retour en arrière
              navigation.reset({
                index: 0,
                routes: [{ name: 'Deals' }],
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Erreur création deal:', error);
      Alert.alert('Erreur', 'Impossible de créer l\'auto-recommandation');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preuve d'achat</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Entreprise info */}
        <View style={styles.entrepriseCard}>
          <Text style={styles.entrepriseLabel}>Achat chez</Text>
          <Text style={styles.entrepriseName}>{entreprise?.nom_commercial}</Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Feather name="info" size={22} color={Colors.info} />
          <Text style={styles.instructionsText}>
            Prenez en photo votre ticket de caisse ou votre preuve d'achat pour valider votre recommandation.
          </Text>
        </View>

        {/* Zone photo */}
        <View style={styles.photoSection}>
          {photoUri ? (
            <View style={styles.photoPreviewContainer}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => setPhotoUri(null)}
              >
                <Feather name="x-circle" size={28} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Feather name="camera" size={56} color={Colors.textDisabled} />
              <Text style={styles.photoPlaceholderText}>Aucune photo sélectionnée</Text>
            </View>
          )}
        </View>

        {/* Boutons photo */}
        <View style={styles.photoButtonsContainer}>
          <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
            <Feather name="camera" size={22} color={Colors.surface} />
            <Text style={styles.photoButtonText}>Prendre une photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.photoButton} onPress={pickFromGallery}>
            <Feather name="image" size={22} color={Colors.surface} />
            <Text style={styles.photoButtonText}>Depuis la galerie</Text>
          </TouchableOpacity>
        </View>

        {/* Sélection association */}
        {userAssociations.length > 1 && (
          <View style={styles.associationSection}>
            <Text style={styles.sectionTitle}>
              Association bénéficiaire <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.associationHint}>
              Sélectionnez l'association qui recevra la commission
            </Text>
            {userAssociations.map((association) => (
              <TouchableOpacity
                key={association.id}
                style={[
                  styles.associationOption,
                  selectedAssociationId === association.id && styles.associationOptionSelected,
                ]}
                onPress={() => setSelectedAssociationId(association.id)}
              >
                <View style={styles.radioOuter}>
                  {selectedAssociationId === association.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text
                  style={[
                    styles.associationName,
                    selectedAssociationId === association.id && styles.associationNameSelected,
                  ]}
                >
                  {association.nom}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Commission info */}
        {entreprise && (
          <View style={styles.commissionCard}>
            <Feather name="gift" size={18} color={Colors.success} />
            <Text style={styles.commissionText}>
              Cette recommandation rapportera{' '}
              <Text style={styles.commissionAmount}>
                {entreprise.type_commission === 'montant_fixe'
                  ? `${entreprise.valeur_commission}€`
                  : `${entreprise.valeur_commission}%`}
              </Text>
              {' '}à votre association
            </Text>
          </View>
        )}

        {/* Bouton de soumission */}
        <TouchableOpacity
          style={[styles.submitButton, (submitting || !photoUri) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting || !photoUri}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.surface} />
          ) : (
            <>
              <Feather name="check-circle" size={18} color={Colors.surface} />
              <Text style={styles.submitButtonText}>Valider ma recommandation</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  entrepriseCard: {
    ...CommonStyles.card,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  entrepriseLabel: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  entrepriseName: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },
  instructionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.info + '15',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  instructionsText: {
    flex: 1,
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  photoSection: {
    marginBottom: Spacing.lg,
  },
  photoPlaceholder: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    aspectRatio: 4 / 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textDisabled,
    marginTop: Spacing.sm,
  },
  photoPreviewContainer: {
    position: 'relative',
    aspectRatio: 4 / 3,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.md,
  },
  removePhotoButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 16,
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  photoButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    ...getShadow('small'),
  },
  photoButtonText: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.semiBold,
    color: Colors.surface,
  },
  associationSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  required: {
    color: Colors.error,
  },
  associationHint: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  associationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  associationOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  associationName: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  associationNameSelected: {
    fontWeight: Typography.weight.semiBold,
    color: Colors.surface,
  },
  commissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '15',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  commissionText: {
    flex: 1,
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textPrimary,
  },
  commissionAmount: {
    fontWeight: Typography.weight.bold,
    color: Colors.success,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    ...getShadow('medium'),
    minHeight: 52,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textDisabled,
  },
  submitButtonText: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.bold,
    color: Colors.surface,
  },
});
