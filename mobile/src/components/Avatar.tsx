import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, ImageStyle, StyleProp } from 'react-native';
import { colors, typography } from '../utils/theme';

interface AvatarProps {
  name?: string;
  uri?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: StyleProp<ViewStyle | ImageStyle>;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getColorFromName = (name: string) => {
  const avatarColors = [
    '#4F46E5', '#06B6D4', '#10B981', '#F59E0B',
    '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return avatarColors[index % avatarColors.length];
};

export default function Avatar({ name, uri, size = 'md', style }: AvatarProps) {
  const sizes = { sm: 32, md: 48, lg: 64, xl: 96 };
  const fontSizes = { sm: 12, md: 16, lg: 24, xl: 36 };
  const avatarSize = sizes[size];
  const fontSize = fontSizes[size];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.avatar,
          { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
          style as StyleProp<ImageStyle>,
        ]}
      />
    );
  }

  const backgroundColor = name ? getColorFromName(name) : colors.surfaceSecondary;

  return (
    <View
      style={[
        styles.avatar,
        styles.initials,
        { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, backgroundColor },
        style,
      ]}
    >
      <Text style={[styles.initialsText, { fontSize }]}>{getInitials(name || '?')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { overflow: 'hidden' },
  initials: { justifyContent: 'center', alignItems: 'center' },
  initialsText: { color: colors.textInverse, fontWeight: '600' },
});
