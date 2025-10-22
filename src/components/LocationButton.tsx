import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors, Spacing, Typography, BorderRadius, getShadow } from '../theme';
import { GOOGLE_PLACES_API_KEY } from '../config/constants';

interface PlaceSuggestion {
  place_id: string;
  description: string;
}

interface LocationButtonProps {
  onLocationSelected: (location: LocationData) => void;
}

export interface LocationData {
  type: 'current' | 'address';
  latitude?: number;
  longitude?: number;
  address?: string;
}

export default function LocationButton({ onLocationSelected }: LocationButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddressFocused, setIsAddressFocused] = useState(false);

  async function handleCurrentLocation() {
    try {
      setLoadingLocation(true);

      // Demander la permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Veuillez autoriser la géolocalisation dans les paramètres de votre téléphone.'
        );
        return;
      }

      // Obtenir la position actuelle
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const locationData: LocationData = {
        type: 'current',
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setSelectedLocation(locationData);
      onLocationSelected(locationData);
      setModalVisible(false);
      Alert.alert('Succès', 'Position actuelle définie');
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
      Alert.alert('Erreur', 'Impossible d\'obtenir votre position');
    } finally {
      setLoadingLocation(false);
    }
  }

  // Debounce pour la recherche d'adresses
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (addressInput.length >= 3) {
        searchPlaces(addressInput);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [addressInput]);

  async function searchPlaces(input: string) {
    try {
      setIsSearching(true);

      // Sur React Native, pas de problème CORS - on peut appeler l'API directement
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&language=fr&components=country:fr&key=${GOOGLE_PLACES_API_KEY}`;

      console.log('Fetching suggestions for:', input);
      const response = await fetch(url);
      const data = await response.json();

      console.log('Google Places API response:', data.status, data.predictions?.length || 0, 'predictions');

      if (data.status === 'OK' && data.predictions && data.predictions.length > 0) {
        setSuggestions(
          data.predictions.slice(0, 5).map((prediction: any) => ({
            place_id: prediction.place_id,
            description: prediction.description,
          }))
        );
      } else if (data.status === 'ZERO_RESULTS') {
        // Aucun résultat trouvé - afficher une suggestion pour rechercher quand même
        console.log('No results found, showing fallback suggestion');
        setSuggestions([
          {
            place_id: `search_${input}`,
            description: input,
          },
        ]);
      } else {
        // Erreur API (REQUEST_DENIED, INVALID_REQUEST, etc.)
        console.warn('Google Places API error:', data.status);
        if (data.error_message) {
          console.warn('Error message:', data.error_message);
        }
        // Afficher quand même une suggestion pour permettre la recherche
        setSuggestions([
          {
            place_id: `search_${input}`,
            description: input,
          },
        ]);
      }
    } catch (error) {
      console.error('Error searching places:', error);
      // Fallback sur une suggestion simple
      setSuggestions([
        {
          place_id: `search_${input}`,
          description: input,
        },
      ]);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSuggestionSelect(suggestion: PlaceSuggestion) {
    try {
      setLoadingLocation(true);
      setSuggestions([]);
      Keyboard.dismiss();

      // Utiliser expo-location pour géocoder l'adresse
      const geocoded = await Location.geocodeAsync(suggestion.description);

      if (geocoded.length > 0) {
        const locationData: LocationData = {
          type: 'address',
          latitude: geocoded[0].latitude,
          longitude: geocoded[0].longitude,
          address: suggestion.description,
        };

        setSelectedLocation(locationData);
        onLocationSelected(locationData);
        setModalVisible(false);
        setAddressInput('');
        Alert.alert('Succès', 'Adresse définie');
      } else {
        Alert.alert('Erreur', 'Impossible de trouver cette adresse');
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      Alert.alert('Erreur', 'Impossible de localiser cette adresse');
    } finally {
      setLoadingLocation(false);
    }
  }


  function getButtonText() {
    if (!selectedLocation) {
      return 'Définir ma position';
    }
    if (selectedLocation.type === 'current') {
      return 'Autour de moi';
    }
    return selectedLocation.address || 'Adresse définie';
  }

  const hasLocation = selectedLocation !== null;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.locationButton,
          hasLocation && styles.locationButtonActive,
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Feather
          name="map-pin"
          size={18}
          color={Colors.primary}
          style={styles.icon}
        />
        <Text
          style={[
            styles.locationButtonText,
            hasLocation && styles.locationButtonTextActive,
          ]}
        >
          {getButtonText()}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            setModalVisible(false);
            setIsAddressFocused(false);
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 60}
          >
            <View
              style={[
                styles.modalContentWrapper,
                isAddressFocused && styles.modalContentWrapperFocused,
              ]}
            >
              <TouchableOpacity
                activeOpacity={1}
                style={styles.modalContent}
                onPress={(e) => e.stopPropagation()}
              >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choisir ma position</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Feather name="x" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {loadingLocation ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>Localisation en cours...</Text>
                </View>
              ) : (
                <>
                  {/* Option: Autour de moi */}
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={handleCurrentLocation}
                  >
                    <View style={styles.modalOptionIcon}>
                      <Feather name="navigation" size={20} color={Colors.primary} />
                    </View>
                    <Text style={styles.modalOptionText}>Autour de moi</Text>
                  </TouchableOpacity>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>ou</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Option: Entrer une adresse avec autocomplétion */}
                  <View style={styles.addressSection}>
                    <Text style={styles.addressLabel}>Entrer une adresse</Text>

                    <View style={styles.addressInputWrapper}>
                      <View style={styles.addressInputContainer}>
                        <Feather
                          name="map-pin"
                          size={18}
                          color={Colors.textSecondary}
                          style={styles.addressIcon}
                        />
                        <TextInput
                          style={styles.addressInput}
                          placeholder="Ex: 75 Avenue des Champs-Élysées, Paris"
                          value={addressInput}
                          onChangeText={setAddressInput}
                          placeholderTextColor={Colors.textDisabled}
                          autoCapitalize="none"
                          autoCorrect={false}
                          onFocus={() => setIsAddressFocused(true)}
                          onBlur={() => setIsAddressFocused(false)}
                        />
                        {isSearching && (
                          <ActivityIndicator size="small" color={Colors.primary} />
                        )}
                      </View>

                      {/* Liste des suggestions */}
                      {suggestions.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                          <ScrollView
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            nestedScrollEnabled={true}
                            style={styles.suggestionsScrollView}
                          >
                            {suggestions.map((item, index) => (
                              <View key={item.place_id}>
                                {index > 0 && <View style={styles.suggestionSeparator} />}
                                <TouchableOpacity
                                  style={styles.suggestionItem}
                                  onPress={() => handleSuggestionSelect(item)}
                                >
                                  <Feather
                                    name="map-pin"
                                    size={16}
                                    color={Colors.textSecondary}
                                    style={styles.suggestionIcon}
                                  />
                                  <Text style={styles.suggestionText} numberOfLines={2}>
                                    {item.description}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  </View>
                </>
              )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.primary}26`,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minHeight: 44,
    alignSelf: 'flex-start',
  },
  locationButtonActive: {
    backgroundColor: `${Colors.primary}20`,
    borderWidth: 0,
    justifyContent: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  locationButtonText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.semibold as any,
    color: Colors.primary,
    lineHeight: Typography.size.sm * 1.4,
    includeFontPadding: false,
  },
  locationButtonTextActive: {
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentWrapper: {
    width: '100%',
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  modalContentWrapperFocused: {
    position: 'absolute',
    top: Spacing.xxxl + Spacing.lg,
    left: 0,
    right: 0,
    justifyContent: 'flex-start',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.bold as any,
    color: Colors.textPrimary,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  loadingText: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  modalOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.round,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  modalOptionText: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.semibold as any,
    color: Colors.textPrimary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.md,
  },
  addressSection: {
    marginTop: Spacing.md,
  },
  addressLabel: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    fontWeight: '600' as any,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  addressInputWrapper: {
    position: 'relative',
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  addressIcon: {
    marginRight: Spacing.sm,
  },
  addressInput: {
    flex: 1,
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textPrimary,
    height: 46,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 250,
    overflow: 'hidden',
    zIndex: 1001,
    ...getShadow('large'),
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
  },
  suggestionIcon: {
    marginRight: Spacing.sm,
  },
  suggestionText: {
    flex: 1,
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textPrimary,
    lineHeight: Typography.size.sm * 1.4,
  },
  suggestionSeparator: {
    height: 1,
    backgroundColor: Colors.border,
  },
  suggestionsScrollView: {
    maxHeight: 250,
  },
});
