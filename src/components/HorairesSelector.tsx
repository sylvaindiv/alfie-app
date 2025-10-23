import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../theme';

interface DaySchedule {
  day: string;
  dayShort: string;
  closed: boolean;
  morning: { start: string; end: string };
  afternoon: { start: string; end: string };
}

interface HorairesSelectorProps {
  value: string | null;
  onChange: (value: string) => void;
}

const DAYS: Array<{ day: string; dayShort: string }> = [
  { day: 'Lundi', dayShort: 'Lun' },
  { day: 'Mardi', dayShort: 'Mar' },
  { day: 'Mercredi', dayShort: 'Mer' },
  { day: 'Jeudi', dayShort: 'Jeu' },
  { day: 'Vendredi', dayShort: 'Ven' },
  { day: 'Samedi', dayShort: 'Sam' },
  { day: 'Dimanche', dayShort: 'Dim' },
];

const TIME_OPTIONS = [
  '00:00',
  '06:00',
  '07:00',
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
  '21:30',
  '22:00',
  '22:30',
  '23:00',
  '23:30',
];

export default function HorairesSelector({
  value,
  onChange,
}: HorairesSelectorProps) {
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Initialiser les horaires depuis la valeur ou avec des valeurs par défaut
  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        setSchedules(parsed);
      } catch (err) {
        initializeDefaultSchedules();
      }
    } else {
      initializeDefaultSchedules();
    }
  }, []);

  const initializeDefaultSchedules = () => {
    const defaultSchedules = DAYS.map(({ day, dayShort }) => ({
      day,
      dayShort,
      closed: day === 'Dimanche',
      morning: { start: '09:00', end: '12:00' },
      afternoon: { start: '14:00', end: '18:00' },
    }));
    setSchedules(defaultSchedules);
    onChange(JSON.stringify(defaultSchedules));
  };

  const toggleDay = (dayName: string) => {
    setExpandedDay(expandedDay === dayName ? null : dayName);
  };

  const toggleClosed = (dayName: string) => {
    const updated = schedules.map((s) =>
      s.day === dayName ? { ...s, closed: !s.closed } : s,
    );
    setSchedules(updated);
    onChange(JSON.stringify(updated));
  };

  const updateTime = (
    dayName: string,
    period: 'morning' | 'afternoon',
    type: 'start' | 'end',
    time: string,
  ) => {
    const updated = schedules.map((s) =>
      s.day === dayName
        ? { ...s, [period]: { ...s[period], [type]: time } }
        : s,
    );
    setSchedules(updated);
    onChange(JSON.stringify(updated));
  };

  const formatSchedulePreview = (schedule: DaySchedule): string => {
    if (schedule.closed) return 'Fermé';
    return `${schedule.morning.start}-${schedule.morning.end} / ${schedule.afternoon.start}-${schedule.afternoon.end}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Horaires d'ouverture</Text>
      {schedules.map((schedule) => (
        <View key={schedule.day} style={styles.dayContainer}>
          {/* Header du jour */}
          <TouchableOpacity
            style={styles.dayHeader}
            onPress={() => toggleDay(schedule.day)}
          >
            <View style={styles.dayHeaderLeft}>
              <Text style={styles.dayName}>{schedule.day}</Text>
              <Text style={styles.schedulePreview}>
                {formatSchedulePreview(schedule)}
              </Text>
            </View>
            <Feather
              name={expandedDay === schedule.day ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Détails du jour (expanded) */}
          {expandedDay === schedule.day && (
            <View style={styles.dayDetails}>
              {/* Bouton Fermé */}
              <TouchableOpacity
                style={styles.closedButton}
                onPress={() => toggleClosed(schedule.day)}
              >
                <View
                  style={[
                    styles.checkbox,
                    schedule.closed && styles.checkboxChecked,
                  ]}
                >
                  {schedule.closed && (
                    <Feather name="check" size={16} color={Colors.surface} />
                  )}
                </View>
                <Text style={styles.closedText}>Fermé ce jour</Text>
              </TouchableOpacity>

              {/* Horaires matin */}
              {!schedule.closed && (
                <>
                  <View style={styles.periodContainer}>
                    <Text style={styles.periodLabel}>Matin</Text>
                    <View style={styles.timeRow}>
                      <View style={styles.timePickerContainer}>
                        <Text style={styles.timeLabel}>Ouverture</Text>
                        <ScrollView
                          style={styles.timePicker}
                          showsVerticalScrollIndicator={false}
                          nestedScrollEnabled={true}
                        >
                          {TIME_OPTIONS.map((time) => (
                            <TouchableOpacity
                              key={time}
                              style={[
                                styles.timeOption,
                                schedule.morning.start === time &&
                                  styles.timeOptionSelected,
                              ]}
                              onPress={() =>
                                updateTime(schedule.day, 'morning', 'start', time)
                              }
                            >
                              <Text
                                style={[
                                  styles.timeOptionText,
                                  schedule.morning.start === time &&
                                    styles.timeOptionTextSelected,
                                ]}
                              >
                                {time}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>

                      <View style={styles.timePickerContainer}>
                        <Text style={styles.timeLabel}>Fermeture</Text>
                        <ScrollView
                          style={styles.timePicker}
                          showsVerticalScrollIndicator={false}
                          nestedScrollEnabled={true}
                        >
                          {TIME_OPTIONS.map((time) => (
                            <TouchableOpacity
                              key={time}
                              style={[
                                styles.timeOption,
                                schedule.morning.end === time &&
                                  styles.timeOptionSelected,
                              ]}
                              onPress={() =>
                                updateTime(schedule.day, 'morning', 'end', time)
                              }
                            >
                              <Text
                                style={[
                                  styles.timeOptionText,
                                  schedule.morning.end === time &&
                                    styles.timeOptionTextSelected,
                                ]}
                              >
                                {time}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                  </View>

                  {/* Horaires après-midi */}
                  <View style={styles.periodContainer}>
                    <Text style={styles.periodLabel}>Après-midi</Text>
                    <View style={styles.timeRow}>
                      <View style={styles.timePickerContainer}>
                        <Text style={styles.timeLabel}>Ouverture</Text>
                        <ScrollView
                          style={styles.timePicker}
                          showsVerticalScrollIndicator={false}
                          nestedScrollEnabled={true}
                        >
                          {TIME_OPTIONS.map((time) => (
                            <TouchableOpacity
                              key={time}
                              style={[
                                styles.timeOption,
                                schedule.afternoon.start === time &&
                                  styles.timeOptionSelected,
                              ]}
                              onPress={() =>
                                updateTime(
                                  schedule.day,
                                  'afternoon',
                                  'start',
                                  time,
                                )
                              }
                            >
                              <Text
                                style={[
                                  styles.timeOptionText,
                                  schedule.afternoon.start === time &&
                                    styles.timeOptionTextSelected,
                                ]}
                              >
                                {time}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>

                      <View style={styles.timePickerContainer}>
                        <Text style={styles.timeLabel}>Fermeture</Text>
                        <ScrollView
                          style={styles.timePicker}
                          showsVerticalScrollIndicator={false}
                          nestedScrollEnabled={true}
                        >
                          {TIME_OPTIONS.map((time) => (
                            <TouchableOpacity
                              key={time}
                              style={[
                                styles.timeOption,
                                schedule.afternoon.end === time &&
                                  styles.timeOptionSelected,
                              ]}
                              onPress={() =>
                                updateTime(schedule.day, 'afternoon', 'end', time)
                              }
                            >
                              <Text
                                style={[
                                  styles.timeOptionText,
                                  schedule.afternoon.end === time &&
                                    styles.timeOptionTextSelected,
                                ]}
                              >
                                {time}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </View>
          )}
        </View>
      ))}
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
    marginBottom: Spacing.md,
  },
  dayContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  dayHeaderLeft: {
    flex: 1,
  },
  dayName: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  schedulePreview: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  dayDetails: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.backgroundLight,
  },
  closedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  closedText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
  },
  periodContainer: {
    marginBottom: Spacing.md,
  },
  periodLabel: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  timePickerContainer: {
    flex: 1,
  },
  timeLabel: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  timePicker: {
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
  },
  timeOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  timeOptionSelected: {
    backgroundColor: Colors.primaryLight,
  },
  timeOptionText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  timeOptionTextSelected: {
    color: Colors.surface,
    fontWeight: Typography.weight.semiBold,
  },
});
