import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../utils/theme';

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
  style?: ViewStyle;
}

export default function ProgressBar({
  progress,
  color = colors.primary,
  height = 8,
  showLabel = false,
  style,
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View style={style}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{Math.round(clampedProgress)}%</Text>
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            { width: `${clampedProgress}%`, backgroundColor: color, height },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.xs },
  label: { ...typography.caption, color: colors.textSecondary },
  track: { backgroundColor: colors.surfaceSecondary, borderRadius: borderRadius.full, overflow: 'hidden' },
  fill: { borderRadius: borderRadius.full },
});
