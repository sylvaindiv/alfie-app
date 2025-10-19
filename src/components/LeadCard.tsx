import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../theme';

interface Lead {
  id: string;
  type_lead: 'auto_recommandation' | 'recommandation_tiers';
  statut: 'en_attente' | 'en_cours' | 'valide' | 'refuse';
  date_creation: string;
  montant_commission: number | null;
  entreprise: {
    nom_commercial: string;
    logo_url: string | null;
  };
}

interface LeadCardProps {
  lead: Lead;
  onPress: () => void;
}

// Couleurs des badges selon statut (utilise le thème)
const STATUS_COLORS = {
  en_attente: { bg: Colors.statusPending, text: 'En attente' },
  en_cours: { bg: Colors.statusInProgress, text: 'En cours' },
  valide: { bg: Colors.statusValidated, text: 'Validé' },
  refuse: { bg: Colors.statusRejected, text: 'Refusé' },
};

export default function LeadCard({ lead, onPress }: LeadCardProps) {
  const statusConfig = STATUS_COLORS[lead.statut];

  // Format date
  const date = new Date(lead.date_creation);
  const dateStr = date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Icône type de lead
  const typeIcon = lead.type_lead === 'auto_recommandation' ? '📸' : '📝';

  // Logo entreprise
  const logoSource = lead.entreprise.logo_url
    ? { uri: lead.entreprise.logo_url }
    : require('../../assets/icon.png');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.content}>
        {/* Logo entreprise */}
        <Image source={logoSource} style={styles.logo} />

        {/* Infos */}
        <View style={styles.infoContainer}>
          <View style={styles.topRow}>
            <Text style={styles.nom} numberOfLines={1}>
              {lead.entreprise.nom_commercial}
            </Text>
            {/* Icône type */}
            <Text style={styles.typeIcon}>{typeIcon}</Text>
          </View>

          {/* Date */}
          <Text style={styles.date}>{dateStr}</Text>

          {/* Badge statut */}
          <View style={[styles.badge, { backgroundColor: statusConfig.bg }]}>
            <Text style={styles.badgeText}>{statusConfig.text}</Text>
          </View>
        </View>

        {/* Commission (si validé) */}
        {lead.statut === 'valide' && lead.montant_commission && (
          <View style={styles.commissionContainer}>
            <Text style={styles.commissionText}>
              {lead.montant_commission}€
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: Spacing.md,
    backgroundColor: Colors.background,
  },
  infoContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  nom: {
    flex: 1,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    fontFamily: Typography.fontFamily.heading,
    color: Colors.textPrimary,
    marginRight: Spacing.md,
  },
  typeIcon: {
    fontSize: Typography.size.lg,
  },
  date: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    fontFamily: Typography.fontFamily.body,
  },
  commissionContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  commissionText: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    fontFamily: Typography.fontFamily.heading,
    color: Colors.success,
  },
});