import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../utils/theme';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'primary';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export default function Badge({
  label,
  variant = 'default',
  size = 'md',
  style,
}: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], styles[`size_${size}`], style]}>
      <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`]]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  size_sm: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  size_md: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
  },
  default: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.borderLight,
  },
  primary: {
    backgroundColor: colors.primaryLight + '20',
    borderColor: colors.primaryLight + '30',
  },
  success: {
    backgroundColor: colors.successLight,
    borderColor: colors.success + '25',
  },
  warning: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning + '25',
  },
  error: {
    backgroundColor: colors.errorLight,
    borderColor: colors.error + '25',
  },
  text: {
    ...typography.caption,
  },
  text_default: {
    color: colors.textSecondary,
  },
  text_primary: {
    color: colors.primary,
  },
  text_success: {
    color: colors.success,
  },
  text_warning: {
    color: colors.warning,
  },
  text_error: {
    color: colors.error,
  },
  textSize_sm: {
    fontSize: 10,
  },
  textSize_md: {
    fontSize: 12,
  },
});
