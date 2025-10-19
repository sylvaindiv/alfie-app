import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CategoryCardProps {
  nom: string;
  imageUrl?: string | null;
  onPress: () => void;
}

// Images par défaut pour chaque catégorie
const CATEGORY_IMAGES: { [key: string]: any } = {
  'Restauration': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
  'Sport & Fitness': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
  'Beauté & Bien-être': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
  'Services': 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400',
  'Commerce': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
};

export default function CategoryCard({ nom, imageUrl, onPress }: CategoryCardProps) {
  const backgroundImage = imageUrl || CATEGORY_IMAGES[nom] || CATEGORY_IMAGES['Commerce'];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <ImageBackground
        source={{ uri: backgroundImage }}
        style={styles.backgroundImage}
        imageStyle={styles.imageStyle}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
          style={styles.gradient}
        >
          <Text style={styles.text}>{nom}</Text>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  imageStyle: {
    borderRadius: 20,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  text: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});