import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, Typography, BorderRadius } from '../theme';
import { compressImage } from '../utils/imageCompression';

interface ImageUploaderProps {
  label: string;
  imageUri: string | null;
  onImageSelected: (uri: string) => void;
  onImageRemoved: () => void;
  loading?: boolean;
  aspectRatio?: [number, number]; // [width, height]
  maxImages?: number; // Pour limite (ex: 1 pour logo)
}

export default function ImageUploader({
  label,
  imageUri,
  onImageSelected,
  onImageRemoved,
  loading = false,
  aspectRatio = [16, 9],
  maxImages = 1,
}: ImageUploaderProps) {
  const pickImage = async () => {
    // Demander la permission
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert('Permission d\'accès à la galerie refusée');
      return;
    }

    // Ouvrir le sélecteur d'images
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: aspectRatio,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      // Compresser l'image avant de l'envoyer
      const compressedUri = await compressImage(result.assets[0].uri);
      onImageSelected(compressedUri);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {imageUri ? (
        // Afficher l'image uploadée
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.surface} />
            </View>
          )}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={onImageRemoved}
            disabled={loading}
          >
            <Feather name="x" size={20} color={Colors.surface} />
          </TouchableOpacity>
        </View>
      ) : (
        // Bouton d'upload
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={pickImage}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <>
              <Feather name="upload" size={24} color={Colors.primary} />
              <Text style={styles.uploadText}>Choisir une image</Text>
              <Text style={styles.uploadHint}>
                Max {maxImages} image{maxImages > 1 ? 's' : ''}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  uploadButton: {
    height: 160,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
  },
  uploadText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.base,
    color: Colors.primary,
    marginTop: Spacing.sm,
    fontWeight: Typography.weight.semiBold,
  },
  uploadHint: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  imageContainer: {
    position: 'relative',
    height: 160,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
