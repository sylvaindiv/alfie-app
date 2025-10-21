import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Entreprise } from '../types/database.types';
import { Colors, Spacing, Typography, BorderRadius } from '../theme';
import { supabase } from '../config/supabase';

interface EntrepriseCardProps {
  entreprise: Entreprise;
  distance?: number | null;
  onPress: () => void;
}

export default function EntrepriseCard({
  entreprise,
  distance,
  onPress,
}: EntrepriseCardProps) {
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
      <View style={styles.content}>
        {/* Première photo de la galerie */}
        <Image source={imageSource} style={styles.logo} resizeMode="cover" />

        {/* Infos */}
        <View style={styles.infoContainer}>
          <View style={styles.topRow}>
            <Text style={styles.nom}>{entreprise.nom_commercial}</Text>
            <View
              style={[
                styles.badge,
                entreprise.type_commission === 'pourcentage' &&
                  styles.badgePercentage,
              ]}
            >
              <Text style={styles.badgeText}>{commissionText}</Text>
            </View>
          </View>

          {/* Ville + Distance */}
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.ville}>
              {entreprise.ville}
              {distance && ` • ${distance.toFixed(1)} km`}
            </Text>
          </View>

          {/* Adresse */}
          <Text style={styles.adresse}>{entreprise.adresse}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    minHeight: 120,
  },
  logo: {
    width: 110,
    height: 110,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
    margin: Spacing.md,
  },
  infoContainer: {
    flex: 1,
    marginLeft: Spacing.xs,
    paddingVertical: Spacing.lg,
    paddingRight: Spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  nom: {
    flex: 1,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    fontFamily: Typography.fontFamily.heading,
    color: Colors.textPrimary,
    marginRight: Spacing.md,
  },
  badge: {
    backgroundColor: 'rgba(255, 91, 41, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  badgePercentage: {
    backgroundColor: 'rgba(255, 91, 41, 0.25)',
  },
  badgeText: {
    color: Colors.primaryDark,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    fontFamily: Typography.fontFamily.body,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  ville: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  adresse: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textDisabled,
  },
});