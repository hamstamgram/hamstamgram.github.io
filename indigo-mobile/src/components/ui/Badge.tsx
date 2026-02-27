/**
 * Badge Component
 * Small status indicators
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../../app/providers/ThemeProvider';
import { spacing, borderRadius } from '../../theme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ children, variant = 'default', style }: BadgeProps) {
  const { theme } = useTheme();

  const getStyles = (): { container: ViewStyle; textColor: string } => {
    switch (variant) {
      case 'success':
        return {
          container: { backgroundColor: `${theme.success}20` },
          textColor: theme.success,
        };
      case 'warning':
        return {
          container: { backgroundColor: `${theme.warning}20` },
          textColor: theme.warning,
        };
      case 'destructive':
        return {
          container: { backgroundColor: `${theme.destructive}20` },
          textColor: theme.destructive,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: theme.border,
          },
          textColor: theme.textSecondary,
        };
      default:
        return {
          container: { backgroundColor: theme.surface },
          textColor: theme.textSecondary,
        };
    }
  };

  const { container, textColor } = getStyles();

  return (
    <View style={[styles.badge, container, style]}>
      <Text variant="caption" style={{ color: textColor, fontWeight: '600' }}>
        {children}
      </Text>
    </View>
  );
}

/**
 * Yield Badge - special green badge for yield indicators
 */
export function YieldBadge({ value }: { value: string }) {
  return <Badge variant="success">{value}</Badge>;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
});
