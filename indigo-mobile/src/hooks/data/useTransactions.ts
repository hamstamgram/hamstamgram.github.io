/**
 * Transactions Hook
 * TanStack Query hooks for transaction data
 */

import { useQuery } from '@tanstack/react-query';
import { getTransactions, getTransactionById, getRecentActivity } from '../../services/transactions/transactionService';
import { QUERY_KEYS, CACHE_TIMES } from '../../utils/constants';
import type { TransactionFilters } from '../../types/domains/transaction';

/**
 * Hook to fetch transactions with optional filtering
 */
export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: [QUERY_KEYS.TRANSACTIONS, filters],
    queryFn: () => getTransactions(filters),
    staleTime: CACHE_TIMES.TRANSACTIONS,
  });
}

/**
 * Hook to fetch a single transaction
 */
export function useTransaction(transactionId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEYS.TRANSACTIONS, transactionId],
    queryFn: () => getTransactionById(transactionId!),
    enabled: !!transactionId,
    staleTime: CACHE_TIMES.TRANSACTIONS,
  });
}

/**
 * Hook to fetch recent transactions for dashboard
 */
export function useRecentTransactions(limit: number = 5) {
  return useQuery({
    queryKey: [QUERY_KEYS.TRANSACTIONS, 'recent', limit],
    queryFn: () => getRecentActivity(limit),
    staleTime: CACHE_TIMES.TRANSACTIONS,
  });
}
