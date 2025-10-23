import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius, Layout } from '../theme';

interface FormInputProps extends TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  required?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
}

export default function FormInput({
  label,
  value,
  onChangeText,
  error,
  required = false,
  multiline = false,
  numberOfLines = 1,
  ...props
}: FormInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          multiline && { height: numberOfLines * 24 + 28 },
          error && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={Colors.textDisabled}
        multiline={multiline}
        numberOfLines={numberOfLines}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
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
  required: {
    color: Colors.error,
  },
  input: {
    height: Layout.inputHeight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  inputMultiline: {
    paddingTop: Spacing.md,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.size.sm,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});
