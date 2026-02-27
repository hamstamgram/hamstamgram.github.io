/**
 * Profile types for Indigo Yield Mobile
 * Mirrors web application types
 */

export type UserRole = 'investor' | 'admin' | 'super_admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  notification_preferences: NotificationPreferences;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  email_transactions: boolean;
  email_withdrawals: boolean;
  email_yield: boolean;
  email_security: boolean;
  push_transactions: boolean;
  push_withdrawals: boolean;
  push_yield: boolean;
  push_security: boolean;
}

export const defaultNotificationPreferences: NotificationPreferences = {
  email_transactions: true,
  email_withdrawals: true,
  email_yield: true,
  email_security: true,
  push_transactions: true,
  push_withdrawals: true,
  push_yield: true,
  push_security: true,
};
