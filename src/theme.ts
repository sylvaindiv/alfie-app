// 🎨 THÈME DE L'APPLICATION ALFIE
// Modifier ce fichier pour changer l'apparence globale

export const Colors = {
  // Couleurs principales
  primary: '#FF5B29',
  primaryDark: '#E64A1F',
  primaryLight: '#FF7A52',

  // Couleurs de fond
  background: '#F9F9F7',
  backgroundLight: '#FEFEFE',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Texte
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textDisabled: '#BDBDBD',
  textOnPrimary: '#FFFFFF',

  // Bordures
  border: '#EFEFED',
  borderLight: '#F5F5F3',

  // Statuts leads
  statusPending: '#FF9800', // Orange
  statusInProgress: '#2196F3', // Bleu
  statusValidated: '#4CAF50', // Vert
  statusRejected: '#F44336', // Rouge

  // Commissions
  commissionFixed: '#4CAF50', // Vert
  commissionPercentage: '#FF9800', // Orange

  // Autres
  error: '#F44336',
  success: '#4CAF50',
  warning: '#FF9800',
  info: '#2196F3',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  round: 999, // Pour les boutons/chips arrondis
};

export const Typography = {
  // Familles de police
  fontFamily: {
    heading: 'Montserrat',
    body: 'Nunito',
  },

  // Tailles de police
  size: {
    xs: 12,
    sm: 13,
    base: 14,
    md: 15,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    huge: 32,
  },

  // Poids
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
};

export const Layout = {
  // Hauteurs fixes
  tabBarHeight: 60,
  headerHeight: 56,
  buttonHeight: 52,
  inputHeight: 52,
  chipHeight: 40,

  // Largeurs
  screenPadding: Spacing.lg,
  cardPadding: Spacing.xl,
};

// 🎨 STYLES RÉUTILISABLES
export const CommonStyles = {
  // Cartes
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.small,
  },

  // Chips/Filtres
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.round,
    height: Layout.chipHeight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  // Boutons primaires
  buttonPrimary: {
    height: Layout.buttonHeight,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: Spacing.xxl,
  },

  // Boutons secondaires
  buttonSecondary: {
    height: Layout.buttonHeight,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Badges
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },

  // Sections
  section: {
    marginBottom: Spacing.xxl,
  },

  // Headers
  screenHeader: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  // Titres
  heading: {
    fontFamily: Typography.fontFamily.heading,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },

  // Texte body
  bodyText: {
    fontFamily: Typography.fontFamily.body,
    fontWeight: Typography.weight.regular,
    color: Colors.textPrimary,
  },
};