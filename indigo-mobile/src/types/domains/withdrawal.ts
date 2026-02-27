/**
 * Withdrawal types for Indigo Yield Mobile
 * Mirrors web application types
 */

export type WithdrawalStatus =
  | 'pending_approval'
  | 'approved'
  | 'processing'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export interface WithdrawalRequest {
  id: string;
  investor_id: string;
  fund_id: string;
  amount: string; // NUMERIC stored as string
  status: WithdrawalStatus;
  request_date: string;
  approved_date: string | null;
  completed_date: string | null;
  rejected_date: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined relations
  fund?: {
    id: string;
    name: string;
    asset_symbol: string;
  };
}

export interface WithdrawalRequestWithDetails extends WithdrawalRequest {
  fund: {
    id: string;
    name: string;
    asset_symbol: string;
    asset_type: string;
  };
}

export interface CreateWithdrawalInput {
  fund_id: string;
  amount: string;
  notes?: string;
}

// Status display helpers
export const withdrawalStatusLabels: Record<WithdrawalStatus, string> = {
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  processing: 'Processing',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const withdrawalStatusColors: Record<WithdrawalStatus, 'warning' | 'success' | 'error' | 'default'> = {
  pending_approval: 'warning',
  approved: 'success',
  processing: 'warning',
  completed: 'success',
  rejected: 'error',
  cancelled: 'default',
};
