/**
 * Button Component
 * Primary button with variants
 */

import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Text } from './Text';
import { useTheme } from '../../app/providers/ThemeProvider';
import { spacing, borderRadius } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const { theme } = useTheme();

  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size styles
    switch (size) {
      case 'sm':
        baseStyle.paddingVertical = spacing[2];
        baseStyle.paddingHorizontal = spacing[3];
        break;
      case 'lg':
        baseStyle.paddingVertical = spacing[4];
        baseStyle.paddingHorizontal = spacing[6];
        break;
      default: // md
        baseStyle.paddingVertical = spacing[3];
        baseStyle.paddingHorizontal = spacing[4];
    }

    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyle.backgroundColor = theme.primary;
        break;
      case 'secondary':
        baseStyle.backgroundColor = theme.surface;
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = theme.border;
        break;
      case 'ghost':
        baseStyle.backgroundColor = 'transparent';
        break;
      case 'destructive':
        baseStyle.backgroundColor = theme.destructive;
        break;
    }

    // Disabled state
    if (disabled || loading) {
      baseStyle.opacity = 0.6;
    }

    // Full width
    if (fullWidth) {
      baseStyle.width = '100%';
    }

    return baseStyle;
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'destructive':
        return '#FFFFFF';
      case 'secondary':
        return theme.text;
      case 'outline':
      case 'ghost':
        return theme.primary;
      default:
        return theme.text;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[getButtonStyles(), style]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <Text variant="button" style={{ color: getTextColor() }}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}
