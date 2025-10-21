import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Entreprise } from '../types/database.types';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../theme';
import { supabase } from '../config/supabase';

interface EntrepriseCardHorizontalProps {
  entreprise: Entreprise;
  distance?: number | null;
  onPress: () => void;
}

export default function EntrepriseCardHorizontal({
  entreprise,
  distance,
  onPress,
}: EntrepriseCardHorizontalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFirstGalleryPhoto();
  }, [entreprise.id]);

  async function fetchFirstGalleryPhoto() {
    try {
      // Récupérer la première photo de la galerie
      const { data: photos, error } = await supabase
        .from('entreprises_photos')
        .select('photo_url')
        .eq('entreprise_id', entreprise.id)
        .order('ordre_affichage', { ascending: true })
        .limit(1);

      if (error) {
        console.error('Erreur lors de la récupération de la photo:', error);
        setImageUrl(null);
        setLoading(false);
        return;
      }

      if (photos && photos.length > 0) {
        const photo = photos[0];
        // Si l'URL est complète (commence par http), l'utiliser telle quelle
        if (photo.photo_url.startsWith('http')) {
          setImageUrl(photo.photo_url);
        } else {
          // Sinon construire l'URL depuis le bucket Supabase
          const { data } = supabase.storage
            .from('entreprises-photos')
            .getPublicUrl(photo.photo_url);
          setImageUrl(data.publicUrl);
        }
      } else {
        setImageUrl(null);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la photo:', error);
      setImageUrl(null);
    } finally {
      setLoading(false);
    }
  }

  const commissionText =
    entreprise.type_commission === 'montant_fixe'
      ? `${entreprise.valeur_commission}€`
      : `${entreprise.valeur_commission}%`;

  const imageSource = imageUrl
    ? { uri: imageUrl }
    : require('../../assets/icon.png');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Première photo de la galerie */}
      <Image source={imageSource} style={styles.photo} resizeMode="cover" />

      {/* Badge commission positionné sur la photo */}
      <View
        style={[
          styles.badge,
          entreprise.type_commission === 'pourcentage' && styles.badgePercentage,
        ]}
      >
        <Text style={styles.badgeText}>{commissionText}</Text>
      </View>

      {/* Informations en dessous */}
      <View style={styles.infoContainer}>
        {/* Nom */}
        <Text style={styles.nom} numberOfLines={2}>
          {entreprise.nom_commercial}
        </Text>

        {/* Ville + Distance */}
        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={14}
            color={Colors.textSecondary}
          />
          <Text style={styles.ville} numberOfLines={1}>
            {entreprise.ville}
            {distance && ` • ${distance.toFixed(1)} km`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    width: 180,
    marginRight: Spacing.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  photo: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.background,
  },
  badge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(255, 91, 41, 0.95)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    ...Shadows.medium,
  },
  badgePercentage: {
    backgroundColor: 'rgba(255, 91, 41, 1)',
  },
  badgeText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    fontFamily: Typography.fontFamily.body,
  },
  infoContainer: {
    padding: Spacing.lg,
  },
  nom: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    fontFamily: Typography.fontFamily.heading,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    minHeight: 44,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ville: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    flex: 1,
  },
});
