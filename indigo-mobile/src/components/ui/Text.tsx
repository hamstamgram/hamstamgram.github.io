/**
 * Text Component
 * Styled text with typography presets
 */

import React from 'react';
import { Text as RNText, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../app/providers/ThemeProvider';
import { typeScale, fonts } from '../../theme/typography';

type TextVariant = keyof typeof typeScale;

interface TextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  color?: 'primary' | 'secondary' | 'muted' | 'success' | 'destructive' | 'warning';
  style?: TextStyle;
  numberOfLines?: number;
  selectable?: boolean;
}

export function Text({
  children,
  variant = 'body',
  color,
  style,
  numberOfLines,
  selectable = false,
}: TextProps) {
  const { theme } = useTheme();

  const variantStyle = typeScale[variant];

  const getColor = () => {
    switch (color) {
      case 'primary':
        return theme.primary;
      case 'secondary':
        return theme.textSecondary;
      case 'muted':
        return theme.textMuted;
      case 'success':
        return theme.success;
      case 'destructive':
        return theme.destructive;
      case 'warning':
        return theme.warning;
      default:
        return theme.text;
    }
  };

  return (
    <RNText
      style={[
        styles.base,
        variantStyle as TextStyle,
        { color: getColor() },
        style,
      ]}
      numberOfLines={numberOfLines}
      selectable={selectable}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    // Base text styles
  },
});
