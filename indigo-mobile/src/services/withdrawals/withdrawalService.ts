/**
 * Withdrawal Service
 * Handles withdrawal requests and available balances
 */
import { supabase, getCurrentUserId, callRPC } from '../api/supabase';
import { 
  WithdrawalRequest, 
  WithdrawalRequestWithDetails, 
  CreateWithdrawalInput,
  WithdrawalStatus 
} from '@/types/domains/withdrawal';
import { FundWithBalance } from '@/types/domains/fund';
import { PAGINATION, API_ENDPOINTS } from '@/utils/constants';

export interface WithdrawalsResult {
  withdrawals: WithdrawalRequestWithDetails[];
  hasMore: boolean;
  totalCount: number;
}

/**
 * Fetch all withdrawal requests for the current investor
 */
export async function getWithdrawals(
  page: number = 0,
  pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE
): Promise<WithdrawalsResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('withdrawal_requests')
    .select(`
      *,
      fund:funds (
        id,
        name,
        asset_symbol,
        asset_type
      )
    `, { count: 'exact' })
    .eq('investor_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching withdrawals:', error);
    throw new Error('Failed to load withdrawal requests');
  }

  const totalCount = count || 0;
  const hasMore = from + (data?.length || 0) < totalCount;

  return {
    withdrawals: (data || []) as WithdrawalRequestWithDetails[],
    hasMore,
    totalCount,
  };
}

/**
 * Get pending withdrawals only
 */
export async function getPendingWithdrawals(): Promise<WithdrawalRequestWithDetails[]> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('withdrawal_requests')
    .select(`
      *,
      fund:funds (
        id,
        name,
        asset_symbol,
        asset_type
      )
    `)
    .eq('investor_id', userId)
    .in('status', ['pending_approval', 'approved', 'processing'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending withdrawals:', error);
    throw new Error('Failed to load pending withdrawals');
  }

  return (data || []) as WithdrawalRequestWithDetails[];
}

/**
 * Get a single withdrawal by ID
 */
export async function getWithdrawalById(withdrawalId: string): Promise<WithdrawalRequestWithDetails | null> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('withdrawal_requests')
    .select(`
      *,
      fund:funds (
        id,
        name,
        asset_symbol,
        asset_type
      )
    `)
    .eq('id', withdrawalId)
    .eq('investor_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching withdrawal:', error);
    throw new Error('Failed to load withdrawal');
  }

  return data as WithdrawalRequestWithDetails;
}

/**
 * Get available balance for a fund
 */
export async function getAvailableBalance(fundId: string): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const result = await callRPC<string>(API_ENDPOINTS.RPC.GET_AVAILABLE_BALANCE, {
    p_investor_id: userId,
    p_fund_id: fundId,
  });

  return result || '0';
}

/**
 * Get funds with available balances
 */
export async function getFundsWithBalances(): Promise<FundWithBalance[]> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  // First get positions
  const { data: positions, error: posError } = await supabase
    .from('investor_positions')
    .select(`
      fund_id,
      fund:funds (
        id,
        name,
        description,
        asset_symbol,
        asset_type,
        current_nav,
        is_active,
        min_investment,
        inception_date,
        created_at,
        updated_at
      )
    `)
    .eq('investor_id', userId)
    .gt('units', 0);

  if (posError) {
    console.error('Error fetching positions for balances:', posError);
    throw new Error('Failed to load fund balances');
  }

  // Get available balance for each fund
  const fundsWithBalances: FundWithBalance[] = [];

  for (const pos of positions || []) {
    const fund = pos.fund as unknown as FundWithBalance;
    try {
      const balance = await getAvailableBalance(fund.id);
      fundsWithBalances.push({
        ...fund,
        available_balance: balance,
      });
    } catch (error) {
      // If balance fetch fails, set to 0
      fundsWithBalances.push({
        ...fund,
        available_balance: '0',
      });
    }
  }

  return fundsWithBalances;
}

/**
 * Create a new withdrawal request
 */
export async function createWithdrawal(input: CreateWithdrawalInput): Promise<WithdrawalRequest> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const result = await callRPC<WithdrawalRequest>(API_ENDPOINTS.RPC.CREATE_WITHDRAWAL_REQUEST, {
    p_investor_id: userId,
    p_fund_id: input.fund_id,
    p_amount: input.amount,
    p_notes: input.notes || null,
  });

  if (!result) {
    throw new Error('Failed to create withdrawal request');
  }

  return result;
}

/**
 * Cancel a pending withdrawal request
 */
export async function cancelWithdrawal(withdrawalId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  await callRPC<void>(API_ENDPOINTS.RPC.CANCEL_WITHDRAWAL_REQUEST, {
    p_withdrawal_id: withdrawalId,
    p_investor_id: userId,
  });
}

/**
 * Check if a withdrawal can be cancelled
 */
export function canCancelWithdrawal(status: WithdrawalStatus): boolean {
  return status === 'pending_approval';
}
