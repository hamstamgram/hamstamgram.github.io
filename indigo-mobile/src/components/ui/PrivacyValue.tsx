/**
 * Privacy Value Component
 * Displays value or hidden placeholder based on privacy mode
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, TextStyle } from 'react-native';
import { Text } from './Text';
import { usePrivacyStore } from '../../stores/privacyStore';
import { typeScale } from '../../theme/typography';

type TextVariant = keyof typeof typeScale;

interface PrivacyValueProps {
  value: string;
  variant?: TextVariant;
  color?: 'primary' | 'secondary' | 'muted' | 'success' | 'destructive';
  style?: TextStyle;
  hiddenPlaceholder?: string;
  onReveal?: () => void;
}

export function PrivacyValue({
  value,
  variant = 'value',
  color,
  style,
  hiddenPlaceholder = '••••••',
  onReveal,
}: PrivacyValueProps) {
  const { isPrivacyMode, togglePrivacyMode } = usePrivacyStore();

  const handlePress = () => {
    if (isPrivacyMode) {
      togglePrivacyMode();
      onReveal?.();
    }
  };

  if (isPrivacyMode) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <Text variant={variant} color="muted" style={style}>
          {hiddenPlaceholder}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <Text variant={variant} color={color} style={style}>
      {value}
    </Text>
  );
}

/**
 * Large privacy value for dashboard hero numbers
 */
interface LargePrivacyValueProps {
  value: string;
  style?: TextStyle;
}

export function LargePrivacyValue({ value, style }: LargePrivacyValueProps) {
  return (
    <PrivacyValue
      value={value}
      variant="valueLarge"
      style={style}
      hiddenPlaceholder="••••••••"
    />
  );
}
