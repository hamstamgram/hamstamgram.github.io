/**
 * Transaction types for Indigo Yield Mobile
 * Mirrors web application types
 */
import Decimal from 'decimal.js';

export type TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'INTEREST'
  | 'YIELD'
  | 'FEE'
  | 'ADJUSTMENT';

export type TransactionStatus =
  | 'pending'
  | 'confirmed'
  | 'failed'
  | 'cancelled';

export interface Transaction {
  id: string;
  investor_id: string;
  fund_id: string;
  type: TransactionType;
  amount: string; // NUMERIC stored as string
  unit_price: string | null;
  units: string | null;
  status: TransactionStatus;
  description: string | null;
  reference_id: string | null;
  effective_date: string;
  created_at: string;
  updated_at: string;
  
  // Joined relations
  fund?: {
    id: string;
    name: string;
    asset_symbol: string;
  };
}

export interface TransactionWithDetails extends Transaction {
  fund: {
    id: string;
    name: string;
    asset_symbol: string;
    asset_type: string;
  };
}

export interface TransactionFilters {
  search?: string;
  type?: TransactionType | 'all';
  asset?: string | 'all';
  dateFrom?: string;
  dateTo?: string;
  status?: TransactionStatus | 'all';
}

// Grouped transactions for display
export interface TransactionGroup {
  date: string;
  transactions: TransactionWithDetails[];
}

// Helper type for transaction amounts
export interface ParsedTransactionAmount {
  amount: Decimal;
  formatted: string;
  isPositive: boolean;
}
