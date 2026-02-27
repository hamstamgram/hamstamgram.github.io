/**
 * Transaction Service
 * Handles transaction history and details
 */
import { supabase, getCurrentUserId } from '../api/supabase';
import { 
  Transaction, 
  TransactionWithDetails, 
  TransactionFilters,
  TransactionGroup,
  TransactionType 
} from '@/types/domains/transaction';
import { formatDateGroup } from '@/utils/formatting/date';
import { PAGINATION } from '@/utils/constants';

export interface TransactionsResult {
  transactions: TransactionWithDetails[];
  hasMore: boolean;
  totalCount: number;
}

/**
 * Fetch transactions with filters and pagination
 */
export async function getTransactions(
  filters: TransactionFilters = {},
  page: number = 0,
  pageSize: number = PAGINATION.TRANSACTIONS_PAGE_SIZE
): Promise<TransactionsResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  let query = supabase
    .from('transactions_v2')
    .select(`
      *,
      fund:funds (
        id,
        name,
        asset_symbol,
        asset_type
      )
    `, { count: 'exact' })
    .eq('investor_id', userId);

  // Apply filters
  if (filters.type && filters.type !== 'all') {
    query = query.eq('type', filters.type);
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.asset && filters.asset !== 'all') {
    query = query.eq('fund.asset_symbol', filters.asset);
  }

  if (filters.dateFrom) {
    query = query.gte('effective_date', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('effective_date', filters.dateTo);
  }

  if (filters.search) {
    query = query.or(`description.ilike.%\${filters.search}%,reference_id.ilike.%\${filters.search}%`);
  }

  // Apply pagination and ordering
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('effective_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching transactions:', error);
    throw new Error('Failed to load transactions');
  }

  const totalCount = count || 0;
  const hasMore = from + (data?.length || 0) < totalCount;

  return {
    transactions: (data || []) as TransactionWithDetails[],
    hasMore,
    totalCount,
  };
}

/**
 * Get transactions grouped by date
 */
export async function getTransactionsGrouped(
  filters: TransactionFilters = {},
  page: number = 0
): Promise<{ groups: TransactionGroup[]; hasMore: boolean }> {
  const { transactions, hasMore } = await getTransactions(filters, page);

  // Group by date
  const groupMap = new Map<string, TransactionWithDetails[]>();

  for (const tx of transactions) {
    const dateKey = tx.effective_date.split('T')[0];
    const existing = groupMap.get(dateKey) || [];
    groupMap.set(dateKey, [...existing, tx]);
  }

  const groups: TransactionGroup[] = Array.from(groupMap.entries()).map(([date, txs]) => ({
    date: formatDateGroup(date),
    transactions: txs,
  }));

  return { groups, hasMore };
}

/**
 * Get a single transaction by ID
 */
export async function getTransactionById(transactionId: string): Promise<TransactionWithDetails | null> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('transactions_v2')
    .select(`
      *,
      fund:funds (
        id,
        name,
        asset_symbol,
        asset_type
      )
    `)
    .eq('id', transactionId)
    .eq('investor_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching transaction:', error);
    throw new Error('Failed to load transaction');
  }

  return data as TransactionWithDetails;
}

/**
 * Get recent activity (last N transactions)
 */
export async function getRecentActivity(limit: number = 5): Promise<TransactionWithDetails[]> {
  const { transactions } = await getTransactions({}, 0, limit);
  return transactions;
}

/**
 * Get transaction type display info
 */
export function getTransactionTypeInfo(type: TransactionType): {
  label: string;
  color: 'success' | 'error' | 'warning' | 'default';
  isPositive: boolean;
} {
  switch (type) {
    case 'DEPOSIT':
      return { label: 'Deposit', color: 'success', isPositive: true };
    case 'WITHDRAWAL':
      return { label: 'Withdrawal', color: 'error', isPositive: false };
    case 'INTEREST':
      return { label: 'Interest', color: 'success', isPositive: true };
    case 'YIELD':
      return { label: 'Yield', color: 'success', isPositive: true };
    case 'FEE':
      return { label: 'Fee', color: 'warning', isPositive: false };
    case 'ADJUSTMENT':
      return { label: 'Adjustment', color: 'default', isPositive: true };
    default:
      return { label: type, color: 'default', isPositive: true };
  }
}
