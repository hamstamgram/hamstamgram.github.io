/**
 * Card Component
 * Container with surface styling
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '../../app/providers/ThemeProvider';
import { spacing, borderRadius, shadows } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: keyof typeof spacing | 'none';
  shadow?: boolean;
}

export function Card({
  children,
  style,
  onPress,
  padding = 4,
  shadow = true,
}: CardProps) {
  const { theme } = useTheme();

  const cardStyles: ViewStyle = {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    padding: padding === 'none' ? 0 : spacing[padding],
    ...(shadow ? shadows.sm : {}),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[cardStyles, style]}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyles, style]}>{children}</View>;
}

/**
 * Card Header component
 */
interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardHeader({ children, style }: CardHeaderProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.border,
          paddingBottom: spacing[3],
          marginBottom: spacing[3],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * Card Content component
 */
interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardContent({ children, style }: CardContentProps) {
  return <View style={style}>{children}</View>;
}
