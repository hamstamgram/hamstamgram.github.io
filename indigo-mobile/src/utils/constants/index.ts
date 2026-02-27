/**
 * Application constants
 */

// Cache times in milliseconds
export const CACHE_TIMES = {
  POSITIONS: 1 * 60 * 1000, // 1 minute
  TRANSACTIONS: 2 * 60 * 1000, // 2 minutes
  WITHDRAWALS: 30 * 1000, // 30 seconds
  PROFILE: 5 * 60 * 1000, // 5 minutes
  FUNDS: 5 * 60 * 1000, // 5 minutes
} as const;

// Query keys for TanStack Query
export const QUERY_KEYS = {
  POSITIONS: 'positions',
  PORTFOLIO_SUMMARY: 'portfolio-summary',
  TRANSACTIONS: 'transactions',
  TRANSACTION_DETAIL: 'transaction-detail',
  WITHDRAWALS: 'withdrawals',
  WITHDRAWAL_DETAIL: 'withdrawal-detail',
  AVAILABLE_BALANCE: 'available-balance',
  PROFILE: 'profile',
  FUNDS: 'funds',
  NOTIFICATIONS: 'notifications',
} as const;

// Deep link schemes
export const DEEP_LINK_SCHEME = 'indigo';
export const DEEP_LINK_PATHS = {
  TRANSACTIONS: 'transactions',
  WITHDRAWALS: 'withdrawals',
  SETTINGS: 'settings',
} as const;

// API endpoints (relative to Supabase URL)
export const API_ENDPOINTS = {
  RPC: {
    GET_AVAILABLE_BALANCE: 'get_available_balance',
    CREATE_WITHDRAWAL_REQUEST: 'create_withdrawal_request',
    CANCEL_WITHDRAWAL_REQUEST: 'cancel_withdrawal_request',
  },
} as const;

// Secure storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  PRIVACY_MODE: 'privacy_mode',
  PUSH_TOKEN: 'push_token',
  NOTIFICATION_PREFS: 'notification_prefs',
} as const;

// Animation durations in ms
export const ANIMATION = {
  FAST: 150,
  NORMAL: 250,
  SLOW: 400,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  TRANSACTIONS_PAGE_SIZE: 25,
} as const;
