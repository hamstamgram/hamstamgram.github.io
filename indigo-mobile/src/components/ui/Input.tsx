/**
 * Input Component
 * Text input with styling
 */

import React, { useState } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Text } from './Text';
import { useTheme } from '../../app/providers/ThemeProvider';
import { spacing, borderRadius, fonts } from '../../theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helper?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export function Input({
  label,
  error,
  helper,
  containerStyle,
  leftIcon,
  rightIcon,
  onRightIconPress,
  ...props
}: InputProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = () => {
    if (error) return theme.destructive;
    if (isFocused) return theme.primary;
    return theme.border;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text variant="label" color="secondary" style={styles.label}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.background,
            borderColor: getBorderColor(),
          },
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          {...props}
          style={[
            styles.input,
            {
              color: theme.text,
              fontFamily: fonts.body,
            },
            leftIcon ? { paddingLeft: spacing[1] } : null,
            rightIcon ? { paddingRight: spacing[1] } : null,
          ]}
          placeholderTextColor={theme.textMuted}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
        />
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.iconRight}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {(error || helper) && (
        <Text
          variant="caption"
          color={error ? 'destructive' : 'muted'}
          style={styles.helper}
        >
          {error || helper}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  label: {
    marginBottom: spacing[1.5],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: spacing[3],
  },
  iconLeft: {
    marginRight: spacing[2],
  },
  iconRight: {
    marginLeft: spacing[2],
  },
  helper: {
    marginTop: spacing[1],
  },
});
