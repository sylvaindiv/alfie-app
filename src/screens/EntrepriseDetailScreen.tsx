import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Platform,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { supabase } from '../config/supabase';
import { Entreprise } from '../types/database.types';
import { Colors, Spacing, Typography, CommonStyles, BorderRadius, getShadow } from '../theme';

const { width } = Dimensions.get('window');

interface EntrepriseDetailScreenProps {
  route: {
    params: {
      entrepriseId: string;
    };
  };
  navigation: any;
}

interface EntreprisePhoto {
  id: string;
  photo_url: string;
  ordre_affichage: number;
}

export default function EntrepriseDetailScreen({
  route,
  navigation,
}: EntrepriseDetailScreenProps) {
  const { entrepriseId } = route.params;

  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [photos, setPhotos] = useState<EntreprisePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Refs pour la navigation sticky
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [activeSection, setActiveSection] = useState('photos');

  // Stocker les positions Y de chaque section
  const sectionPositions = useRef<{ [key: string]: number }>({});

  // Refs pour chaque section
  const photosRef = useRef<View>(null);
  const descriptionRef = useRef<View>(null);
  const horairesRef = useRef<View>(null);
  const adresseRef = useRef<View>(null);
  const contactRef = useRef<View>(null);

  useEffect(() => {
    fetchEntrepriseDetails();
  }, [entrepriseId]);

  // Palette d'images par défaut variées pour différents types d'entreprises
  const DEFAULT_IMAGES = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop', // Restaurant
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop', // Café
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop', // Boutique
    'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&h=600&fit=crop', // Salon de beauté
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=600&fit=crop', // Gym/Sport
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop', // Boulangerie
    'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=800&h=600&fit=crop', // Hôtel
    'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&h=600&fit=crop', // Bar
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop', // Services
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop', // Bureau/Business
  ];

  // Fonction pour obtenir une image par défaut basée sur l'ID de l'entreprise
  function getDefaultImageForEntreprise(entrepriseId: string): string {
    // Utiliser un hash simple de l'ID pour obtenir un index cohérent
    let hash = 0;
    for (let i = 0; i < entrepriseId.length; i++) {
      hash = entrepriseId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % DEFAULT_IMAGES.length;
    return DEFAULT_IMAGES[index];
  }

  // Fonction pour vérifier si une URL est valide
  function isValidImageUrl(url: string): boolean {
    // URLs invalides connues
    if (url.includes('source.unsplash.com')) return false;
    if (url.includes('placeholder.com')) return false;
    if (url.includes('via.placeholder.com')) return false;

    return true;
  }

  // Fonction pour obtenir l'URL publique d'une image depuis Supabase Storage
  function getPublicImageUrl(photoUrl: string): string {
    // Si l'URL n'est pas valide, retourner une image par défaut spécifique à l'entreprise
    if (!isValidImageUrl(photoUrl)) {
      console.log('URL invalide détectée, utilisation de l\'image par défaut:', photoUrl);
      return getDefaultImageForEntreprise(entrepriseId);
    }

    // Si l'image a échoué, retourner une image par défaut spécifique à l'entreprise
    if (failedImages.has(photoUrl)) {
      return getDefaultImageForEntreprise(entrepriseId);
    }

    // Si l'URL est déjà complète (commence par http), la retourner telle quelle
    if (photoUrl.startsWith('http')) {
      return photoUrl;
    }

    // Sinon, construire l'URL depuis le bucket Supabase Storage
    const { data } = supabase.storage
      .from('entreprises-photos')
      .getPublicUrl(photoUrl);

    return data.publicUrl;
  }

  // Fonction pour gérer les erreurs d'images
  function handleImageError(imageUrl: string) {
    console.error('Erreur chargement image:', imageUrl);
    setFailedImages((prev) => new Set(prev).add(imageUrl));
  }

  async function fetchEntrepriseDetails() {
    try {
      // Récupérer l'entreprise
      const { data: entrepriseData, error: errorEntreprise } = await supabase
        .from('entreprises')
        .select('*')
        .eq('id', entrepriseId)
        .single();

      if (errorEntreprise) throw errorEntreprise;
      setEntreprise(entrepriseData);

      // Récupérer les photos
      const { data: photosData, error: errorPhotos } = await supabase
        .from('entreprises_photos')
        .select('*')
        .eq('entreprise_id', entrepriseId)
        .order('ordre_affichage', { ascending: true });

      if (errorPhotos) throw errorPhotos;

      // Log pour debug
      console.log('Photos récupérées:', photosData);

      setPhotos(photosData || []);
    } catch (error) {
      console.error('Erreur chargement entreprise:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails');
    } finally {
      setLoading(false);
    }
  }

  function handleCall() {
    if (entreprise?.telephone) {
      Linking.openURL(`tel:${entreprise.telephone}`);
    }
  }

  function handleEmail() {
    if (entreprise?.email) {
      Linking.openURL(`mailto:${entreprise.email}`);
    }
  }

  function handleWebsite() {
    if (entreprise?.site_web) {
      const url = entreprise.site_web.startsWith('http')
        ? entreprise.site_web
        : `https://${entreprise.site_web}`;
      Linking.openURL(url);
    }
  }

  function handleMaps() {
    if (entreprise) {
      const address = encodeURIComponent(
        `${entreprise.adresse}, ${entreprise.code_postal} ${entreprise.ville}`
      );
      Linking.openURL(`https://maps.apple.com/?q=${address}`);
    }
  }

  function handleCreateRecommandation() {
    if (!entreprise) return;

    // Router vers le bon écran selon le type de recommandation autorisé
    if (entreprise.type_recommandation_autorise === 'photo') {
      // Auto-recommandation uniquement
      navigation.navigate('PhotoReco', { entrepriseId: entreprise.id });
    } else if (entreprise.type_recommandation_autorise === 'formulaire') {
      // Recommandation de tiers uniquement
      navigation.navigate('FormulaireReco', { entrepriseId: entreprise.id });
    } else if (entreprise.type_recommandation_autorise === 'les_deux') {
      // Choix entre les deux
      navigation.navigate('ChoixTypeReco', { entrepriseId: entreprise.id });
    } else {
      // Cas de sécurité si le type n'est pas reconnu
      Alert.alert(
        'Erreur',
        'Type de recommandation non configuré pour cette entreprise'
      );
    }
  }

  // Détection dynamique des sections disponibles
  const availableSections = useMemo(() => {
    if (!entreprise) return [];

    const sections = [
      { id: 'photos', label: 'Photos', show: true },
      { id: 'description', label: 'À propos', show: !!entreprise.description },
      { id: 'horaires', label: 'Horaires', show: !!entreprise.horaires },
      { id: 'adresse', label: 'Adresse', show: true },
      {
        id: 'contact',
        label: 'Contact',
        show: !!(entreprise.telephone || entreprise.email || entreprise.site_web),
      },
    ];

    return sections.filter((section) => section.show);
  }, [entreprise]);

  // Callback pour enregistrer la position d'une section
  const handleSectionLayout = (sectionId: string, event: any) => {
    const { y } = event.nativeEvent.layout;
    sectionPositions.current[sectionId] = y;
  };

  // Fonction pour scroller vers une section
  const scrollToSection = (sectionId: string) => {
    const yPosition = sectionPositions.current[sectionId];

    if (yPosition !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: yPosition - 110, // Compensation pour le header sticky (hauteur ~110px)
        animated: true,
      });
      setActiveSection(sectionId);
    } else {
      console.log('Position non disponible pour la section:', sectionId);
    }
  };

  // Gérer le scroll pour détecter la section active et afficher/masquer le header
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;

        // Afficher le header sticky après avoir scrollé 150px (plus tôt)
        setShowStickyHeader(offsetY > 150);

        // TODO: Détecter la section active basée sur la position de scroll
        // Pour l'instant, on garde la section active telle quelle
      },
    }
  );

  // Parser les horaires pour un affichage propre
  function parseHoraires(horairesString: string): { jour: string; horaires: string }[] {
    if (!horairesString) return [];

    const horairesParsed: { jour: string; horaires: string }[] = [];
    const joursComplets = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const joursAbrev: { [key: string]: string } = {
      'lun': 'Lundi',
      'mar': 'Mardi',
      'mer': 'Mercredi',
      'jeu': 'Jeudi',
      'ven': 'Vendredi',
      'sam': 'Samedi',
      'dim': 'Dimanche',
    };

    // Tenter de parser différents formats
    // Format 1: "Lundi: 9h-12h, 14h-18h"
    // Format 2: "Lun-Ven: 9h-18h" -> Doit être étendu en jours séparés
    // Format 3: "9h-18h" (tous les jours)

    const lines = horairesString.split(/[\n;]/);

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Chercher le pattern "Jour: horaires"
      const match = trimmedLine.match(/^([^:]+):\s*(.+)$/);

      if (match) {
        const jourPart = match[1].trim();
        const horairePart = match[2].trim();

        // Gérer les plages de jours (Lun-Ven, Lundi-Vendredi, etc.)
        if (jourPart.includes('-')) {
          const [debut, fin] = jourPart.split('-').map(j => j.trim().toLowerCase());

          // Trouver les indices de début et fin
          let indexDebut = -1;
          let indexFin = -1;

          // Chercher dans les jours complets
          for (let i = 0; i < joursComplets.length; i++) {
            if (joursComplets[i].toLowerCase() === debut || joursAbrev[debut] === joursComplets[i]) {
              indexDebut = i;
            }
            if (joursComplets[i].toLowerCase() === fin || joursAbrev[fin] === joursComplets[i]) {
              indexFin = i;
            }
          }

          // Ajouter tous les jours de la plage
          if (indexDebut !== -1 && indexFin !== -1) {
            for (let i = indexDebut; i <= indexFin; i++) {
              horairesParsed.push({
                jour: joursComplets[i],
                horaires: horairePart,
              });
            }
          } else {
            // Si on ne peut pas parser, garder tel quel
            horairesParsed.push({
              jour: jourPart,
              horaires: horairePart,
            });
          }
        } else {
          // Jour unique
          // Normaliser le nom du jour si c'est une abréviation
          const jourNormalise = joursAbrev[jourPart.toLowerCase()] || jourPart;

          horairesParsed.push({
            jour: jourNormalise,
            horaires: horairePart,
          });
        }
      } else {
        // Si pas de format reconnu, ajouter tel quel
        horairesParsed.push({
          jour: '',
          horaires: trimmedLine,
        });
      }
    }

    return horairesParsed.length > 0 ? horairesParsed : [{ jour: '', horaires: horairesString }];
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!entreprise) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Entreprise introuvable</Text>
      </View>
    );
  }

  // Formater la commission
  const commissionText =
    entreprise.type_commission === 'montant_fixe'
      ? `${entreprise.valeur_commission}€`
      : `${entreprise.valeur_commission}%`;

  // Photos pour la galerie (ou placeholder)
  const galleryImages =
    photos.length > 0
      ? photos.map((p) => getPublicImageUrl(p.photo_url))
      : ['https://via.placeholder.com/400x250?text=Pas+de+photo'];

  // Animation du header sticky avec fondu plus doux
  const headerOpacity = scrollY.interpolate({
    inputRange: [100, 180],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [85, 180],
    outputRange: [-30, 0],
    extrapolate: 'clamp',
  });

  // Composant des tabs scrollables
  const renderTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tabsContainer}
      contentContainerStyle={styles.tabsContent}
    >
      {availableSections.map((section) => (
        <TouchableOpacity
          key={section.id}
          style={[
            styles.tab,
            activeSection === section.id && styles.tabActive,
          ]}
          onPress={() => scrollToSection(section.id)}
        >
          <Text
            style={[
              styles.tabText,
              activeSection === section.id && styles.tabTextActive,
            ]}
          >
            {section.label}
          </Text>
          {activeSection === section.id && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header fixe avec boutons retour et favori */}
      <SafeAreaView style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => setIsFavorite(!isFavorite)}
        >
          <Feather
            name="heart"
            size={24}
            color={isFavorite ? Colors.error : Colors.primary}
            fill={isFavorite ? Colors.error : 'none'}
          />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Header sticky avec tabs */}
      {showStickyHeader && (
        <Animated.View
          style={[
            styles.stickyHeader,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <SafeAreaView>
            <View style={styles.stickyHeaderContent}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.stickyBackButton}
              >
                <Feather name="arrow-left" size={24} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.stickyHeaderTitle} numberOfLines={1}>
                {entreprise.nom_commercial}
              </Text>
              <TouchableOpacity
                style={styles.stickyFavoriteButton}
                onPress={() => setIsFavorite(!isFavorite)}
              >
                <Feather
                  name="heart"
                  size={24}
                  color={isFavorite ? Colors.error : Colors.primary}
                  fill={isFavorite ? Colors.error : 'none'}
                />
              </TouchableOpacity>
            </View>
            {renderTabs()}
          </SafeAreaView>
        </Animated.View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Galerie photos */}
        <View
          ref={photosRef}
          style={styles.galleryContainer}
          onLayout={(event) => handleSectionLayout('photos', event)}
        >
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / width
              );
              setCurrentPhotoIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {galleryImages.map((imageUrl, index) => (
              <Image
                key={index}
                source={{ uri: imageUrl }}
                style={styles.galleryImage}
                resizeMode="cover"
                onError={() => {
                  if (photos[index]?.photo_url) {
                    handleImageError(photos[index].photo_url);
                  }
                }}
                onLoad={() => {
                  console.log('Image chargée avec succès:', imageUrl);
                }}
              />
            ))}
          </ScrollView>

          {/* Indicateurs pagination */}
          {galleryImages.length > 1 && (
            <View style={styles.dotsContainer}>
              {galleryImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentPhotoIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Logo superposé */}
          {entreprise.logo_url && (
            <Image
              source={{ uri: entreprise.logo_url }}
              style={styles.logoOverlay}
            />
          )}
        </View>

        {/* Contenu */}
        <View style={styles.content}>
          {/* En-tête entreprise */}
          <View style={styles.mainInfo}>
            <Text style={styles.nom}>{entreprise.nom_commercial}</Text>
          </View>

          {/* Rétribution */}
          <View style={styles.section}>
            <Text style={styles.retributionTitle}>
              Rétribution pour l'association
            </Text>
            <Text style={styles.retributionAmount}>
              {commissionText} par commande
            </Text>
          </View>

          {/* Description */}
          <View
            ref={descriptionRef}
            style={entreprise.description ? styles.section : styles.hiddenSection}
            onLayout={(event) => handleSectionLayout('description', event)}
          >
            {entreprise.description && (
              <>
                <Text style={styles.sectionTitle}>📝 Description</Text>
                <Text style={styles.descriptionText}>
                  {entreprise.description}
                </Text>
              </>
            )}
          </View>

          {/* Horaires */}
          <View
            ref={horairesRef}
            style={entreprise.horaires ? styles.section : styles.hiddenSection}
            onLayout={(event) => handleSectionLayout('horaires', event)}
          >
            {entreprise.horaires && (
              <>
                <Text style={styles.sectionTitle}>🕐 Horaires</Text>
                {parseHoraires(entreprise.horaires).map((item, index) => (
                  <View key={index} style={styles.horaireRow}>
                    {item.jour && (
                      <Text style={styles.horaireJour}>{item.jour}</Text>
                    )}
                    <Text style={styles.horaireText}>{item.horaires}</Text>
                  </View>
                ))}
              </>
            )}
          </View>

          {/* Adresse */}
          <View
            ref={adresseRef}
            style={styles.section}
            onLayout={(event) => handleSectionLayout('adresse', event)}
          >
            <Text style={styles.sectionTitle}>📍 Adresse</Text>
            <Text style={styles.infoText}>
              {entreprise.adresse}
              {'\n'}
              {entreprise.code_postal} {entreprise.ville}
            </Text>

            {/* Carte OpenStreetMap */}
            {Platform.OS === 'web' ? (
              <View style={styles.webMapContainer}>
                <View
                  style={styles.webMapWrapper}
                  // @ts-ignore - dangerouslySetInnerHTML est uniquement pour le web
                  dangerouslySetInnerHTML={{
                    __html: `
                      <iframe
                        width="100%"
                        height="100%"
                        frameborder="0"
                        scrolling="no"
                        marginheight="0"
                        marginwidth="0"
                        style="border-radius: 8px;"
                        src="https://www.openstreetmap.org/export/embed.html?bbox=&layer=mapnik"
                        title="Carte de localisation"
                      ></iframe>
                      <script>
                        // Geocoder l'adresse pour centrer la carte
                        const address = "${entreprise.adresse}, ${entreprise.code_postal} ${entreprise.ville}";
                        fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(address))
                          .then(response => response.json())
                          .then(data => {
                            if (data.length > 0) {
                              const lat = parseFloat(data[0].lat);
                              const lon = parseFloat(data[0].lon);
                              const bbox = data[0].boundingbox;
                              const iframe = document.querySelector('iframe');
                              if (iframe && bbox) {
                                const bboxStr = bbox[2] + ',' + bbox[0] + ',' + bbox[3] + ',' + bbox[1];
                                iframe.src = 'https://www.openstreetmap.org/export/embed.html?bbox=' + bboxStr + '&layer=mapnik&marker=' + lat + ',' + lon;
                              }
                            }
                          });
                      </script>
                    `,
                  }}
                />
              </View>
            ) : (
              <View style={styles.mapContainer}>
                <WebView
                  style={styles.mapWebView}
                  source={{
                    html: `
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                        <style>
                          body { margin: 0; padding: 0; }
                          #map { width: 100%; height: 100vh; }
                        </style>
                      </head>
                      <body>
                        <div id="map"></div>
                        <script>
                          const address = "${entreprise.adresse}, ${entreprise.code_postal} ${entreprise.ville}";

                          // Geocoding avec Nominatim
                          fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(address))
                            .then(response => response.json())
                            .then(data => {
                              if (data.length > 0) {
                                const lat = parseFloat(data[0].lat);
                                const lon = parseFloat(data[0].lon);

                                const map = L.map('map').setView([lat, lon], 15);

                                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                                  attribution: '© OpenStreetMap contributors'
                                }).addTo(map);

                                L.marker([lat, lon]).addTo(map)
                                  .bindPopup('${entreprise.nom_commercial}')
                                  .openPopup();
                              }
                            });
                        </script>
                      </body>
                      </html>
                    `,
                  }}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                  showsHorizontalScrollIndicator={false}
                />
                <TouchableOpacity
                  style={styles.mapExpandButton}
                  onPress={() => setMapModalVisible(true)}
                >
                  <Feather name="maximize-2" size={18} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.mapButton} onPress={handleMaps}>
              <Feather name="map" size={18} color={Colors.primary} />
              <Text style={styles.mapButtonText}>Voir sur Maps</Text>
            </TouchableOpacity>
          </View>

          {/* Contact */}
          <View
            ref={contactRef}
            style={(entreprise.telephone || entreprise.email || entreprise.site_web) ? styles.section : styles.hiddenSection}
            onLayout={(event) => handleSectionLayout('contact', event)}
          >
            {(entreprise.telephone || entreprise.email || entreprise.site_web) && (
              <>
                <Text style={styles.sectionTitle}>📞 Contact</Text>

                {entreprise.telephone && (
                  <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
                    <Feather name="phone" size={18} color={Colors.primary} />
                    <Text style={styles.contactText}>{entreprise.telephone}</Text>
                  </TouchableOpacity>
                )}

                {entreprise.email && (
                  <TouchableOpacity
                    style={styles.contactRow}
                    onPress={handleEmail}
                  >
                    <Feather name="mail" size={18} color={Colors.primary} />
                    <Text style={styles.contactText}>{entreprise.email}</Text>
                  </TouchableOpacity>
                )}

                {entreprise.site_web && (
                  <TouchableOpacity
                    style={styles.contactRow}
                    onPress={handleWebsite}
                  >
                    <Feather name="globe" size={18} color={Colors.primary} />
                    <Text style={styles.contactText}>{entreprise.site_web}</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* Espace pour le CTA fixe */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* CTA fixe en bas */}
      <SafeAreaView style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleCreateRecommandation}
        >
          <Text style={styles.ctaText}>Créer un deal</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Modal carte agrandie */}
      <Modal
        visible={mapModalVisible}
        animationType="slide"
        onRequestClose={() => setMapModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Localisation</Text>
            <TouchableOpacity onPress={() => setMapModalVisible(false)}>
              <Feather name="x" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <WebView
            style={styles.modalMap}
            source={{
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                  <style>
                    body { margin: 0; padding: 0; }
                    #map { width: 100%; height: 100vh; }
                  </style>
                </head>
                <body>
                  <div id="map"></div>
                  <script>
                    const address = "${entreprise.adresse}, ${entreprise.code_postal} ${entreprise.ville}";

                    fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(address))
                      .then(response => response.json())
                      .then(data => {
                        if (data.length > 0) {
                          const lat = parseFloat(data[0].lat);
                          const lon = parseFloat(data[0].lon);

                          const map = L.map('map').setView([lat, lon], 15);

                          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '© OpenStreetMap contributors'
                          }).addTo(map);

                          L.marker([lat, lon]).addTo(map)
                            .bindPopup('${entreprise.nom_commercial}')
                            .openPopup();
                        }
                      });
                  </script>
                </body>
                </html>
              `,
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
  },
  headerContainer: {
    position: 'absolute',
    top: 20,
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  galleryContainer: {
    width: '100%',
    height: 350,
    backgroundColor: Colors.backgroundLight,
  },
  galleryImage: {
    width: width,
    height: 350,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoOverlay: {
    position: 'absolute',
    bottom: -30,
    right: Spacing.xl,
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 3,
    borderColor: Colors.surface,
    zIndex: 20,
  },
  content: {
    paddingTop: 0,
  },
  mainInfo: {
    padding: Spacing.xl,
    paddingTop: Spacing.xl,
    marginBottom: Spacing.md,
    zIndex: 1,
  },
  nom: {
    fontSize: Typography.size.xxxl,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  retributionTitle: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  retributionAmount: {
    fontSize: Typography.size.xxl,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: '700',
    color: Colors.primary,
  },
  section: {
    padding: Spacing.xl,
    //marginBottom: Spacing.md,
  },
  hiddenSection: {
    height: 0,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  descriptionText: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  infoText: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  horaireRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  horaireJour: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.body,
    fontWeight: '600',
    color: Colors.textPrimary,
    width: 100,
    marginRight: Spacing.md,
  },
  horaireText: {
    flex: 1,
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  mapContainer: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    position: 'relative',
  },
  mapWebView: {
    flex: 1,
  },
  webMapContainer: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  webMapWrapper: {
    width: '100%',
    height: '100%',
  },
  mapExpandButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.surface,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...getShadow('small'),
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  mapButtonText: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.body,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  contactText: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.body,
    color: Colors.primary,
    marginLeft: Spacing.md,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  ctaButton: {
    ...CommonStyles.buttonPrimary,
    ...getShadow('medium'),
  },
  ctaText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.body,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.size.xxl,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalMap: {
    flex: 1,
  },
  // Styles pour le header sticky
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: Colors.surface,
    ...getShadow('small'),
  },
  stickyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    height: 56,
  },
  stickyBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyFavoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyHeaderTitle: {
    flex: 1,
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.heading,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'left',
    marginLeft: Spacing.sm,
    marginRight: Spacing.md,
  },
  // Styles pour les tabs
  tabsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tabsContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  tab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    position: 'relative',
  },
  tabActive: {
    // Le style actif est géré par l'indicateur
  },
  tabText: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.body,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: Spacing.lg,
    right: Spacing.lg,
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
});