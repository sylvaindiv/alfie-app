import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Compresse une image avant upload
 * @param uri - URI de l'image à compresser
 * @param maxWidth - Largeur maximale (défaut: 1200px)
 * @param quality - Qualité de compression (défaut: 0.8)
 * @returns URI de l'image compressée
 */
export const compressImage = async (
  uri: string,
  maxWidth: number = 1200,
  quality: number = 0.8,
): Promise<string> => {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG },
    );

    return manipResult.uri;
  } catch (error) {
    console.error('Erreur lors de la compression de l\'image:', error);
    // En cas d'erreur, retourne l'URI originale
    return uri;
  }
};
