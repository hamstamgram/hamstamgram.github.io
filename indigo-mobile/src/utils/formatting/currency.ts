/**
 * Currency and financial formatting utilities
 * Uses Decimal.js for precision - NEVER use native JS numbers for financial calculations
 */
import Decimal from 'decimal.js';
import { getAssetPrecision } from '@/types/domains/fund';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

/**
 * Parse a string amount to Decimal
 * Always use this instead of parseFloat/Number
 */
export function parseAmount(value: string | number | null | undefined): Decimal {
  if (value === null || value === undefined || value === '') {
    return new Decimal(0);
  }
  try {
    return new Decimal(value);
  } catch {
    return new Decimal(0);
  }
}

/**
 * Format a decimal amount for display with proper precision
 */
export function formatAmount(
  value: string | number | Decimal | null | undefined,
  symbol?: string,
  options: {
    showSign?: boolean;
    compact?: boolean;
    minimumDecimals?: number;
  } = {}
): string {
  const decimal = value instanceof Decimal ? value : parseAmount(value as string);
  const precision = symbol ? getAssetPrecision(symbol) : 2;
  const minDecimals = options.minimumDecimals ?? (precision === 8 ? 4 : 2);

  let formatted: string;

  if (options.compact && decimal.abs().gte(1000000)) {
    // Format as millions
    const millions = decimal.dividedBy(1000000);
    formatted = millions.toFixed(2) + 'M';
  } else if (options.compact && decimal.abs().gte(1000)) {
    // Format as thousands
    const thousands = decimal.dividedBy(1000);
    formatted = thousands.toFixed(2) + 'K';
  } else {
    // Regular formatting
    formatted = decimal.toFixed(precision);
    
    // Trim trailing zeros but keep minimum decimals
    const parts = formatted.split('.');
    if (parts[1]) {
      let decimals = parts[1].replace(/0+$/, '');
      if (decimals.length < minDecimals) {
        decimals = decimals.padEnd(minDecimals, '0');
      }
      formatted = decimals.length > 0 ? `${parts[0]}.${decimals}` : parts[0];
    }
  }

  // Add sign prefix
  if (options.showSign && decimal.gt(0)) {
    formatted = '+' + formatted;
  }

  return formatted;
}

/**
 * Format with currency symbol
 */
export function formatCurrency(
  value: string | number | Decimal | null | undefined,
  symbol: string,
  options: {
    showSign?: boolean;
    compact?: boolean;
    showSymbol?: boolean;
  } = {}
): string {
  const formatted = formatAmount(value, symbol, options);
  
  if (options.showSymbol !== false) {
    return `${formatted} ${symbol}`;
  }
  
  return formatted;
}

/**
 * Format USD value (always 2 decimals)
 */
export function formatUSD(
  value: string | number | Decimal | null | undefined,
  options: { showSign?: boolean; compact?: boolean } = {}
): string {
  const decimal = value instanceof Decimal ? value : parseAmount(value as string);
  
  let formatted: string;
  
  if (options.compact && decimal.abs().gte(1000000)) {
    formatted = '$' + decimal.dividedBy(1000000).toFixed(2) + 'M';
  } else if (options.compact && decimal.abs().gte(1000)) {
    formatted = '$' + decimal.dividedBy(1000).toFixed(2) + 'K';
  } else {
    // Add thousand separators
    const fixed = decimal.toFixed(2);
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    formatted = '$' + parts.join('.');
  }

  if (options.showSign && decimal.gt(0)) {
    formatted = '+' + formatted;
  }

  return formatted;
}

/**
 * Format percentage value
 */
export function formatPercentage(
  value: string | number | Decimal | null | undefined,
  options: { showSign?: boolean; decimals?: number } = {}
): string {
  const decimal = value instanceof Decimal ? value : parseAmount(value as string);
  const decimals = options.decimals ?? 2;
  
  let formatted = decimal.toFixed(decimals) + '%';
  
  if (options.showSign && decimal.gt(0)) {
    formatted = '+' + formatted;
  }
  
  return formatted;
}

/**
 * Check if amount is positive
 */
export function isPositive(value: string | number | Decimal | null | undefined): boolean {
  const decimal = value instanceof Decimal ? value : parseAmount(value as string);
  return decimal.gt(0);
}

/**
 * Check if amount is negative
 */
export function isNegative(value: string | number | Decimal | null | undefined): boolean {
  const decimal = value instanceof Decimal ? value : parseAmount(value as string);
  return decimal.lt(0);
}

/**
 * Add two amounts
 */
export function addAmounts(
  a: string | number | Decimal | null | undefined,
  b: string | number | Decimal | null | undefined
): Decimal {
  const decimalA = a instanceof Decimal ? a : parseAmount(a as string);
  const decimalB = b instanceof Decimal ? b : parseAmount(b as string);
  return decimalA.plus(decimalB);
}

/**
 * Subtract amounts
 */
export function subtractAmounts(
  a: string | number | Decimal | null | undefined,
  b: string | number | Decimal | null | undefined
): Decimal {
  const decimalA = a instanceof Decimal ? a : parseAmount(a as string);
  const decimalB = b instanceof Decimal ? b : parseAmount(b as string);
  return decimalA.minus(decimalB);
}
